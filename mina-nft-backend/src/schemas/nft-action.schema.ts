import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Encoding, Field, Provable, PublicKey } from 'o1js';
import { Metadata } from 'src/nft-contract/nft-contract';
import { Utilities } from 'src/utilities';
import { NftMetadata } from './nft-metadata.schema';

@Schema({ versionKey: false })
export class NftAction {
    @Prop({ required: true, unique: true, index: true, _id: true })
    actionId: number;

    @Prop({ required: true, unique: true })
    currentActionState: string;

    @Prop({ required: true, unique: true })
    previousActionState: string;

    @Prop()
    actions: string[];

    @Prop()
    id?: number;

    @Prop()
    owner?: string;

    @Prop()
    ipfsHash?: string;
}

export type NftActionDocument = HydratedDocument<NftAction>;
export const NftActionSchema = SchemaFactory.createForClass(NftAction);

export function getNftMetadata(actionData: string[]): NftMetadata {
    const action = Metadata.fromFields(
        Utilities.stringArrayToFields(actionData),
    );
    const nftMetadata: NftMetadata = {
        id: Number(action.id.toString()),
        owner: action.owner.toBase58(),
        ipfsHash: action.ipfsHash.toString(),
    };
    return nftMetadata;
}
