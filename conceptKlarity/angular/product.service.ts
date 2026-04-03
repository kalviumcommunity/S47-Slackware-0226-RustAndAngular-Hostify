import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from './src/app/models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  // Point to the Rust backend during development
  private readonly base = 'http://localhost:8080';

  constructor(private readonly http: HttpClient) {}

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.base}/products`);
  }

  createProduct(payload: { name: string; price: number; description?: string }): Observable<Product> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<Product>(`${this.base}/products`, payload, { headers });
  }

  // DB-backed listing with pagination/filtering
  getProductsDb(page = 1, limit = 10, name?: string): Observable<Product[]> {
    const params: any = { page: String(page), limit: String(limit) };
    if (name) params.name = name;
    return this.http.get<Product[]>(`${this.base}/products-db`, { params });
  }
}
