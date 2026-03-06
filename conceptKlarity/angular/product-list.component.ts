import { Component, OnInit } from '@angular/core';
import { ProductService, Product } from './product.service';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html'
})
export class ProductListComponent implements OnInit {
  items: Product[] = [];
  newName = '';
  newQty = 1;
  loading = false;
  error = '';

  constructor(private svc: ProductService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.svc.getItems().subscribe({
      next: (data) => { this.items = data; this.loading = false; },
      error: () => { this.error = 'Failed to load items'; this.loading = false; }
    });
  }

  add(): void {
    if (!this.newName) { this.error = 'Name required'; return; }
    this.loading = true;
    this.svc.createItem({ name: this.newName, qty: this.newQty }).subscribe({
      next: (item) => { this.items.push(item); this.newName = ''; this.newQty = 1; this.loading = false; },
      error: () => { this.error = 'Create failed'; this.loading = false; }
    });
  }
}
