import {
    BadRequestException,
    Injectable,
    OnModuleInit,
    Redirect,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { QueryService } from 'src/query/query.service';
import { NftAction, getNftMetadata } from 'src/schemas/nft-action.schema';
import { NftMetadata } from 'src/schemas/nft-metadata.schema';
import { Action } from 'src/interfaces/action.interface';
import {
    Cache,
    Field,
    Mina,
    PrivateKey,
    PublicKey,
    Reducer,
    UInt64,
    fetchAccount,
} from 'o1js';
import {
    UpdateMarketItemEvent,
    getMarketItem,
} from 'src/schemas/update-market-item-event.schema';
import { Event } from 'src/interfaces/event.interface';
import { MAX_NFT_ITEM } from 'src/constants';
import {
    IpfsHashStorage,
    MarketItem,
    NFT,
    OwnerStorage,
    PriceStorage,
} from './nft-contract';
import { IpfsHash } from '@auxo-dev/auxo-libs';

@Injectable()
export class NftContractService implements OnModuleInit {
    private _ownerStorage: OwnerStorage;
    private _ipfsHashStorage: IpfsHashStorage;
    private _priceStorage: PriceStorage;

    get ownerStorage(): OwnerStorage {
        return this._ownerStorage;
    }
    get ipfsHashStorage(): IpfsHashStorage {
        return this._ipfsHashStorage;
    }
    get priceStorage(): PriceStorage {
        return this._priceStorage;
    }

    constructor(
        private readonly queryService: QueryService,
        @InjectModel(NftAction.name)
        private readonly nftActionModel: Model<NftAction>,
        @InjectModel(NftMetadata.name)
        private readonly nftMetadataModel: Model<NftMetadata>,
        @InjectModel(UpdateMarketItemEvent.name)
        private readonly updateMarketItemEventModel: Model<UpdateMarketItemEvent>,
        @InjectModel(MarketItem.name)
        private readonly marketItemModel: Model<MarketItem>,
    ) {
        this._ownerStorage = new OwnerStorage();
        this._ipfsHashStorage = new IpfsHashStorage();
        this._priceStorage = new PriceStorage();
    }

    async onModuleInit() {
        try {
            await NFT.compile({ cache: Cache.FileSystem('./cache') });
            await this.update();
        } catch (err) {
            console.log(err);
        }
    }

    async update() {
        await this.fetchActions();
        await this.fetchEvents();
        await this.updateNftMetadata();
        await this.updateMarketItem();
        await this.updateStorage();
    }

    async fetchActions() {
        const lastAction = await this.nftActionModel.findOne(
            {},
            {},
            { sort: { actionId: -1 } },
        );
        let actions: Action[] = await this.queryService.fetchActions(
            process.env.NFT_CONTRACT_ADDRESS,
        );
        let previousActionState: Field;
        let actionId: number;
        if (!lastAction) {
            previousActionState = Reducer.initialActionState;
            actionId = 0;
        } else {
            actions = actions.slice(lastAction.actionId + 1);
            previousActionState = Field(lastAction.currentActionState);
            actionId = lastAction.actionId + 1;
        }
        for (let i = 0; i < actions.length; i++) {
            const action = actions[i];
            const currentActionState = Field(action.hash);
            const nftMetadata = getNftMetadata(action.actions[0]);
            await this.nftActionModel.findOneAndUpdate(
                {
                    actionId: actionId,
                },
                {
                    actionId: actionId,
                    currentActionState: currentActionState.toString(),
                    previousActionState: previousActionState.toString(),
                    actions: action.actions[0],
                    id: nftMetadata.id,
                    owner: nftMetadata.owner,
                    ipfsHash: nftMetadata.ipfsHash,
                },
                { new: true, upsert: true },
            );
            previousActionState = currentActionState;
            actionId += 1;
        }
    }

    async updateNftMetadata() {
        for (let id = 0; id < MAX_NFT_ITEM; id++) {
            const nftActions = await this.nftActionModel.find(
                { id: id },
                {},
                {
                    sort: {
                        actionId: 1,
                    },
                },
            );
            if (nftActions.length > 0) {
                const firstNftAction = nftActions[0];
                const lastNftAction = nftActions[nftActions.length - 1];
                await this.nftMetadataModel.findOneAndUpdate(
                    {
                        id: id,
                    },
                    {
                        id: id,
                        owner: lastNftAction.owner,
                        ipfsHash: firstNftAction.ipfsHash,
                    },
                    { new: true, upsert: true },
                );
            }
        }
    }

    async fetchEvents() {
        const lastEvent = await this.updateMarketItemEventModel.findOne(
            {},
            {},
            { sort: { eventId: -1 } },
        );
        let events: Event[] = await this.queryService.fetchEvents(
            process.env.NFT_CONTRACT_ADDRESS,
        );
        let eventId: number;
        if (!lastEvent) {
            eventId = 0;
        } else {
            events = events.slice(lastEvent.eventId + 1);
            eventId = lastEvent.eventId + 1;
        }
        for (let i = 0; i < events.length; i++) {
            const event = events[i];
            const eventData = event.events[0].data;
            const marketItem = getMarketItem(eventData);
            await this.updateMarketItemEventModel.findOneAndUpdate(
                {
                    eventId: eventId,
                },
                {
                    eventId: eventId,
                    id: marketItem.id,
                    price: marketItem.price,
                },
                { new: true, upsert: true },
            );
            eventId += 1;
        }
    }

    async updateMarketItem() {
        for (let id = 0; id < MAX_NFT_ITEM; id++) {
            const lastUpdateMarketItemEvent =
                await this.updateMarketItemEventModel.findOne(
                    { id: id },
                    {},
                    { sort: { eventId: -1 } },
                );
            if (lastUpdateMarketItemEvent) {
                await this.marketItemModel.findOneAndUpdate(
                    {
                        id: id,
                    },
                    {
                        id: lastUpdateMarketItemEvent.id,
                        price: lastUpdateMarketItemEvent.price,
                    },
                    { new: true, upsert: true },
                );
            }
        }
    }

    async updateStorage() {
        for (let id = 0; id < MAX_NFT_ITEM; id++) {
            const nftMetadata = await this.nftMetadataModel.findOne({
                id: id,
            });
            if (nftMetadata) {
                this._ownerStorage.updateLeaf(
                    Field(id),
                    OwnerStorage.calculateLeaf(
                        PublicKey.fromBase58(nftMetadata.owner),
                    ),
                );
                this._ipfsHashStorage.updateLeaf(
                    Field(id),
                    IpfsHashStorage.calculateLeaf(
                        IpfsHash.fromString(nftMetadata.ipfsHash),
                    ),
                );
            }
            const marketItem = await this.marketItemModel.findOne({
                id: id,
            });
            if (marketItem) {
                this._priceStorage.updateLeaf(
                    Field(id),
                    PriceStorage.calculateLeaf(new UInt64(marketItem.price)),
                );
            }
        }
    }

    async buy(privateKey: PrivateKey, id: number): Promise<string> {
        try {
            const marketItem = await this.marketItemModel.findOne({ id: id });
            const nftMetadata = await this.nftMetadataModel.findOne({ id: id });
            const nftContract = new NFT(
                PublicKey.fromBase58(process.env.NFT_CONTRACT_ADDRESS),
            );
            const account = await fetchAccount({
                publicKey: privateKey.toPublicKey(),
            });
            const tx = await Mina.transaction(
                {
                    sender: privateKey.toPublicKey(),
                    fee: 1e8,
                    nonce: Number(account.account.nonce),
                },
                () => {
                    nftContract.buy(
                        Field(id),
                        new UInt64(marketItem.price),
                        this._priceStorage.getWitness(Field(id)),
                        PublicKey.fromBase58(nftMetadata.owner),
                        this._ownerStorage.getWitness(Field(id)),
                    );
                },
            );
            await tx.prove();
            const result = await tx.sign([privateKey]).send();
            const txHash = result.hash;
            return txHash;
        } catch (err) {
            throw new BadRequestException(err);
        }
    }

    async sell(privateKey: PrivateKey, id: number, price: number) {
        try {
            const nftContract = new NFT(
                PublicKey.fromBase58(process.env.NFT_CONTRACT_ADDRESS),
            );
            const account = await fetchAccount({
                publicKey: privateKey.toPublicKey(),
            });
            const tx = await Mina.transaction(
                {
                    sender: privateKey.toPublicKey(),
                    fee: 1e8,
                    nonce: Number(account.account.nonce),
                },
                () => {
                    nftContract.createMarketItem(
                        Field(id),
                        new UInt64(price),
                        this._ownerStorage.getWitness(Field(id)),
                        this._priceStorage.getWitness(Field(id)),
                    );
                },
            );
            await tx.prove();
            const result = await tx.sign([privateKey]).send();
            const txHash = result.hash;
            return txHash;
        } catch (err) {
            throw new BadRequestException(err);
        }
    }
}
