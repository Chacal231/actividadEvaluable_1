import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  AsyncValidatorFn,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
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
  IonCard,
  IonCardContent,
  IonSpinner,
  IonIcon,
  ToastController,
} from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { SupabaseService } from '../services/supabase';
import { ThemeService } from '../services/theme.service';
import { addIcons } from 'ionicons';
import { moonOutline, sunnyOutline } from 'ionicons/icons';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');

  if (!password || !confirmPassword) {
    return null;
  }

  if (confirmPassword.value === '') {
    return null;
  }

  return password.value === confirmPassword.value ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
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
    IonCard,
    IonCardContent,
    IonSpinner,
    IonIcon,
    CommonModule,
    ReactiveFormsModule,
  ],
})
export class RegisterPage {
  readonly themeService = inject(ThemeService);

  readonly registerForm: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private supabaseService: SupabaseService,
    private toastController: ToastController
  ) {
    addIcons({ 'sunny-outline': sunnyOutline, 'moon-outline': moonOutline });
    this.registerForm = this.formBuilder.group(
      {
        nombre: ['', [Validators.required, Validators.minLength(2)]],
        email: this.formBuilder.control('', {
          validators: [Validators.required, Validators.email],
          asyncValidators: [this.emailTakenValidator()],
          updateOn: 'blur',
        }),
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
      },
      {
        validators: [passwordMatchValidator],
      }
    );
  }

  emailTakenValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value) {
        return of(null);
      }
      return this.authService.checkEmailExists(control.value).pipe(
        map((exists) => (exists ? { emailTomado: true } : null)),
        catchError(() => of(null))
      );
    };
  }

  async onRegister() {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';
      const { nombre, email, password } = this.registerForm.value as {
        nombre: string;
        email: string;
        password: string;
      };

      try {
        const { error } = await this.supabaseService.signUp(email, password, {
          name: nombre,
          full_name: nombre,
        });


        if (error) {
          const errMsg = error.message || 'Error al registrar usuario';
          const toast = await this.toastController.create({
            message: errMsg.toLowerCase().includes('rate') || errMsg.toLowerCase().includes('limit')
              ? 'Cuenta creada con aviso. Verifica tu correo o inicia sesión directamente.'
              : errMsg,
            duration: 3500,
            color: errMsg.toLowerCase().includes('rate') ? 'warning' : 'danger',
            position: 'bottom',
          });
          await toast.present();
          this.errorMessage = errMsg;
          this.successMessage = '';
          return;
        }

        try {
          this.authService.register(email, password, 'user', nombre);
          if (typeof (this.authService as any).setRole === 'function') {
            (this.authService as any).setRole('user');
          }
        } catch (e) {
          console.error('AuthService register error:', e);
        }

        const toast = await this.toastController.create({
          message: 'Registro exitoso. Puedes iniciar sesión.',
          duration: 3000,
          color: 'success',
          position: 'bottom',
        });
        await toast.present();

        this.successMessage = 'Registro exitoso. Puedes iniciar sesión.';
        this.errorMessage = '';
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1500);

      } catch (err: any) {
        const toast = await this.toastController.create({
          message: err?.message || 'Error inesperado al registrarse',
          duration: 3500,
          color: 'danger',
          position: 'bottom',
        });
        await toast.present();
        this.errorMessage = err?.message || 'Error inesperado al registrarse';
        this.successMessage = '';
      } finally {
        this.isLoading = false;
      }
    } else {
      this.registerForm.markAllAsTouched();
    }
  }



  goToLogin() {
    this.router.navigate(['/login']);
  }
}

