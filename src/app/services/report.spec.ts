import { TestBed } from '@angular/core/testing';
import { ToastController } from '@ionic/angular';
import { ReportService } from './report';
import { SupabaseService } from './supabase';

describe('ReportService', () => {
  let service: ReportService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        SupabaseService,
        { provide: ToastController, useValue: { create: vi.fn() } },
      ],
    }).compileComponents();
    service = TestBed.inject(ReportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
