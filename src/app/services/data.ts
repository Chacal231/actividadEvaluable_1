import { Injectable } from '@angular/core';
import { from, Observable, of } from 'rxjs';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from './supabase';
import { AuthService } from './auth';

export interface StatsMetric {
  id?: number;
  label?: string;
  title?: string;
  value: number;
  icon?: string;
  color?: string;
  trend?: string;
  change_text?: string;
  is_positive?: boolean;
  trend_direction?: 'up' | 'down' | 'neutral';
}


export interface MonthlyPerformance {
  id?: number;
  month: string;
  sales: number;
  income: number;
}

export interface Profile {
  id: string;
  email: string;
  role?: string;
  full_name?: string;
  username?: string;
  name?: string;
  active?: boolean;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserActivity {
  id: number;
  user_id: string;
  user_label?: string;
  action: string;
  details?: Record<string, unknown> | null;
  created_at: string;
}

export interface UserActivityCounts {
  totalLogins: number;
  otherActions: number;
}

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private supabase: SupabaseClient;
  private readonly demoMetrics: StatsMetric[] = [
    { label: 'Usuarios registrados', value: 128, trend: '+12%', is_positive: true },
    { label: 'Ventas mensuales', value: 342, trend: '+8%', is_positive: true },
    { label: 'Ingresos', value: 28450, trend: '+15%', is_positive: true },
    { label: 'Productos activos', value: 64, trend: '+3%', is_positive: true },
  ];
  private readonly demoPerformance: MonthlyPerformance[] = this.createDemoPerformance();
  private demoProfiles: Profile[] = this.createDemoProfiles();
  private demoActivities: UserActivity[] = this.createDemoActivities();

  constructor(supabaseService: SupabaseService, private readonly authService: AuthService) {
    this.supabase = supabaseService.client;
  }

  getStatsMetrics(): Observable<StatsMetric[]> {
    if (this.authService.isDemoMode()) {
      return of(this.demoMetrics.map((metric) => ({ ...metric })));
    }

    const promise = this.supabase
      .from('stats_metrics')
      .select('*')
      .then(({ data, error }) => {
        if (error) {
          throw error;
        }
        return (data || []) as StatsMetric[];
      });
    return from(promise);
  }

