import { Controller, Get } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('api/products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  getProducts() {
    return this.productsService.findAll();
  }
}
