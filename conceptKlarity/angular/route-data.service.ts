import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class RouteDataService {
  private selectedId: number | null = null;

  setSelectedId(id: number) { this.selectedId = id; }
  getSelectedId(): number | null { return this.selectedId; }
}