  getMonthlyPerformance(): Observable<MonthlyPerformance[]> {
    if (this.authService.isDemoMode()) {
      return of(this.demoPerformance.map((month) => ({ ...month })));
    }

    const promise = this.supabase
      .from('monthly_performance')
      .select('*')
      .order('id', { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          throw error;
        }
        return (data || []) as MonthlyPerformance[];
      });
    return from(promise);
  }

  getProfiles(): Observable<Profile[]> {
    if (this.authService.isDemoMode()) {
      return of(this.demoProfiles.map((profile) => ({ ...profile })));
    }

    const promise = this.supabase
      .from('profiles')
      .select('*')
      .then(({ data, error }) => {
        if (error) {
          throw error;
        }
        return (data || []) as Profile[];
      });
    return from(promise);
  }

  async updateProfile(id: string, updates: Pick<Profile, 'full_name' | 'name'>): Promise<Profile> {
    if (this.authService.isDemoMode()) {
      const profile = this.demoProfiles.find((item) => item.id === id);
      if (!profile) {
        throw new Error('No se encontró el perfil de demostración');
      }

      Object.assign(profile, updates, { updated_at: new Date().toISOString() });
      return { ...profile };
    }

    const { data, error } = await this.supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return data as Profile;
  }

  async updateUserRole(id: string, role: 'admin' | 'user'): Promise<void> {
    if (this.authService.isDemoMode()) {
      const profile = this.demoProfiles.find((item) => item.id === id);
      if (!profile) {
        throw new Error('No se encontró el perfil de demostración');
      }

      profile.role = role;
      return;
    }

    const { error } = await this.supabase.rpc('admin_update_user_role', {
      target_user_id: id,
      new_role: role,
    });
    if (error) {
      throw error;
    }
  }

  async updateUserStatus(id: string, active: boolean): Promise<void> {
    if (this.authService.isDemoMode()) {
      const profile = this.demoProfiles.find((item) => item.id === id);
      if (!profile) {
        throw new Error('No se encontró el perfil de demostración');
      }

      profile.active = active;
      profile.status = active ? 'Activo' : 'Inactivo';
      return;
    }

    const { error } = await this.supabase.rpc('admin_update_user_status', {
      target_user_id: id,
      new_active: active,
    });
    if (error) {
      throw error;
    }
  }

  async deleteUserAccount(id: string): Promise<void> {
    if (this.authService.isDemoMode()) {
      const profileIndex = this.demoProfiles.findIndex((item) => item.id === id);
      if (profileIndex === -1) {
        throw new Error('No se encontró el perfil de demostración');
      }

      this.demoProfiles.splice(profileIndex, 1);
      this.demoActivities = this.demoActivities.filter((activity) => activity.user_id !== id);
      return;
    }

    const { error } = await this.supabase.rpc('admin_delete_user', { target_user_id: id });
    if (error) {
      throw error;
    }
  }

  async recordActivity(
    userId: string,
    action: 'LOGIN' | 'UPDATE_PROFILE',
    details?: Record<string, unknown>
  ): Promise<void> {
    if (this.authService.isDemoMode()) {
      this.demoActivities.unshift({
        id: Date.now(),
        user_id: userId,
        action,
        details: details || {},
        created_at: new Date().toISOString(),
      });
      return;
    }

    const { error } = await this.supabase.from('user_activities').insert({
      user_id: userId,
      action,
      details: details || {},
    });

    if (error) {
      throw error;
    }
  }

  getRecentActivities(userId?: string): Observable<UserActivity[]> {
    if (this.authService.isDemoMode()) {
      const activities = this.demoActivities
        .filter((activity) => !userId || activity.user_id === userId)
        .slice(0, 10)
        .map((activity) => ({ ...activity }));
      return of(activities);
    }

    let query = this.supabase
      .from('user_activities')
      .select('id,user_id,action,details,created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    return from(
      query.then(({ data, error }) => {
        if (error) {
          throw error;
        }
        return (data || []) as UserActivity[];
      })
    );
  }

  async getUserActivityCounts(userId: string): Promise<UserActivityCounts> {
    if (this.authService.isDemoMode()) {
      const activities = this.demoActivities.filter((activity) => activity.user_id === userId);
      return {
        totalLogins: activities.filter((activity) => activity.action === 'LOGIN').length,
        otherActions: activities.filter((activity) => activity.action !== 'LOGIN').length,
      };
    }

    const [logins, actions] = await Promise.all([
      this.supabase
        .from('user_activities')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('action', 'LOGIN'),
      this.supabase
        .from('user_activities')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .neq('action', 'LOGIN'),
    ]);

    if (logins.error) {
      throw logins.error;
    }
    if (actions.error) {
      throw actions.error;
    }

    return {
      totalLogins: logins.count || 0,
      otherActions: actions.count || 0,
    };
  }

  private createDemoProfiles(): Profile[] {
    const now = new Date();
    const daysAgo = (days: number) => new Date(now.getTime() - days * 86_400_000).toISOString();
    return [
      {
        id: 'demo-admin',
        email: 'admin.demo@example.test',
        full_name: 'Administración Demo',
        role: 'admin',
        active: true,
        status: 'Activo',
        created_at: daysAgo(120),
      },
      {
        id: 'demo-user',
        email: 'usuario.demo@example.test',
        full_name: 'Usuario de Demostración',
        role: 'user',
        active: true,
        status: 'Activo',
        created_at: daysAgo(45),
      },
      {
        id: 'demo-user-2',
        email: 'cliente.demo@example.test',
        full_name: 'Cliente de Prueba',
        role: 'user',
        active: false,
        status: 'Inactivo',
        created_at: daysAgo(20),
      },
    ];
  }

  private createDemoActivities(): UserActivity[] {
    const now = Date.now();
    return [
      { id: 1, user_id: 'demo-user', action: 'LOGIN', details: {}, created_at: new Date(now).toISOString() },
      { id: 2, user_id: 'demo-user', action: 'UPDATE_PROFILE', details: { fields: ['full_name'] }, created_at: new Date(now - 3_600_000).toISOString() },
      { id: 3, user_id: 'demo-admin', action: 'LOGIN', details: {}, created_at: new Date(now - 7_200_000).toISOString() },
      { id: 4, user_id: 'demo-user-2', action: 'LOGIN', details: {}, created_at: new Date(now - 10_800_000).toISOString() },
    ];
  }

  private createDemoPerformance(): MonthlyPerformance[] {
    const sales = [45, 52, 58, 65, 60, 75];
    const income = [12000, 15000, 14500, 18000, 17200, 21000];
    const now = new Date();

    return sales.map((value, index) => {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - sales.length + index + 1, 1);
      return {
        month: monthDate.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
        sales: value,
        income: income[index],
      };
    });
  }
}
