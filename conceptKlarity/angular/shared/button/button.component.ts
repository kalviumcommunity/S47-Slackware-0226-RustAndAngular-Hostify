import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'shared-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.css']
})
export class ButtonComponent {
  @Input() label = 'Button';
  @Input() disabled = false;
  @Input() variant: 'primary' | 'secondary' = 'primary';
  @Output() clicked = new EventEmitter<void>();

  onClick(): void {
    if (!this.disabled) this.clicked.emit();
  }
}
