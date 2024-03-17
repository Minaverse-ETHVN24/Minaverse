import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Encoding, Field, Provable, PublicKey } from 'o1js';
import { Metadata } from 'src/nft-contract/nft-contract';
import { Utilities } from 'src/utilities';
import { NftMetadata } from './nft-metadata.schema';
import { MarketItem } from './market-item.schema';

@Schema({ versionKey: false })
export class UpdateMarketItemEvent {
    @Prop({ required: true, unique: true, index: true, _id: true })
    eventId: number;

    @Prop()
    id: number;

    @Prop()
    price: number;
}

export type UpdateMarketItemEventDocument =
    HydratedDocument<UpdateMarketItemEvent>;
export const UpdateMarketItemEventSchema = SchemaFactory.createForClass(
    UpdateMarketItemEvent,
);

export function getMarketItem(eventData: string[]): MarketItem {
    const marketItem: MarketItem = {
        id: Number(eventData[0]),
        price: Number(eventData[1]),
    };
    return marketItem;
}
