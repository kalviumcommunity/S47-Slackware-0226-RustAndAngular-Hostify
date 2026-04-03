import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-reactive-form',
  templateUrl: './reactive-form.component.html',
  styleUrls: ['./reactive-form.component.css']
})
export class ReactiveFormComponent implements OnInit {
  form!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]]
    });

    this.form.valueChanges.subscribe(v => console.log('Reactive value:', v));
    this.form.statusChanges.subscribe(s => console.log('Reactive status:', s));
  }

  onSubmit(): void {
    console.log('Reactive submit', this.form.value, 'valid:', this.form.valid);
    if (this.form.valid) {
      this.form.reset();
    }
  }

  get name() { return this.form.get('name'); }
  get email() { return this.form.get('email'); }
}
