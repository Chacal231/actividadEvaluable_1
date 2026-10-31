import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should set the authenticated role after a successful login', () => {
    expect(service.login('admin@ionic.com', 'admin123')).toBe(true);
    expect(service.isLoggedIn()).toBe(true);
    expect(service.getCurrentRole()).toBe('admin');
  });
});
