import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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

  // Accepts a typed payload and returns the created Product
  createProduct(payload: CreateProductRequest): Observable<Product> {
    return this.http.post<Product>(this.base, payload);
  }
}
