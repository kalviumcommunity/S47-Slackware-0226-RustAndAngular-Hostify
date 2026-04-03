import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RouteDataService } from './route-data.service';

@Component({
  selector: 'app-details',
  template: `
  <h2>Details</h2>
  <div *ngIf="id">Showing details for item id: {{ id }}</div>
  <div *ngIf="selectedId">Selected id from service: {{ selectedId }}</div>
  `
})
export class DetailsComponent implements OnInit {
  id: string | null = null;
  selectedId: number | null = null;

  constructor(private route: ActivatedRoute, private routeData: RouteDataService) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
    this.selectedId = this.routeData.getSelectedId();
  }
}
