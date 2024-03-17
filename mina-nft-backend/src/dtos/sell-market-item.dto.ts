import { IsNumber, IsString, IsUrl } from 'class-validator';

export class SellMarketItemDto {
    @IsString()
    privateKey: string;

    @IsNumber()
    id: number;

    @IsNumber()
    price: number;
}
