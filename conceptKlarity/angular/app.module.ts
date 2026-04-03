import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { ProductListComponent } from './product-list.component';
import { DemoCliComponent } from './demo-cli.component';
import { BindingDemoComponent } from './binding-demo.component';
import { TemplateFormComponent } from './template-form.component';
import { ReactiveFormComponent } from './reactive-form.component';
import { RouterModule, Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { HomeComponent } from './home.component';
import { DashboardComponent } from './dashboard.component';
import { DetailsComponent } from './details.component';
import { UserFormComponent } from './user-form.component';

@NgModule({
  declarations: [
    ProductListComponent,
    DemoCliComponent,
    BindingDemoComponent,
    TemplateFormComponent,
    ReactiveFormComponent,
    AppComponent,
    HomeComponent,
    DashboardComponent,
    DetailsComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule.forRoot([
      { path: '', component: HomeComponent },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'details/:id', component: DetailsComponent },
      { path: 'user-form', component: UserFormComponent },
      { path: '**', redirectTo: '' }
    ])
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
