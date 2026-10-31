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

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminDashboardPage],
      providers: [
        { provide: Router, useValue: { navigate: vi.fn(), navigateByUrl: vi.fn() } },
        { provide: AuthService, useValue: { getCurrentRole: () => 'admin' } },
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
        {
          provide: SupabaseService,
          useValue: { getUser: async () => ({ data: { user: null }, error: null }) },
        },
        { provide: AlertController, useValue: { create: vi.fn() } },
        { provide: ToastController, useValue: { create: vi.fn() } },
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
});
