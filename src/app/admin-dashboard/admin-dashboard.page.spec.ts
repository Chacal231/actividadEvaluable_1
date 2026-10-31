import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AlertController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../services/auth';
import { DataService } from '../services/data';
import { ReportService } from '../services/report';
import { SupabaseService } from '../services/supabase';
import { AdminDashboardPage } from './admin-dashboard.page';

describe('AdminDashboardPage', () => {
  let component: AdminDashboardPage;
  let fixture: ComponentFixture<AdminDashboardPage>;
  const authServiceMock = {
    getCurrentRole: () => 'admin',
    isDemoMode: vi.fn(() => false),
    getDemoUserId: vi.fn(() => null as string | null),
  };
  const supabaseServiceMock = {
    getUser: vi.fn(async () => ({ data: { user: null }, error: null })),
  };

  beforeEach(async () => {
    authServiceMock.isDemoMode.mockReturnValue(false);
    authServiceMock.getDemoUserId.mockReturnValue(null);
    supabaseServiceMock.getUser.mockClear();
    await TestBed.configureTestingModule({
      imports: [AdminDashboardPage],
      providers: [
        { provide: Router, useValue: { navigate: vi.fn(), navigateByUrl: vi.fn() } },
        { provide: AuthService, useValue: authServiceMock },
        {
          provide: DataService,
          useValue: {
            getStatsMetrics: () => of([]),
            getMonthlyPerformance: () => of([]),
            getProfiles: () => of([]),
            getRecentActivities: () => of([]),
          },
        },
        { provide: ReportService, useValue: {} },
        { provide: SupabaseService, useValue: supabaseServiceMock },
        { provide: AlertController, useValue: { create: vi.fn() } },
        {
          provide: ToastController,
          useValue: { create: vi.fn(async () => ({ present: vi.fn() })) },
        },
      ],
    })
      .overrideComponent(AdminDashboardPage, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(AdminDashboardPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load demo data without requesting a Supabase user', async () => {
    authServiceMock.isDemoMode.mockReturnValue(true);
    authServiceMock.getDemoUserId.mockReturnValue('demo-admin');
    supabaseServiceMock.getUser.mockClear();

    expect(await component.loadAdminData()).toBe(true);
    expect(component.currentUserId).toBe('demo-admin');
    expect(supabaseServiceMock.getUser).not.toHaveBeenCalled();
  });
});
