import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth';
import { SupabaseService } from './supabase';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: SupabaseService, useValue: { getUser: vi.fn() } },
      ],
    });
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should set the role for a real Supabase-authenticated user', () => {
    service.setAuthenticatedRole('admin');
    expect(service.isLoggedIn()).toBe(true);
    expect(service.getCurrentRole()).toBe('admin');
    expect(service.isDemoMode()).toBe(false);
  });

  it('should identify a demo session without creating a Supabase session', () => {
    service.startDemoSession('user');
    expect(service.isLoggedIn()).toBe(true);
    expect(service.getCurrentRole()).toBe('user');
    expect(service.isDemoMode()).toBe(true);
    expect(service.getDemoUserId()).toBe('demo-user');
  });

  it('should clear the demo session on logout', () => {
    service.startDemoSession('admin');
    service.logout();
    expect(service.isLoggedIn()).toBe(false);
    expect(service.getCurrentRole()).toBeNull();
    expect(service.isDemoMode()).toBe(false);
    expect(service.getDemoUserId()).toBeNull();
  });
});
