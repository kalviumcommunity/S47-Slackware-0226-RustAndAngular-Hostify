import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Product, CreateProductRequest } from './src/app/models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  // Point to the Rust backend during development
  private readonly base = 'http://localhost:8080';

  constructor(private readonly http: HttpClient) {}

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.base}/products`);
  }

  // DB-backed list with pagination and optional name filter
  getProductsDb(page = 1, limit = 10, name?: string): Observable<Product[]> {
    let params = new HttpParams().set('page', String(page)).set('limit', String(limit));
    if (name) params = params.set('name', name);
    return this.http.get<Product[]>(`${this.base}/products-db`, { params });
  }

  // Accepts a typed payload and returns the created Product
  createProduct(payload: CreateProductRequest): Observable<Product> {
    return this.http.post<Product>(`${this.base}/products`, payload);
  }
}
