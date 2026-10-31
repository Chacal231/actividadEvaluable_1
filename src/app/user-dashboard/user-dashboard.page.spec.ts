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

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserDashboardPage],
      providers: [
        { provide: Router, useValue: { navigate: vi.fn(), navigateByUrl: vi.fn() } },
        {
          provide: ActivatedRoute,
          useValue: { queryParamMap: of(convertToParamMap({})) },
        },
        { provide: AuthService, useValue: { logout: vi.fn() } },
        { provide: DataService, useValue: {} },
        {
          provide: SupabaseService,
          useValue: { getUser: async () => ({ data: { user: null }, error: null }) },
        },
        { provide: AlertController, useValue: { create: vi.fn() } },
        { provide: ToastController, useValue: { create: vi.fn() } },
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
});
