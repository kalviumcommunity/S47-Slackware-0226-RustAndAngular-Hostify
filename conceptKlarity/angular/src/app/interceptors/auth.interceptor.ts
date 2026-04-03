import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private auth: AuthService, private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.auth.getToken();
    // Do not attach token for login endpoint to avoid accidental leakage
    let request = req;
    if (token && !req.url.endsWith('/api/auth/login')) {
      request = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
    }

    return next.handle(request).pipe(
      catchError((err: any) => {
        // If token invalid or expired, clear and redirect to login
        if (err && err.status === 401) {
          this.auth.logout();
          // navigate to login page
          try { this.router.navigate(['/login']); } catch (_e) {}
        }
        return throwError(() => err);
      })
    );
  }
}
