import { TestBed } from '@angular/core/testing';
import { DataService } from './data';
import { SupabaseService } from './supabase';
import { AuthService } from './auth';
import { firstValueFrom } from 'rxjs';

describe('DataService', () => {
  let service: DataService;
  let authService: AuthService;
  let from: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    from = vi.fn(() => {
      throw new Error('Demo mode must not query Supabase');
    });
    await TestBed.configureTestingModule({
      providers: [
        { provide: SupabaseService, useValue: { client: { from, rpc: vi.fn() } } },
      ],
    }).compileComponents();
    authService = TestBed.inject(AuthService);
    service = TestBed.inject(DataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return demo data without querying Supabase', async () => {
    authService.startDemoSession('admin');
    const [metrics, performance, profiles, activities] = await Promise.all([
      firstValueFrom(service.getStatsMetrics()),
      firstValueFrom(service.getMonthlyPerformance()),
      firstValueFrom(service.getProfiles()),
      firstValueFrom(service.getRecentActivities()),
    ]);

    expect(metrics.length).toBeGreaterThan(0);
    expect(performance).toHaveLength(6);
    expect(profiles.some((profile) => profile.id === 'demo-admin')).toBe(true);
    expect(activities.length).toBeGreaterThan(0);
    expect(from).not.toHaveBeenCalled();
  });

  it('should keep demo profile edits and activity in memory', async () => {
    authService.startDemoSession('user');
    const updated = await service.updateProfile('demo-user', { full_name: 'Nombre Demo Actualizado' });
    await service.recordActivity('demo-user', 'UPDATE_PROFILE');

    expect(updated.full_name).toBe('Nombre Demo Actualizado');
    expect(await service.getUserActivityCounts('demo-user')).toEqual({
      totalLogins: 1,
      otherActions: 2,
    });
    expect(from).not.toHaveBeenCalled();
  });
});
