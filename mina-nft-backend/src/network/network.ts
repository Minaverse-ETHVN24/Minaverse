import { Injectable, OnModuleInit } from '@nestjs/common';
import { Mina, fetchLastBlock, fetchTransactionStatus } from 'o1js';
import { MinaScanNetwork } from 'src/constants';

@Injectable()
export class Network implements OnModuleInit {
    constructor() {
        Mina.setActiveInstance(MinaScanNetwork);
    }

    async onModuleInit() {
        //
    }
}
