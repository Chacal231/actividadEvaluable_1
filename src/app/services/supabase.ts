import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

/**
 * Servicio centralizado para la conexión con Supabase
 * Gestiona autenticación, cliente y operaciones base
 */
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

  /**
   * Cliente Supabase para consultas directas a tablas
   */
  get client() {
    return this.supabase;
  }

  /**
   * Registro de usuario en Supabase Auth
   * @param email Correo electrónico
   * @param password Contraseña
   */
  signUp(email: string, password: string, data?: { name?: string; full_name?: string; role?: string }) {
    return this.supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: data || {},
      },
    });
  }


  /**
   * Inicio de sesión con Supabase Auth
   * @param email Correo electrónico
   * @param password Contraseña
   */
  signIn(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
  }

  /**
   * Cierre de sesión
   */
  signOut() {
    return this.supabase.auth.signOut();
  }

  /**
   * Obtener usuario actual
   */
  getUser() {
    return this.supabase.auth.getUser();
  }
}


