import { IsString, IsUrl } from 'class-validator';

export class CraftNftDto {
    @IsString()
    name: string;

    @IsString()
    description: string;

    @IsUrl()
    imageUrl: string;
}
