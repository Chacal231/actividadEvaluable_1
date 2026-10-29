import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );
  }

  get client() {
    return this.supabase;
  }

  signUp(email: string, password: string) {
    return this.supabase.auth.signUp({
      email: email,
      password: password,
    });
  }

  signIn(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
  }

  signOut() {
    return this.supabase.auth.signOut();
  }

  getUser() {
    return this.supabase.auth.getUser();
  }
}

