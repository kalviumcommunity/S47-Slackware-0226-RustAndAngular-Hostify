import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from './shared/shared.module';
import { ProductService } from './product.service';
import { formatHttpError } from './services/api-utils';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-responsive-layout',
  standalone: true,
  imports: [CommonModule, SharedModule],
  templateUrl: './responsive-layout.component.html',
  styleUrls: ['./responsive-layout.component.css']
})
export class ResponsiveLayoutComponent implements OnInit, OnDestroy {
  cards: any[] = [];
  loading = false;
  error = '';
  page = 1;
  limit = 6;
  private sub?: Subscription;

  constructor(private svc: ProductService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.sub = this.svc.getProductsDb(this.page, this.limit).subscribe({
      next: (rows) => { this.cards = rows.map(r => ({ ...r, title: r.name, subtitle: r.description || '', price: r.price })); this.loading = false; },
      error: (err) => { this.error = formatHttpError(err, 'Failed to load products'); this.loading = false; }
    });
  }

  addToCart(card: any): void {
    (card as any).added = true;
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }
}
