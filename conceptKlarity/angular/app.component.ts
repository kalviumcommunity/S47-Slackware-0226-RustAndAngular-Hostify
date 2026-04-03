import { Component } from '@angular/core';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  isLoggedIn = false;

  constructor(private auth: AuthService, private router: Router) {
    this.auth.isLoggedIn$.subscribe(v => this.isLoggedIn = v);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
