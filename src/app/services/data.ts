import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

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

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }


  getStatsMetrics(): Observable<StatsMetric[]> {
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
    const { error } = await this.supabase.rpc('admin_update_user_role', {
      target_user_id: id,
      new_role: role,
    });
    if (error) {
      throw error;
    }
  }

  async updateUserStatus(id: string, active: boolean): Promise<void> {
    const { error } = await this.supabase.rpc('admin_update_user_status', {
      target_user_id: id,
      new_active: active,
    });
    if (error) {
      throw error;
    }
  }

  async deleteUserAccount(id: string): Promise<void> {
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
}
