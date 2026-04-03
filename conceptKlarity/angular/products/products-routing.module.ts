import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProductListComponent } from '../product-list.component';
import { AuthGuard } from '../guards/auth.guard';

const routes: Routes = [
  { path: '', component: ProductListComponent, canActivate: [] }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProductsRoutingModule {}
