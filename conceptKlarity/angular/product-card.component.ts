import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from './shared/shared.module';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, SharedModule],
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.css']
})
export class ProductCardComponent {
  productName = 'Wireless Mouse';
  price = 899; // price in cents or smallest unit
  inCart = false;
  favorite = false;

  addToCart(): void {
    this.inCart = true;
  }

  toggleFavorite(): void {
    this.favorite = !this.favorite;
  }
}
