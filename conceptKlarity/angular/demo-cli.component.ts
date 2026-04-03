import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { StateService } from './services/state.service';
import { Product } from './src/app/models/product.model';

@Component({
  selector: 'app-demo-cli',
  templateUrl: './demo-cli.component.html',
  styleUrls: ['./demo-cli.component.css']
})
export class DemoCliComponent implements OnInit, OnDestroy {
  items$!: Observable<Product[]>;
  count = 0;
  private sub?: Subscription;

  constructor(private state: StateService) {}

  ngOnInit(): void {
    this.items$ = this.state.items$;
    this.sub = this.items$.subscribe(items => this.count = items.length);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
