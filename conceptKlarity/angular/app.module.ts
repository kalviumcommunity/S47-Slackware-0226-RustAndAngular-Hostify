import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { ProductListComponent } from './product-list.component';
import { DemoCliComponent } from './demo-cli.component';

@NgModule({
  declarations: [ProductListComponent, DemoCliComponent],
  imports: [BrowserModule, FormsModule, HttpClientModule],
  providers: [],
  bootstrap: [ProductListComponent]
})
export class AppModule {}
