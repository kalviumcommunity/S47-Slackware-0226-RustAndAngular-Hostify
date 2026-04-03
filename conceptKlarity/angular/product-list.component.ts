import { Component, OnInit, OnDestroy } from '@angular/core';
import { ProductService } from './product.service';
import { Product, CreateProductRequest } from './src/app/models/product.model';
import { StateService } from './services/state.service';
import { Subscription, of, Observable } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { formatHttpError } from './services/api-utils';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html'
})
export class ProductListComponent implements OnInit, OnDestroy {
  items$!: Observable<Product[]>; // expose observable for async pipe (initialized in ngOnInit)
  newName = '';
  newPrice = 0;
  newDescription = '';
  loadingList = false; // for GET
  submitting = false; // for POST
  error = '';
  private subs: Subscription[] = [];

  constructor(private svc: ProductService, private state: StateService) {}

  ngOnInit(): void {
    // expose state observable for template and perform initial load
    this.items$ = this.state.items$;
    this.load();
  }

  load(): void {
    this.loadingList = true;
    const s = this.svc.getProducts().pipe(
      tap(() => this.error = ''),
      catchError((err: HttpErrorResponse) => {
        this.error = this.formatHttpError(err, 'Failed to load items');
        return of([] as Product[]); // safe fallback for the UI
      })
    ).subscribe(items => {
      this.state.setItems(items);
      this.loadingList = false;
    });
    this.subs.push(s);
  }

  add(): void {
    if (!this.newName) { this.error = 'Name required'; return; }
    this.submitting = true;
    const payload: CreateProductRequest = { name: this.newName, price: this.newPrice, description: this.newDescription || undefined };

    // Use switchMap to chain create -> refresh list without nested subscriptions
    const s = this.svc.createProduct(payload).pipe(
      switchMap(() => this.svc.getProducts()),
      tap(() => { this.error = ''; }),
      catchError((err: HttpErrorResponse) => {
        this.error = this.formatHttpError(err, 'Create failed');
        return of([] as Product[]);
      })
    ).subscribe(items => {
      // update shared state with fresh list
      this.state.setItems(items);
      this.newName = ''; this.newPrice = 0; this.newDescription = '';
      this.submitting = false;
    });
    this.subs.push(s);
  }

  private formatHttpError = formatHttpError;

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }
}
