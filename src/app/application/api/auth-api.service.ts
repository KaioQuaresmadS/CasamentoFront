import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { AuthUser, LoginRequest, LoginResponse } from '../../domain/models/auth.model';
import { API_BASE_URL } from './api.config';

const ACCESS_TOKEN_KEY = 'casamento.accessToken';
const REFRESH_TOKEN_KEY = 'casamento.refreshToken';
const USER_KEY = 'casamento.user';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly userState = signal<AuthUser | null>(this.readUser());

  readonly user = this.userState.asReadonly();
  readonly isAuthenticated = computed(() => Boolean(this.accessToken));
  readonly isAdmin = computed(() => this.userState()?.roles.includes('Admin') ?? false);

  constructor(private readonly http: HttpClient) {}

  get accessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${API_BASE_URL}/auth/login`, request).pipe(
      tap((response) => {
        const user: AuthUser = {
          userId: response.userId,
          email: response.email,
          name: response.name,
          roles: response.roles
        };

        localStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        this.userState.set(user);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.userState.set(null);
  }

  private readUser(): AuthUser | null {
    const rawUser = localStorage.getItem(USER_KEY);
    if (!rawUser) {
      return null;
    }

    try {
      return JSON.parse(rawUser) as AuthUser;
    } catch {
      return null;
    }
  }
}
