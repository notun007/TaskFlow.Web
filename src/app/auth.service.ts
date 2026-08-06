import { HttpClient, HttpInterceptorFn } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

type LoginResponse = { accessToken: string; expiresAt: string };
type RegisterResponse = { id: string; email: string; displayName: string };
type ResetRequestResponse = { message: string; resetToken?: string | null };
export type CurrentUser = {
  id: string;
  email: string;
  displayName: string;
  department?: string | null;
  jobTitle?: string | null;
  roles: string[];
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  readonly accessToken = signal(this.readStoredToken());
  readonly currentUser = signal<CurrentUser | null>(null);

  private readStoredToken() {
    const token = sessionStorage.getItem('taskflow.accessToken');
    if (!token) return null;
    try {
      const encodedPayload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(encodedPayload.padEnd(Math.ceil(encodedPayload.length / 4) * 4, '=')));
      if (typeof payload.exp === 'number' && payload.exp * 1000 > Date.now()) return token;
    } catch {
      // Invalid stored tokens are cleared below.
    }
    sessionStorage.removeItem('taskflow.accessToken');
    return null;
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/api/auth/login', { email, password }).pipe(
      tap(response => {
        sessionStorage.setItem('taskflow.accessToken', response.accessToken);
        this.accessToken.set(response.accessToken);
      })
    );
  }

  register(email: string, password: string, displayName: string): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>('/api/auth/register', { email, password, displayName });
  }

  loadCurrentUser(): Observable<CurrentUser> {
    return this.http.get<CurrentUser>('/api/auth/me').pipe(
      tap(user => this.currentUser.set(user))
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http.post<void>('/api/auth/change-password', { currentPassword, newPassword });
  }

  requestPasswordReset(email: string): Observable<ResetRequestResponse> {
    return this.http.post<ResetRequestResponse>('/api/auth/request-password-reset', { email });
  }

  resetPassword(email: string, token: string, newPassword: string): Observable<void> {
    return this.http.post<void>('/api/auth/reset-password', { email, token, newPassword });
  }

  logout() {
    sessionStorage.removeItem('taskflow.accessToken');
    this.accessToken.set(null);
    this.currentUser.set(null);
  }
}

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const token = inject(AuthService).accessToken();
  return next(token ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : request);
};
