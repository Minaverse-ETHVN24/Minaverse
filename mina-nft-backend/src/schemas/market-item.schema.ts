import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Encoding, Field, Provable, PublicKey } from 'o1js';
import { Metadata } from 'src/nft-contract/nft-contract';
import { Utilities } from 'src/utilities';
import { NftMetadata } from './nft-metadata.schema';

@Schema({ versionKey: false })
export class MarketItem {
    @Prop({ required: true, unique: true, index: true, _id: true })
    id: number;

    @Prop()
    price: number;
}

export type MarketItemDocument = HydratedDocument<MarketItem>;
export const MarketItemEventSchema = SchemaFactory.createForClass(MarketItem);
