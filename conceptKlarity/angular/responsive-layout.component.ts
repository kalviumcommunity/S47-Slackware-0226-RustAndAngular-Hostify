import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from './shared/shared.module';

@Component({
  selector: 'app-responsive-layout',
  standalone: true,
  imports: [CommonModule, SharedModule],
  templateUrl: './responsive-layout.component.html',
  styleUrls: ['./responsive-layout.component.css']
})
export class ResponsiveLayoutComponent {
  cards = [
    { title: 'Wireless Mouse', subtitle: 'Ergonomic', price: 899 },
    { title: 'Mechanical Keyboard', subtitle: 'RGB, TKL', price: 3499 },
    { title: 'USB-C Hub', subtitle: '4 ports', price: 1299 },
    { title: 'Webcam', subtitle: '1080p', price: 2199 },
    { title: 'Monitor', subtitle: '24" FHD', price: 8999 }
  ];

  addToCart(card: any): void {
    // placeholder interactivity to demonstrate reactive UI
    // in a real app you'd call a service
    (card as any).added = true;
  }
}
