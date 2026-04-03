import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from './src/app/models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly base = '/api/items';
  constructor(private readonly http: HttpClient) {}

  // Returns a strongly-typed Observable of Product[] (demonstrates generics)
  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.base);
  }

  // Accepts a typed payload and returns the created Product
  createProduct(payload: { name: string; price: number; description?: string }): Observable<Product> {
    return this.http.post<Product>(this.base, payload);
  }
}
