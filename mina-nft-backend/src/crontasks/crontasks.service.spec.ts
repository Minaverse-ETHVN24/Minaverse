import { Test, TestingModule } from '@nestjs/testing';
import { CrontasksService } from './crontasks.service';

describe('CrontasksService', () => {
  let service: CrontasksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CrontasksService],
    }).compile();

    service = module.get<CrontasksService>(CrontasksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
