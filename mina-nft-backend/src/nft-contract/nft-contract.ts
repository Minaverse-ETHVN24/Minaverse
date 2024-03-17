import {
    Field,
    SmartContract,
    state,
    State,
    method,
    Struct,
    Reducer,
    Provable,
    UInt32,
    UInt64,
    Bool,
    Scalar,
    Group,
    PublicKey,
    MerkleTree,
    MerkleWitness,
    Poseidon,
    AccountUpdate,
} from 'o1js';
import { IpfsHash } from '@auxo-dev/auxo-libs';

export class Metadata extends Struct({
    id: Field,
    owner: PublicKey,
    ipfsHash: IpfsHash,
}) {}

export class MarketItem extends Struct({
    id: Field,
    price: UInt64,
}) {}

export const NFT_TREE_HEIGHT = 5;

export class NftWitness extends MerkleWitness(NFT_TREE_HEIGHT) {}

export const EMPTY_NFT_TREE = () => new MerkleTree(NFT_TREE_HEIGHT);

export const DefaultRootForNftTree = EMPTY_NFT_TREE().getRoot();

export class OwnerStorage {
    private _tree: MerkleTree;
    private _leafs: {
        [key: string]: Field;
    };

    constructor(leafs?: { index: Field; leaf: Field }[]) {
        this._tree = EMPTY_NFT_TREE();
        this._leafs = {};
        if (leafs) {
            for (let i = 0; i < leafs.length; i++) {
                this.updateLeaf(leafs[i].index, leafs[i].leaf);
            }
        }
    }

    get root(): Field {
        return this._tree.getRoot();
    }

    get leafs(): { [key: string]: Field } {
        return this._leafs;
    }

    getWitness(index: Field) {
        return new NftWitness(this._tree.getWitness(index.toBigInt()));
    }

    updateLeaf(index: Field, leaf: Field) {
        this._tree.setLeaf(index.toBigInt(), leaf);
        this._leafs[index.toString()] = leaf;
    }

    static calculateLeaf(owner: PublicKey): Field {
        return Poseidon.hash(owner.toFields());
    }
}

export class IpfsHashStorage {
    private _tree: MerkleTree;
    private _leafs: {
        [key: string]: Field;
    };

    constructor(leafs?: { index: Field; leaf: Field }[]) {
        this._tree = EMPTY_NFT_TREE();
        this._leafs = {};
        if (leafs) {
            for (let i = 0; i < leafs.length; i++) {
                this.updateLeaf(leafs[i].index, leafs[i].leaf);
            }
        }
    }

    get root(): Field {
        return this._tree.getRoot();
    }

    get leafs(): { [key: string]: Field } {
        return this._leafs;
    }

    getWitness(index: Field) {
        return new NftWitness(this._tree.getWitness(index.toBigInt()));
    }

    updateLeaf(index: Field, leaf: Field) {
        this._tree.setLeaf(index.toBigInt(), leaf);
        this._leafs[index.toString()] = leaf;
    }

    static calculateLeaf(ipfsHash: IpfsHash): Field {
        return ipfsHash.hash();
    }
}

export class PriceStorage {
    private _tree: MerkleTree;
    private _leafs: {
        [key: string]: Field;
    };

    constructor(leafs?: { index: Field; leaf: Field }[]) {
        this._tree = EMPTY_NFT_TREE();
        this._leafs = {};
        if (leafs) {
            for (let i = 0; i < leafs.length; i++) {
                this.updateLeaf(leafs[i].index, leafs[i].leaf);
            }
        }
    }

    get root(): Field {
        return this._tree.getRoot();
    }

    get leafs(): { [key: string]: Field } {
        return this._leafs;
    }

    getWitness(index: Field) {
        return new NftWitness(this._tree.getWitness(index.toBigInt()));
    }

    updateLeaf(index: Field, leaf: Field) {
        this._tree.setLeaf(index.toBigInt(), leaf);
        this._leafs[index.toString()] = leaf;
    }

    static calculateLeaf(price: UInt64): Field {
        return Field.fromFields(price.toFields());
    }
}

export class NFT extends SmartContract {
    events = {
        'update-market-item': MarketItem,
    };

    @state(Field) nextNftId = State<Field>();
    @state(Field) ownerRoot = State<Field>();
    @state(Field) ipfsHashRoot = State<Field>();
    @state(Field) priceRoot = State<Field>();

    reducer = Reducer({ actionType: Metadata });

    init(): void {
        super.init();
        this.ownerRoot.set(DefaultRootForNftTree);
        this.ipfsHashRoot.set(DefaultRootForNftTree);
        this.priceRoot.set(DefaultRootForNftTree);
    }

