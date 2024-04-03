import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min, ValidateNested } from 'class-validator';

export class ReplaceWithProduct {
  @IsInt()
  product_id: number;
  @IsInt()
  @Min(1)
  quantity: number;
}

export class UpdateOrderProductDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => ReplaceWithProduct)
  replaced_with: ReplaceWithProduct;

  @IsInt()
  @Min(0)
  @IsOptional()
  quantity: number;
}
