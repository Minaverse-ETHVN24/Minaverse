import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { NftContractService } from 'src/nft-contract/nft-contract.service';

@Injectable()
export class CrontasksService {
    constructor(private readonly nftContractService: NftContractService) {}

    @Interval(180000)
    async updateNft() {
        try {
            await this.nftContractService.update();
        } catch (err) {
            console.log(err);
        }
    }
}