    @method mint(
        ipfsHash: IpfsHash,
        ownerWitness: NftWitness,
        ipfsHashWitness: NftWitness,
    ) {
        const nextNftId = this.nextNftId.getAndRequireEquals();

        ownerWitness.calculateIndex().assertEquals(nextNftId);
        ipfsHashWitness.calculateIndex().assertEquals(nextNftId);

        ownerWitness
            .calculateRoot(Field(0))
            .assertEquals(this.ownerRoot.getAndRequireEquals());
        ipfsHashWitness
            .calculateRoot(Field(0))
            .assertEquals(this.ipfsHashRoot.getAndRequireEquals());

        this.ownerRoot.set(
            ownerWitness.calculateRoot(OwnerStorage.calculateLeaf(this.sender)),
        );
        this.ipfsHashRoot.set(
            ipfsHashWitness.calculateRoot(
                IpfsHashStorage.calculateLeaf(ipfsHash),
            ),
        );
        this.nextNftId.set(nextNftId.add(1));
        this.reducer.dispatch(
            new Metadata({
                id: nextNftId,
                owner: this.sender,
                ipfsHash: ipfsHash,
            }),
        );
    }

    @method transfer(
        id: Field,
        ownerWitness: NftWitness,
        priceWitness: NftWitness,
        to: PublicKey,
    ) {
        this.isOwner(id, ownerWitness).assertTrue();
        this.isNotOnMarketplace(id, priceWitness).assertTrue();

        this.ownerRoot.set(
            ownerWitness.calculateRoot(OwnerStorage.calculateLeaf(to)),
        );
        this.reducer.dispatch(
            new Metadata({ id: id, owner: to, ipfsHash: IpfsHash.empty() }),
        );
    }

    @method createMarketItem(
        id: Field,
        price: UInt64,
        ownerWitness: NftWitness,
        priceWitness: NftWitness,
    ) {
        this.isOwner(id, ownerWitness).assertTrue();
        this.isNotOnMarketplace(id, priceWitness).assertTrue();

        this.priceRoot.set(
            priceWitness.calculateRoot(Field.fromFields(price.toFields())),
        );

        this.emitEvent(
            'update-market-item',
            new MarketItem({ id: id, price: price }),
        );
    }

    @method buy(
        id: Field,
        price: UInt64,
        priceWitness: NftWitness,
        currentOwner: PublicKey,
        currentOwnerWitness: NftWitness,
    ) {
        this.isNotOnMarketplace(id, priceWitness).assertFalse();
        priceWitness
            .calculateRoot(PriceStorage.calculateLeaf(price))
            .assertEquals(this.priceRoot.getAndRequireEquals());
        this.isCurrentOwner(id, currentOwner, currentOwnerWitness).assertTrue();
        const sender = AccountUpdate.createSigned(this.sender);
        sender.send({ to: AccountUpdate.create(currentOwner), amount: price });

        this.ownerRoot.set(
            currentOwnerWitness.calculateRoot(
                OwnerStorage.calculateLeaf(this.sender),
            ),
        );
        this.priceRoot.set(
            priceWitness.calculateRoot(
                PriceStorage.calculateLeaf(new UInt64(0)),
            ),
        );

        this.emitEvent(
            'update-market-item',
            new MarketItem({ id: id, price: new UInt64(0) }),
        );
        this.reducer.dispatch(
            new Metadata({
                id: id,
                owner: this.sender,
                ipfsHash: IpfsHash.empty(),
            }),
        );
    }

    isOwner(id: Field, ownerWitness: NftWitness): Bool {
        return ownerWitness
            .calculateIndex()
            .equals(id)
            .and(
                ownerWitness
                    .calculateRoot(OwnerStorage.calculateLeaf(this.sender))
                    .equals(this.ownerRoot.getAndRequireEquals()),
            );
    }

    isCurrentOwner(
        id: Field,
        currentOwner: PublicKey,
        currentOwnerWitness: NftWitness,
    ): Bool {
        return currentOwnerWitness
            .calculateIndex()
            .equals(id)
            .and(
                currentOwnerWitness
                    .calculateRoot(OwnerStorage.calculateLeaf(currentOwner))
                    .equals(this.ownerRoot.getAndRequireEquals()),
            );
    }

    isNotOnMarketplace(id: Field, priceWitness: NftWitness): Bool {
        return priceWitness
            .calculateIndex()
            .equals(id)
            .and(
                priceWitness
                    .calculateRoot(Field(0))
                    .equals(this.priceRoot.getAndRequireEquals()),
            );
    }
}
