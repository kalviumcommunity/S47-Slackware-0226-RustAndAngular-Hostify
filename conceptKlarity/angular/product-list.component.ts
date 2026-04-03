import { Component, OnInit, OnDestroy } from '@angular/core';
import { ProductService } from './product.service';
import { Product, CreateProductRequest } from './src/app/models/product.model';
import { StateService } from './services/state.service';
import { Subscription, of, Observable, Subject } from 'rxjs';
import { switchMap, tap, catchError, debounceTime, distinctUntilChanged, throttleTime, mergeMap } from 'rxjs/operators';
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
  // search and load-more controls
  private search$ = new Subject<string>();
  private loadMore$ = new Subject<void>();
  private page = 1;
  private limit = 10;
  private currentQuery: string | undefined;

  constructor(private svc: ProductService, private state: StateService) {}

  ngOnInit(): void {
    // expose state observable for template and perform initial load
    this.items$ = this.state.items$;
    this.load();

    // search stream with debounce to reduce API calls during typing
    const s1 = this.search$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(q => { this.currentQuery = q; this.page = 1; this.loadingList = true; this.error = ''; }),
      switchMap(q => this.svc.getProductsDb(1, this.limit, q).pipe(
        catchError((err: HttpErrorResponse) => { this.error = this.formatHttpError(err, 'Search failed'); return of([] as Product[]); })
      ))
    ).subscribe(items => { this.state.setItems(items); this.loadingList = false; });
    this.subs.push(s1);

    // load-more stream throttled to avoid rapid repeated requests
    const s2 = this.loadMore$.pipe(
      throttleTime(1000),
      mergeMap(() => {
        this.page += 1;
        this.loadingList = true;
        return this.svc.getProductsDb(this.page, this.limit, this.currentQuery).pipe(
          catchError((err: HttpErrorResponse) => { this.error = this.formatHttpError(err, 'Load more failed'); return of([] as Product[]); })
        );
      })
    ).subscribe(items => {
      const current = this.state.getItemsSnapshot() || [];
      this.state.setItems([...current, ...items]);
      this.loadingList = false;
    });
    this.subs.push(s2);
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

  // exposed to template: call when search input changes
  onSearchChange(q: string): void {
    this.search$.next(q);
  }

  // exposed to template: call to load next page (throttled)
  loadMore(): void {
    this.loadMore$.next();
  }

  private formatHttpError = formatHttpError;

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }
}
