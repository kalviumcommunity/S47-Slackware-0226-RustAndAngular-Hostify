import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username = '';
  password = '';
  error = '';
  loading = false;
  returnUrl = '/dashboard';

  constructor(private auth: AuthService, private router: Router, private route: ActivatedRoute) {
    const rq = this.route.snapshot.queryParamMap.get('returnUrl');
    if (rq) this.returnUrl = rq;
  }

  async submit(): Promise<void> {
    this.loading = true;
    this.error = '';
    const ok = await this.auth.login(this.username, this.password);
    this.loading = false;
    if (ok) {
      await this.router.navigateByUrl(this.returnUrl);
    } else {
      this.error = 'Login failed';
    }
  }
}
