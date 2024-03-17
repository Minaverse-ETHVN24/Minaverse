import { IsNumber, IsString, IsUrl } from 'class-validator';

export class BuyMarketItemDto {
    @IsString()
    privateKey: string;

    @IsNumber()
    id: number;
}
