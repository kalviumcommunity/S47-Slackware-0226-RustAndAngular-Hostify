import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-template-form',
  templateUrl: './template-form.component.html',
  styleUrls: ['./template-form.component.css']
})
export class TemplateFormComponent {
  onSubmit(form: NgForm): void {
    console.log('Template-driven form submit', form.value, 'valid:', form.valid);
  }
}
