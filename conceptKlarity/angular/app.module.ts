import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { ProductListComponent } from './product-list.component';
import { DemoCliComponent } from './demo-cli.component';
import { BindingDemoComponent } from './binding-demo.component';
import { TemplateFormComponent } from './template-form.component';
import { ReactiveFormComponent } from './reactive-form.component';
import { LoginComponent } from './login.component';
import { DashboardComponent } from './dashboard.component';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

@NgModule({
  declarations: [
    AppComponent,
    ProductListComponent,
    DemoCliComponent,
    BindingDemoComponent,
    TemplateFormComponent,
    ReactiveFormComponent,
    LoginComponent,
    DashboardComponent
  ],
  imports: [BrowserModule, FormsModule, ReactiveFormsModule, HttpClientModule, AppRoutingModule],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
