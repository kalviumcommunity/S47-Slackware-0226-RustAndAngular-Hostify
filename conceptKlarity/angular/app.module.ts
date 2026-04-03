import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { DemoCliComponent } from './demo-cli.component';
import { BindingDemoComponent } from './binding-demo.component';
import { TemplateFormComponent } from './template-form.component';
import { ReactiveFormComponent } from './reactive-form.component';

import { DashboardComponent } from './dashboard.component';
import { CoreModule } from './core/core.module';
import { SharedModule } from './shared/shared.module';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './src/app/interceptors/auth.interceptor';

@NgModule({
  declarations: [
    AppComponent,
    DemoCliComponent,
    BindingDemoComponent,
    TemplateFormComponent,
    ReactiveFormComponent,
    DashboardComponent
  ],
  imports: [BrowserModule, FormsModule, ReactiveFormsModule, HttpClientModule, AppRoutingModule, CoreModule, SharedModule],
  bootstrap: [AppComponent]
})
export class AppModule {}
