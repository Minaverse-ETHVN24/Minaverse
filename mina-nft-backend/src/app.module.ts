import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NftContractService } from './nft-contract/nft-contract.service';
import { IpfsService } from './ipfs/ipfs.service';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { Network } from './network/network';
import { NftAction, NftActionSchema } from './schemas/nft-action.schema';
import { NftMetadata, NftMetadataSchema } from './schemas/nft-metadata.schema';
import { QueryService } from './query/query.service';
import {
    UpdateMarketItemEvent,
    UpdateMarketItemEventSchema,
} from './schemas/update-market-item-event.schema';
import { MarketItem } from './nft-contract/nft-contract';
import { MarketItemEventSchema } from './schemas/market-item.schema';
import { CrontasksService } from './crontasks/crontasks.service';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
    imports: [
        MongooseModule.forRoot(process.env.DB, {
            connectTimeoutMS: 10000,
            socketTimeoutMS: 10000,
        }),
        MongooseModule.forFeature([
            { name: NftAction.name, schema: NftActionSchema },
            { name: NftMetadata.name, schema: NftMetadataSchema },
            {
                name: UpdateMarketItemEvent.name,
                schema: UpdateMarketItemEventSchema,
            },
            {
                name: MarketItem.name,
                schema: MarketItemEventSchema,
            },
        ]),
        HttpModule,
        ScheduleModule.forRoot(),
    ],
    controllers: [AppController],
    providers: [
        AppService,
        NftContractService,
        IpfsService,
        Network,
        QueryService,
        CrontasksService,
    ],
})
export class AppModule {}
