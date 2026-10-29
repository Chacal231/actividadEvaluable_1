import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon,
  IonBadge,
  IonAvatar,
  IonButtons,
  IonMenuButton,
  IonGrid,
  IonRow,
  IonCol,
  IonList,
  IonItem,
  IonLabel,
  IonSkeletonText,
  IonText,
  AlertController,
} from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { ReportService, BusinessMetric } from '../services/report';
import { StatCardComponent } from '../components/stat-card/stat-card.component';

@Component({
  selector: 'app-user-dashboard',
  templateUrl: './user-dashboard.page.html',
  styleUrls: ['./user-dashboard.page.scss'],
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonIcon,
    IonBadge,
    IonAvatar,
    IonButtons,
    IonMenuButton,
    IonGrid,
    IonRow,
    IonCol,
    IonList,
    IonItem,
    IonLabel,
    IonSkeletonText,
    IonText,
    CommonModule,
    StatCardComponent,
  ],
})

export class UserDashboardPage implements OnInit {
  // Angular Signals para el estado reactivo de la UI
  isLoading = signal<boolean>(true);
  metrics = signal<BusinessMetric[]>([]);
  errorMessage = signal<string>('');

  constructor(
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController,
    private reportService: ReportService
  ) {}

  ngOnInit() {
    this.loadMetrics();
  }

  loadMetrics() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.reportService.getMetrics().subscribe({
      next: (metrics) => {
        this.metrics.set(metrics);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('No se pudieron cargar los datos. Inténtalo de nuevo.');
        this.isLoading.set(false);
      },
    });
  }

  // Icono/color asociado a cada métrica según su posición
  getMetricIcon(index: number): string {
    const icons = ['bar-chart-outline', 'cash-outline', 'people-outline', 'cube-outline'];
    return icons[index % icons.length];
  }

  getMetricColor(index: number): string {
    const colors = ['primary', 'success', 'warning', 'tertiary'];
    return colors[index % colors.length];
  }

  async logout() {
    const alert = await this.alertController.create({
      header: 'Cerrar Sesión',
      message: '¿Estás seguro de que deseas cerrar sesión?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Cerrar Sesión',
          role: 'destructive',
          handler: () => {
            this.authService.logout();
            this.router.navigate(['/login']);
          },
        },
      ],
    });
    await alert.present();
  }
}
