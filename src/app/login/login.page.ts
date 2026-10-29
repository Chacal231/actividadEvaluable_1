import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonInput,
  IonButton,
  IonText,
  IonNote,
  IonIcon,
} from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonItem,
    IonInput,
    IonButton,
    IonText,
    IonNote,
    IonIcon,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
  ],
})

export class LoginPage {
  loginForm: FormGroup;
  errorMessage: string = '';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onLogin() {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      const success = this.authService.login(email, password);
      if (success) {
        const role = this.authService.getCurrentRole();
        if (role === 'admin') {
          this.router.navigate(['/admin-dashboard']);
        } else if (role === 'user') {
          this.router.navigate(['/user-dashboard']);
        }
      } else {
        this.errorMessage = 'Credenciales incorrectas';
      }
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  loginAsAdmin() {
    this.authService.logout();
    const success = this.authService.login('admin@ionic.com', 'admin123');
    if (success) {
      this.router.navigateByUrl('/admin-dashboard');
    }
  }

  loginAsUser() {
    this.authService.logout();
    const success = this.authService.login('user@ionic.com', 'user123');
    if (success) {
      this.router.navigateByUrl('/user-dashboard');
    }
  }


  goToRegister() {
    this.router.navigate(['/register']);
  }
}


