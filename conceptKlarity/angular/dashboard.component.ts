import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { RouteDataService } from './route-data.service';

@Component({
  selector: 'app-dashboard',
  template: `
  <h2>Dashboard</h2>
  <ul>
    <li *ngFor="let p of products; let i = index">
      {{ p.name }} — ₹{{ p.price }}
      <button (click)="viewDetails(p.id)">View</button>
    </li>
  </ul>
  `
})
export class DashboardComponent {
  products = [
    { id: 1, name: 'Wireless Mouse', price: 899 },
    { id: 2, name: 'Mechanical Keyboard', price: 3499 },
    { id: 3, name: 'USB-C Hub', price: 1299 }
  ];

  constructor(private router: Router, private routeData: RouteDataService) {}

  viewDetails(id: number): void {
    // store selected id in service and navigate with route param
    this.routeData.setSelectedId(id);
    this.router.navigate(['/details', id]);
  }
}
