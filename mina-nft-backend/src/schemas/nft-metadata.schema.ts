import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Encoding, Field, Provable, PublicKey } from 'o1js';
import { Metadata } from 'src/nft-contract/nft-contract';
import { Utilities } from 'src/utilities';

@Schema({ versionKey: false })
export class NftMetadata {
    @Prop({ required: true, unique: true, index: true, _id: true })
    id: number;

    @Prop()
    owner: string;

    @Prop()
    ipfsHash: string;
}

export type NftMetadataDocument = HydratedDocument<NftMetadata>;
export const NftMetadataSchema = SchemaFactory.createForClass(NftMetadata);
