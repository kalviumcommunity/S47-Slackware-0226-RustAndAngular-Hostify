import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Product } from '../src/app/models/product.model';

@Injectable({ providedIn: 'root' })
export class StateService {
  private itemsSubject = new BehaviorSubject<Product[]>([]);
  readonly items$ = this.itemsSubject.asObservable();

  constructor() {}

  getItemsSnapshot(): Product[] {
    return this.itemsSubject.getValue();
  }

  setItems(items: Product[] | null): void {
    this.itemsSubject.next(items ?? []);
  }

  addItem(payload: { name: string; price: number; description?: string } | Product): Product | null {
    // Accept either a Product or a payload object
    const items = this.getItemsSnapshot();

    // normalize to Product
    let newItem: Product;
    if ((payload as Product).id !== undefined && (payload as Product).name !== undefined) {
      newItem = payload as Product;
    } else {
      const p = payload as { name: string; price: number; description?: string };
      if (!p || !p.name || p.price == null || p.price < 0) {
        console.warn('StateService.addItem: invalid payload', payload);
        return null; // edge case: invalid update attempt
      }
      const maxId = items.length ? Math.max(...items.map(i => i.id)) : 0;
      newItem = { id: maxId + 1, name: p.name, price: p.price, description: p.description ?? '', status: 'available' };
    }

    this.itemsSubject.next([...items, newItem]);
    return newItem;
  }

  removeItem(id: number): boolean {
    const items = this.getItemsSnapshot();
    if (!items.some(i => i.id === id)) return false;
    this.itemsSubject.next(items.filter(i => i.id !== id));
    return true;
  }

  updateItem(updated: Product): boolean {
    if (!updated || updated.id == null) return false;
    const items = this.getItemsSnapshot();
    const idx = items.findIndex(i => i.id === updated.id);
    if (idx === -1) return false;
    const newItems = items.slice();
    newItems[idx] = updated;
    this.itemsSubject.next(newItems);
    return true;
  }

  // Simulate an API load; can optionally fail to demonstrate error handling
  simulateApiLoad(shouldFail = false): Promise<Product[]> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (shouldFail) {
          reject(new Error('Simulated API error'));
          return;
        }
        const items: Product[] = [{
            id: 1, name: 'Simulated Item', price: 9.99, description: 'From simulateApiLoad',
            status: 'available'
        }];
        this.setItems(items);
        resolve(items);
      }, 200);
    });
  }
}
