import { IsInt } from 'class-validator';

export class AddProductsToOrderDto {
  @IsInt({ each: true })
  product_ids: number[];
}
