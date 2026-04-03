import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from './src/app/models/product.model';
import { AuthService } from './services/auth.service';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly base = '/api/products';
  constructor(private readonly http: HttpClient, private readonly auth: AuthService) {}

  // Returns a strongly-typed Observable of Product[] (demonstrates generics)
  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.base);
  }

  // Accepts a typed payload and returns the created Product
  createProduct(payload: { name: string; price: number; description?: string }): Observable<Product> {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    const options = headers ? { headers } : {};
    return this.http.post<Product>(this.base, payload, options);
  }
}
