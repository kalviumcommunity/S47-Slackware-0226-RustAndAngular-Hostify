import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private loggedInSubject = new BehaviorSubject<boolean>(false);
  readonly isLoggedIn$ = this.loggedInSubject.asObservable();

  constructor() {
    const token = localStorage.getItem('auth_token');
    this.loggedInSubject.next(!!token);
  }

  isLoggedIn(): boolean {
    return this.loggedInSubject.getValue();
  }

  login(username: string, password: string): Promise<boolean> {
    // simple simulated login - accept any non-empty username/password
    return new Promise((resolve) => {
      setTimeout(() => {
        if (username && password) {
          const token = btoa(`${username}:${Date.now()}`);
          localStorage.setItem('auth_token', token);
          this.loggedInSubject.next(true);
          resolve(true);
        } else {
          resolve(false);
        }
      }, 300);
    });
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    this.loggedInSubject.next(false);
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }
}
