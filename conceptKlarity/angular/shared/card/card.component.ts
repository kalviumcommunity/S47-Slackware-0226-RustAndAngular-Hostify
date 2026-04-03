import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'shared-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.css']
})
export class CardComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() price: number | null = null;
  @Input() added = false;
  @Output() add = new EventEmitter<void>();

  onAdd(): void {
    this.add.emit();
  }
}
