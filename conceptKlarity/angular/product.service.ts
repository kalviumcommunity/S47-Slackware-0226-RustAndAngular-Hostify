import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Product { id: number; name: string; qty: number }

@Injectable({ providedIn: 'root' })
export class ProductService {
  private base = '/api/items';
  constructor(private http: HttpClient) {}

  getItems(): Observable<Product[]> {
    return this.http.get<Product[]>(this.base);
  }

  createItem(payload: { name: string; qty: number }): Observable<Product> {
    return this.http.post<Product>(this.base, payload);
  }
}
