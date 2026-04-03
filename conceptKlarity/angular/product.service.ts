import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Product, CreateProductRequest } from './src/app/models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  // Point to the Rust backend during development
  private readonly base = 'http://localhost:8080';
  constructor(private readonly http: HttpClient) {}

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.base}/products`);
  }

  // --- Simple in-memory cache for paginated DB queries ---
  // Cache key: page/limit/name
  private cache = new Map<string, { ts: number; data: Product[] }>();
  private cacheTtl = 30 * 1000; // 30 seconds

  // DB-backed list with pagination and optional name filter
  // Uses the in-service cache to avoid repeated identical requests
  getProductsDb(page = 1, limit = 10, name?: string): Observable<Product[]> {
    const key = `p=${page}&l=${limit}&n=${name ?? ''}`;
    const now = Date.now();
    const entry = this.cache.get(key);
    if (entry && (now - entry.ts) < this.cacheTtl) {
      return of(entry.data as Product[]);
    }

    let params = new HttpParams().set('page', String(page)).set('limit', String(limit));
    if (name) params = params.set('name', name);
    return this.http.get<Product[]>(`${this.base}/products-db`, { params }).pipe(
      tap(results => this.cache.set(key, { ts: Date.now(), data: results }))
    );
  }

  // Accepts a typed payload and returns the created Product
  // Invalidate cache on create so future reads are fresh
  createProduct(payload: CreateProductRequest): Observable<Product> {
    this.cache.clear();
    return this.http.post<Product>(`${this.base}/products`, payload);
  }
}
