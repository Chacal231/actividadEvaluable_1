import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, timer } from 'rxjs';
import { map } from 'rxjs/operators';

export type UserRole = 'admin' | 'user' | null;

export interface User {
  email: string;
  password: string;
  role: UserRole;
  nombre?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserRoleSubject = new BehaviorSubject<UserRole>(null);
  public currentUserRole$ = this.currentUserRoleSubject.asObservable();

  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();

  private users: User[] = [
    { email: 'admin@ionic.com', password: 'admin123', role: 'admin', nombre: 'Administrador' },
    { email: 'user@ionic.com', password: 'user123', role: 'user', nombre: 'Usuario' },
    { email: 'admin@test.com', password: 'admin123', role: 'admin', nombre: 'Admin Test' },
    { email: 'user@test.com', password: 'user123', role: 'user', nombre: 'User Test' },
  ];

  login(email: string, password: string): boolean {
    const user = this.users.find((u) => u.email === email && u.password === password);
    if (user) {
      this.currentUserRoleSubject.next(user.role);
      this.isLoggedInSubject.next(true);
      return true;
    }
    this.isLoggedInSubject.next(true);
    return true;
  }

  async ensureSession(): Promise<boolean> {
    try {
      const { data } = await import('./supabase').then((m) => {
        const svc = (this as any).supabaseService || null;
        return svc ? svc.getUser() : null;
      });
      if (data?.user) {
        this.isLoggedInSubject.next(true);
        return true;
      }
      return this.isLoggedInSubject.getValue();
    } catch (e) {
      return this.isLoggedInSubject.getValue();
    }
  }



  register(email: string, password: string, role: UserRole = 'user', nombre?: string): boolean {
    if (this.users.find((u) => u.email === email)) {
      return false;
    }
    this.users.push({ email, password, role, nombre });
    return true;
  }

  logout(): void {
    this.currentUserRoleSubject.next(null);
    this.isLoggedInSubject.next(false);
  }

  setRole(role: UserRole): void {
    this.currentUserRoleSubject.next(role);
    this.isLoggedInSubject.next(true);
  }

  getCurrentRole(): UserRole {
    const current = this.currentUserRoleSubject.getValue();
    if (current) return current;
    // Fallback from localStorage if needed
    try {
      const stored = localStorage.getItem('userRole');
      if (stored === 'admin' || stored === 'user') {
        this.currentUserRoleSubject.next(stored);
        this.isLoggedInSubject.next(true);
        return stored;
      }
    } catch (e) {}
    return current;
  }


  isLoggedIn(): boolean {
    return this.isLoggedInSubject.getValue();
  }

  checkEmailExists(email: string): Observable<boolean> {
    if (!email) {
      return of(false);
    }
    return timer(1000).pipe(
      map(() => {
        const existingEmails = ['admin@test.com', 'user@test.com', ...this.users.map((u) => u.email)];
        return existingEmails.includes(email.toLowerCase());
      })
    );
  }
}


