import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonButtons,
  IonTitle,
  IonContent,
  IonItem,
  IonInput,
  IonButton,
  IonText,
  IonNote,
  IonIcon,
  IonCard,
  IonCardContent,
  IonSpinner,
  ToastController,
} from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { SupabaseService } from '../services/supabase';
import { DataService } from '../services/data';
import { ThemeService } from '../services/theme.service';
import { addIcons } from 'ionicons';
import { moonOutline, sunnyOutline } from 'ionicons/icons';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    IonTitle,
    IonContent,
    IonItem,
    IonInput,
    IonButton,
    IonText,
    IonNote,
    IonIcon,
    IonCard,
    IonCardContent,
    IonSpinner,
    CommonModule,
    ReactiveFormsModule,
  ],
})


export class LoginPage {
  readonly themeService = inject(ThemeService);

  readonly loginForm: FormGroup;
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private supabaseService: SupabaseService,
    private dataService: DataService,
    private toastController: ToastController
  ) {
    addIcons({ 'sunny-outline': sunnyOutline, 'moon-outline': moonOutline });
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  async onLogin() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      const { email, password } = this.loginForm.value;
      try {
        const { data, error } = await this.supabaseService.signIn(email, password);
        if (error) {
          this.errorMessage = error.message || 'Credenciales incorrectas';
          const toast = await this.toastController.create({
            message: 'Correo o contraseña incorrectos',
            duration: 3000,
            color: 'danger',
            position: 'bottom',
          });
          await toast.present();
          this.isLoading = false;
          return;
        }

        const user = data.user;
        if (!user?.id) {
          throw new Error('No se pudo identificar al usuario autenticado');
        }

        const { data: profileData, error: profileError } = await this.supabaseService.client
          .from('profiles')
          .select('role,active,status')
          .eq('id', user.id)
          .maybeSingle();
        if (profileError || !profileData) {
          const { error: signOutError } = await this.supabaseService.signOut();
          if (signOutError) {
            throw signOutError;
          }
          throw profileError || new Error('No se encontró el perfil del usuario');
        }

        if (profileData.active === false || profileData.status === 'Inactivo') {
          const { error: signOutError } = await this.supabaseService.signOut();
          if (signOutError) {
            throw signOutError;
          }
          const inactiveToast = await this.toastController.create({
            message: 'Tu cuenta está inactiva. Contacta con un administrador.',
            duration: 3000,
            color: 'danger',
            position: 'bottom',
          });
          await inactiveToast.present();
          this.isLoading = false;
          return;
        }

        const role = profileData.role === 'admin' ? 'admin' : 'user';
        let activityRecorded = true;
        try {
          await this.dataService.recordActivity(user.id, 'LOGIN');
        } catch (activityError) {
          activityRecorded = false;
          console.error('Error al registrar inicio de sesión:', activityError);
        }

        this.authService.login(email, password);

        try {
          if (typeof (this.authService as any).setRole === 'function') {
            (this.authService as any).setRole(role);
          }
        } catch (e) {}


        const toast = await this.toastController.create({
          message: activityRecorded
            ? 'Inicio de sesión exitoso'
            : 'Sesión iniciada, pero no se pudo registrar la actividad',
          duration: 1500,
          color: activityRecorded ? 'success' : 'warning',
          position: 'bottom',
        });
        await toast.present();

        this.isLoading = false;
        if (role === 'admin') {
          this.router.navigateByUrl('/admin-dashboard');
        } else {
          this.router.navigateByUrl('/user-dashboard');
        }
      } catch (err) {
        this.errorMessage = 'Error al iniciar sesión';
        const toast = await this.toastController.create({
          message: 'Error al iniciar sesión',
          duration: 2500,
          color: 'danger',
          position: 'bottom',
        });
        await toast.present();
        this.isLoading = false;
      }
      if (this.isLoading) {
        this.isLoading = false;
      }

    } else {
      this.loginForm.markAllAsTouched();
    }
  }



  loginAsAdmin() {
    this.authService.logout();
    try {
      if (typeof (this.authService as any).setRole === 'function') {
        (this.authService as any).setRole('admin');
      }
    } catch (e) {}
    const success = this.authService.login('admin@ionic.com', 'admin123');
    if (success) {
      this.router.navigateByUrl('/admin-dashboard');
    }
  }


  loginAsUser() {
    this.authService.logout();
    try {
      if (typeof (this.authService as any).setRole === 'function') {
        (this.authService as any).setRole('user');
      }
    } catch (e) {}
    const success = this.authService.login('user@ionic.com', 'user123');
    if (success) {
      this.router.navigateByUrl('/user-dashboard');
    }
  }



  goToRegister() {
    this.router.navigate(['/register']);
  }
}
