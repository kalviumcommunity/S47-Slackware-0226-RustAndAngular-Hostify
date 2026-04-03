import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductListComponent } from '../product-list.component';
import { ProductsRoutingModule } from './products-routing.module';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [ProductListComponent],
  imports: [CommonModule, FormsModule, SharedModule, ProductsRoutingModule]
})
export class ProductsModule {}
