import { Test, TestingModule } from '@nestjs/testing';
import { NftContractService } from './nft-contract.service';

describe('NftContractService', () => {
    let service: NftContractService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [NftContractService],
        }).compile();

        service = module.get<NftContractService>(NftContractService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
