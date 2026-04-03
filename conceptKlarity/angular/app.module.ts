import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { ProductListComponent } from './product-list.component';
import { DemoCliComponent } from './demo-cli.component';
import { BindingDemoComponent } from './binding-demo.component';
import { TemplateFormComponent } from './template-form.component';
import { ReactiveFormComponent } from './reactive-form.component';

@NgModule({
  declarations: [
    ProductListComponent,
    DemoCliComponent,
    BindingDemoComponent,
    TemplateFormComponent,
    ReactiveFormComponent
  ],
  imports: [BrowserModule, FormsModule, ReactiveFormsModule, HttpClientModule],
  providers: [],
  bootstrap: [ProductListComponent]
})
export class AppModule {}
