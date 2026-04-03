import { Component, OnInit, OnDestroy } from '@angular/core';
import { ProductService } from './product.service';
import { Product, CreateProductRequest } from './src/app/models/product.model';
import { StateService } from './services/state.service';
import { Subscription } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html'
})
export class ProductListComponent implements OnInit {
  items: Product[] = [];
  newName = '';
  newPrice = 0;
  newDescription = '';
  loadingList = false; // for GET
  submitting = false; // for POST
  error = '';
  private subs: Subscription[] = [];

  constructor(private svc: ProductService, private state: StateService) {}

  ngOnInit(): void {
    // subscribe to the shared state (single source of truth)
    this.subs.push(this.state.items$.subscribe(items => this.items = items));
    this.load();
  }

  load(): void {
    this.loadingList = true;
    this.svc.getProducts().subscribe({
      next: (data) => { this.state.setItems(data); console.log('Typed products:', data); this.loadingList = false; },
      error: (err: HttpErrorResponse) => { this.error = this.formatHttpError(err, 'Failed to load items'); this.loadingList = false; }
    });
  }

  add(): void {
    if (!this.newName) { this.error = 'Name required'; return; }
    this.submitting = true;
    const payload: CreateProductRequest = { name: this.newName, price: this.newPrice, description: this.newDescription || undefined };
    this.svc.createProduct(payload).subscribe({
      next: (item) => {
        // update shared state instead of local push
        const current = this.state.getItemsSnapshot();
        this.state.setItems([...current, item]);
        this.newName = ''; this.newPrice = 0; this.newDescription = ''; this.submitting = false; this.error = '';
      },
      error: (err: HttpErrorResponse) => { this.error = this.formatHttpError(err, 'Create failed'); this.submitting = false; }
    });
  }

  private formatHttpError(err: HttpErrorResponse, fallback: string): string {
    if (!err) return fallback;
    if (err.status === 0) return 'Network error — cannot reach server';
    if (err.status === 401 || err.status === 403) return 'Unauthorized — please login';
    if (err.status === 400) return 'Invalid request (bad input)';
    if (err.status >= 500) return 'Server error — try again later';
    return fallback;
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }
}
