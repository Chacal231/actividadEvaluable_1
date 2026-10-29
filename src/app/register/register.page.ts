import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  AsyncValidatorFn,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonText,
  IonSelect,
  IonSelectOption,
  IonNote,
  ToastController,
} from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService, UserRole } from '../services/auth';
import { SupabaseService } from '../services/supabase';
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
    IonTitle,
    IonContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonText,
    IonSelect,
    IonSelectOption,
    IonNote,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
  ],
})
export class RegisterPage {
  registerForm: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private supabaseService: SupabaseService,
    private toastController: ToastController
  ) {
    this.registerForm = this.formBuilder.group(
      {
        nombre: ['', [Validators.required, Validators.minLength(2)]],
        email: [
          '',
          [Validators.required, Validators.email],
          [this.emailTakenValidator()],
        ],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
        role: ['user', [Validators.required]],
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
      const { nombre, email, password, role } = this.registerForm.value as {
        nombre: string;
        email: string;
        password: string;
        role: UserRole;
      };

      try {
        const { data, error } = await this.supabaseService.signUp(email, password);

        if (error) {
          const toast = await this.toastController.create({
            message: error.message || 'Error al registrar usuario',
            duration: 3000,
            color: 'danger',
            position: 'bottom',
          });
          await toast.present();
          this.errorMessage = error.message;
          this.successMessage = '';
          return;
        }

        // También guardamos localmente para mantener compatibilidad con auth guard
        this.authService.register(email, password, role, nombre);

        const toast = await this.toastController.create({
          message: 'Registro exitoso. Revisa tu correo para confirmar.',
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
          message: 'Error inesperado al registrarse',
          duration: 3000,
          color: 'danger',
          position: 'bottom',
        });
        await toast.present();
        this.errorMessage = 'Error inesperado al registrarse';
        this.successMessage = '';
      }
    } else {
      this.registerForm.markAllAsTouched();
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}



