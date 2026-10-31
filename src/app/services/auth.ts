import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, timer } from 'rxjs';
import { map } from 'rxjs/operators';
import { SupabaseService } from './supabase';

export type UserRole = 'admin' | 'user' | null;
type AuthMode = 'none' | 'supabase' | 'demo';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserRoleSubject = new BehaviorSubject<UserRole>(null);
  public currentUserRole$ = this.currentUserRoleSubject.asObservable();

  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();
  private authMode: AuthMode = 'none';

  constructor(private readonly supabaseService: SupabaseService) {}

  setAuthenticatedRole(role: Exclude<UserRole, null>): void {
    this.authMode = 'supabase';
    this.currentUserRoleSubject.next(role);
    this.isLoggedInSubject.next(true);
  }

  startDemoSession(role: Exclude<UserRole, null>): void {
    this.authMode = 'demo';
    this.currentUserRoleSubject.next(role);
    this.isLoggedInSubject.next(true);
  }

  isDemoMode(): boolean {
    return this.authMode === 'demo';
  }

  getDemoUserId(): string | null {
    if (!this.isDemoMode()) {
      return null;
    }

    return this.getCurrentRole() === 'admin' ? 'demo-admin' : 'demo-user';
  }

  async ensureSession(): Promise<boolean> {
    if (this.isDemoMode()) {
      return true;
    }

    const { data, error } = await this.supabaseService.getUser();
    if (error) {
      throw error;
    }

    if (!data.user) {
      this.logout();
      return false;
    }

    this.authMode = 'supabase';
    this.isLoggedInSubject.next(true);
    return true;
  }

  logout(): void {
    this.authMode = 'none';
    this.currentUserRoleSubject.next(null);
    this.isLoggedInSubject.next(false);
  }

  getCurrentRole(): UserRole {
    return this.currentUserRoleSubject.getValue();
  }

  isLoggedIn(): boolean {
    return this.isLoggedInSubject.getValue();
  }

  checkEmailExists(email: string): Observable<boolean> {
    if (!email) {
      return of(false);
    }

    return timer(1000).pipe(
      map(() => ['admin@test.com', 'user@test.com'].includes(email.toLowerCase()))
    );
  }
}
