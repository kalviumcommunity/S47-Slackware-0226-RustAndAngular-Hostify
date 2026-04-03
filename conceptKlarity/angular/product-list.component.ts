import { Component, OnInit, OnDestroy } from '@angular/core';
import { ProductService } from './product.service';
import { Product } from './src/app/models/product.model';
import { StateService } from './services/state.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html'
})
export class ProductListComponent implements OnInit {
  items: Product[] = [];
  newName = '';
  newPrice = 0;
  newDescription = '';
  loading = false;
  error = '';
  private subs: Subscription[] = [];

  constructor(private svc: ProductService, private state: StateService) {}

  ngOnInit(): void {
    // subscribe to the shared state (single source of truth)
    this.subs.push(this.state.items$.subscribe(items => this.items = items));
    this.load();
  }

  load(): void {
    this.loading = true;
    this.svc.getProducts().subscribe({
      next: (data) => { this.state.setItems(data); console.log('Typed products:', data); this.loading = false; },
      error: () => { this.error = 'Failed to load items'; this.loading = false; }
    });
  }

  add(): void {
    if (!this.newName) { this.error = 'Name required'; return; }
    this.loading = true;
    this.svc.createProduct({ name: this.newName, price: this.newPrice, description: this.newDescription || undefined }).subscribe({
      next: (item) => {
        // update shared state instead of local push
        const current = this.state.getItemsSnapshot();
        this.state.setItems([...current, item]);
        this.newName = ''; this.newPrice = 0; this.newDescription = ''; this.loading = false;
      },
      error: () => { this.error = 'Create failed'; this.loading = false; }
    });
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }
}
