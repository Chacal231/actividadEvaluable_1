import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { of } from 'rxjs';
import { AuthService } from '../services/auth';
import { DataService } from '../services/data';
import { SupabaseService } from '../services/supabase';
import { UserDashboardPage } from './user-dashboard.page';

describe('UserDashboardPage', () => {
  let component: UserDashboardPage;
  let fixture: ComponentFixture<UserDashboardPage>;
  const supabaseServiceMock = {
    getUser: vi.fn(async () => ({ data: { user: null }, error: null })),
  };

  beforeEach(async () => {
    supabaseServiceMock.getUser.mockClear();
    await TestBed.configureTestingModule({
      imports: [UserDashboardPage],
      providers: [
        { provide: Router, useValue: { navigate: vi.fn(), navigateByUrl: vi.fn() } },
        {
          provide: ActivatedRoute,
          useValue: { queryParamMap: of(convertToParamMap({})) },
        },
        {
          provide: AuthService,
          useValue: {
            logout: vi.fn(),
            isDemoMode: () => true,
            getDemoUserId: () => 'demo-user',
          },
        },
        {
          provide: DataService,
          useValue: {
            getProfiles: () => of([{
              id: 'demo-user',
              email: 'usuario.demo@example.test',
              role: 'user',
              full_name: 'Usuario de Demostración',
            }]),
            getRecentActivities: () => of([]),
            getUserActivityCounts: async () => ({ totalLogins: 1, otherActions: 0 }),
          },
        },
        { provide: SupabaseService, useValue: supabaseServiceMock },
        { provide: AlertController, useValue: { create: vi.fn() } },
        { provide: ToastController, useValue: { create: vi.fn(async () => ({ present: vi.fn() })) } },
      ],
    })
      .overrideComponent(UserDashboardPage, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(UserDashboardPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load demo profile without requesting a Supabase user', async () => {
    await component.loadUserProfile();

    expect(component.userProfile()?.id).toBe('demo-user');
    expect(supabaseServiceMock.getUser).not.toHaveBeenCalled();
  });
});
