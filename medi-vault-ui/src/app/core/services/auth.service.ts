import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthResponse, AuthUser, LoginRequest, RegisterRequest } from '../models/auth.models';

interface StoredAuthState {
  token: string;
  user: AuthUser;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly storageKey = 'medi-vault-auth';
  private readonly initialState = this.readStoredState();

  private readonly tokenState = signal<string | null>(this.initialState?.token ?? null);
  private readonly userState = signal<AuthUser | null>(this.initialState?.user ?? null);

  readonly token = this.tokenState.asReadonly();
  readonly currentUser = this.userState.asReadonly();
  readonly isAuthenticated = computed(() => Boolean(this.tokenState()));

  login(credentials: LoginRequest): Observable<AuthUser> {
    return this.http.post<AuthResponse | string>(`${environment.authApiBaseUrl}/login`, credentials).pipe(
      map((response) => this.resolveAuthResponse(response)),
      tap(({ token, user }) => this.persistAuthState(token, user)),
      map(({ user }) => user)
    );
  }

  register(payload: RegisterRequest): Observable<AuthUser> {
    return this.http.post<AuthResponse | string>(`${environment.authApiBaseUrl}/register`, payload).pipe(
      map((response) => this.resolveAuthResponse(response)),
      tap(({ token, user }) => this.persistAuthState(token, user)),
      map(({ user }) => user)
    );
  }

  logout(): void {
    this.tokenState.set(null);
    this.userState.set(null);
    this.clearStoredState();
    void this.router.navigate(['/login']);
  }

  updateCurrentUser(userPatch: Partial<AuthUser>): void {
    const currentUser = this.userState();

    if (!currentUser) {
      return;
    }

    const nextUser: AuthUser = {
      ...currentUser,
      ...userPatch
    };

    this.userState.set(nextUser);

    const token = this.tokenState();

    if (!token || globalThis.localStorage === undefined) {
      return;
    }

    globalThis.localStorage.setItem(this.storageKey, JSON.stringify({ token, user: nextUser }));
  }

  isDoctor(user: AuthUser | null = this.userState()): boolean {
    if (!user) {
      return false;
    }

    const role = (user.role ?? '').toUpperCase();
    const email = (user.email ?? '').toLowerCase();
    const name = (user.fullName ?? '').toLowerCase();

    return (
      role === 'DOCTOR' ||
      role.includes('DOCTOR') ||
      role.includes('PHYSICIAN') ||
      role.includes('MEDIC') ||
      role.includes('STAFF') ||
      email.includes('.dr') ||
      email.startsWith('dr.') ||
      name.startsWith('dr.') ||
      name.includes('dr. ') ||
      name.includes('doctor')
    );
  }

  resolveDashboardRoute(user: AuthUser | null = this.userState()): '/dashboard' | '/doctor-dashboard' {
    return this.isDoctor(user) ? '/doctor-dashboard' : '/dashboard';
  }

  private resolveAuthResponse(response: AuthResponse | string): StoredAuthState {
    if (typeof response === 'string') {
      return {
        token: response,
        user: this.decodeJwt(response) ?? this.buildFallbackUser(response)
      };
    }

    const token = response.token ?? response.accessToken ?? response.jwt;
    const decodedUser = token ? this.decodeJwt(token) : null;
    const responseUser = response.user;
    let user: AuthUser | null = null;

    if (responseUser) {
      // Use role from response user, then decoded JWT, then default to PATIENT
      const role = responseUser.role || this.readRole(responseUser as any) || decodedUser?.role || 'PATIENT';
      
      user = {
        ...decodedUser,
        ...responseUser,
        role
      };
    } else if (decodedUser) {
      user = {
        ...decodedUser,
        role: decodedUser.role || 'PATIENT'
      };
    } else if (token) {
      user = this.buildFallbackUser(token);
    }

    if (!token || !user) {
      throw new Error('Authentication response did not include a usable token.');
    }

    return {
      token,
      user
    };
  }

  private persistAuthState(token: string, user: AuthUser): void {
    this.tokenState.set(token);
    this.userState.set(user);

    if (globalThis.localStorage === undefined) {
      return;
    }

    globalThis.localStorage.setItem(this.storageKey, JSON.stringify({ token, user }));
  }

  private readStoredState(): StoredAuthState | null {
    if (globalThis.localStorage === undefined) {
      return null;
    }

    const storedValue = globalThis.localStorage.getItem(this.storageKey);

    if (!storedValue) {
      return null;
    }

    try {
      return JSON.parse(storedValue) as StoredAuthState;
    } catch {
      this.clearStoredState();

      return null;
    }
  }

  private clearStoredState(): void {
    if (globalThis.localStorage === undefined) {
      return;
    }

    globalThis.localStorage.removeItem(this.storageKey);
  }

  private decodeJwt(token: string): AuthUser | null {
    const segments = token.split('.');

    if (segments.length < 2) {
      return null;
    }

    try {
      const payload = JSON.parse(this.base64UrlDecode(segments[1])) as Record<string, unknown>;
      const email = this.readString(payload, ['email', 'sub', 'username']) ?? 'patient@medi-vault.local';
      const fullName = this.readString(payload, ['fullName', 'name', 'given_name']) ?? 'Patient';
      const role = this.readRole(payload); // No default here, let resolver handle it

      return {
        email,
        fullName,
        profileImageUrl: this.readString(payload, ['profileImageUrl', 'avatarUrl', 'picture']) ?? undefined,
        role: role ?? undefined
      };
    } catch {
      return null;
    }
  }

  private buildFallbackUser(token: string): AuthUser {
    return {
      email: `patient-${token.slice(0, 8)}@medi-vault.local`,
      fullName: 'Patient',
      role: 'PATIENT'
    };
  }

  private readString(payload: Record<string, unknown>, keys: string[]): string | null {
    for (const key of keys) {
      const value = payload[key];

      if (typeof value === 'string' && value.trim().length > 0) {
        return value;
      }
    }

    return null;
  }

  private readRole(payload: Record<string, unknown>): string | null {
    const roleFromKeys = this.readString(payload, ['role', 'authority', 'scope', 'userRole', 'type']);

    if (roleFromKeys) {
      return roleFromKeys;
    }

    const authorities = payload['authorities'];

    if (Array.isArray(authorities)) {
      const firstAuthority = authorities.find((value) => typeof value === 'string' && value.trim().length > 0);

      if (typeof firstAuthority === 'string') {
        return firstAuthority;
      }
    }

    const roles = payload['roles'];

    if (Array.isArray(roles)) {
      const firstRole = roles.find((value) => typeof value === 'string' && value.trim().length > 0);

      if (typeof firstRole === 'string') {
        return firstRole;
      }
    }

    return null;
  }

  private base64UrlDecode(value: string): string {
    const normalized = value.replaceAll('-', '+').replaceAll('_', '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');

    return decodeURIComponent(
      atob(padded)
        .split('')
        .map((character) => `%${(character.codePointAt(0) ?? 0).toString(16).padStart(2, '0')}`)
        .join('')
    );
  }
}
