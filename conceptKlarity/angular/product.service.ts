import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product, CreateProductRequest } from './src/app/models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly base = '/api/products';
  constructor(private readonly http: HttpClient) {}

  // Returns a strongly-typed Observable of Product[] (demonstrates generics)
  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.base);
  }

  // Accepts a typed payload and returns the created Product
  createProduct(payload: CreateProductRequest): Observable<Product> {
    return this.http.post<Product>(this.base, payload);
  }
}
