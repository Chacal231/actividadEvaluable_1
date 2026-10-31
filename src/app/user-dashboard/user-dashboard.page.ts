import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
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
  IonSkeletonText,
  IonLabel,
  IonSegment,
  IonSegmentButton,
  AlertController,
  ToastController,
} from '@ionic/angular';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../services/auth';
import { DataService, Profile, UserActivity } from '../services/data';
import { SupabaseService } from '../services/supabase';
import { ThemeService } from '../services/theme.service';
import { addIcons } from 'ionicons';
import { logOutOutline, moonOutline, sunnyOutline } from 'ionicons/icons';

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
    IonSkeletonText,
    IonLabel,
    IonSegment,
    IonSegmentButton,
    CommonModule,
    RouterModule,
  ],
})
export class UserDashboardPage implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  readonly themeService = inject(ThemeService);

  isLoading = signal<boolean>(true);
  userProfile = signal<Profile | null>(null);
  errorMessage = signal<string>('');
  activities = signal<UserActivity[]>([]);
  activeTab = signal<'profile' | 'activity'>('profile');
  metricsLoading = signal<boolean>(true);

  personalMetrics = signal<
    { title: string; value: string | number; icon: string; color: string }[]
  >([]);

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private alertController: AlertController,
    private dataService: DataService,
    private supabaseService: SupabaseService,
    private toastController: ToastController
  ) {
    addIcons({
      'log-out-outline': logOutOutline,
      'sunny-outline': sunnyOutline,
      'moon-outline': moonOutline,
    });
  }

  ngOnInit() {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const tab = params.get('tab');
      if (tab === 'activity' || tab === 'profile') {
        this.activeTab.set(tab);
      }
    });

    this.loadUserProfile();
  }

  async loadUserProfile() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      let userId: string | null;
      let userEmail: string | undefined;
      if (this.authService.isDemoMode()) {
        userId = this.authService.getDemoUserId();
      } else {
        const { data, error } = await this.supabaseService.getUser();
        if (error) {
          throw error;
        }
        userId = data.user?.id || null;
        userEmail = data.user?.email;
      }

      if (!userId) {
        this.isLoading.set(false);
        this.router.navigate(['/login']);
        return;
      }

      this.dataService.getProfiles().subscribe({
        next: (profiles) => {
          if (!profiles || profiles.length === 0) {
            this.isLoading.set(false);
            this.router.navigate(['/login']);
            return;
          }

          const profile = profiles.find((item) => item.id === userId) ||
            profiles.find((item) => item.email?.toLowerCase() === userEmail?.toLowerCase());

          if (profile) {
            this.userProfile.set(profile);
            this.loadRecentActivities(profile.id);
            void this.loadPersonalMetrics(profile);
          } else {
            this.isLoading.set(false);
            this.router.navigate(['/login']);
            return;
          }
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error al cargar perfiles:', err);
          this.isLoading.set(false);
          this.router.navigate(['/login']);
        },
      });
    } catch (err) {
      console.error('Error al obtener usuario autenticado:', err);
      this.isLoading.set(false);
      this.router.navigate(['/login']);
    }
  }

  private loadRecentActivities(userId: string) {
    this.dataService.getRecentActivities(userId).subscribe({
      next: (activities) => this.activities.set(activities),
      error: (error) => {
        console.error('Error al cargar actividad personal:', error);
        void this.showToast('No se pudo cargar la actividad reciente', 'danger');
      },
    });
  }

  private async loadPersonalMetrics(profile: Profile) {
    this.metricsLoading.set(true);
    try {
      const counts = await this.dataService.getUserActivityCounts(profile.id);
      const createdAt = profile.created_at ? new Date(profile.created_at) : null;
      const daysSinceRegistration = createdAt && !Number.isNaN(createdAt.getTime())
        ? Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / 86_400_000))
        : '—';
      const accountStatus =
        profile.active === false ? 'Inactivo' : profile.status || 'Activo';

      this.personalMetrics.set([
        {
          title: 'Accesos registrados',
          value: counts.totalLogins,
          icon: 'log-in-outline',
          color: 'primary',
        },
        {
          title: 'Estado de la cuenta',
          value: accountStatus,
          icon: 'shield-checkmark-outline',
          color: profile.active === false ? 'warning' : 'success',
        },
        {
          title: 'Días desde el registro',
          value: daysSinceRegistration,
          icon: 'calendar-outline',
          color: 'tertiary',
        },
        {
          title: 'Acciones realizadas',
          value: counts.otherActions,
          icon: 'flash-outline',
          color: 'secondary',
        },
      ]);
    } catch (error) {
      console.error('Error al cargar métricas personales:', error);
      await this.showToast('No se pudieron cargar las métricas de actividad', 'danger');
    } finally {
      this.metricsLoading.set(false);
    }
  }

  selectTab(value: unknown) {
    if (value === 'profile' || value === 'activity') {
      this.activeTab.set(value);
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { tab: value },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    }
  }

  async actualizarDatos() {
    const profile = this.userProfile();
    if (!profile) {
      await this.showToast('No se pudo cargar el perfil del usuario', 'danger');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Actualizar datos personales',
      message: 'Modifica tu nombre y guarda los cambios en tu perfil.',
      inputs: [
        {
          name: 'full_name',
          type: 'text',
          value: profile.full_name || profile.name || profile.username || '',
          placeholder: 'Nombre completo',
          attributes: { minlength: 2, maxlength: 80, required: true },
        },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          role: 'confirm',
          handler: async (values: { full_name?: string }) => {
            const fullName = values.full_name?.trim() || '';
            if (fullName.length < 2) {
              await this.showToast('El nombre debe tener al menos 2 caracteres', 'warning');
              return false;
            }

            try {
              const updatedProfile = await this.dataService.updateProfile(profile.id, {
                full_name: fullName,
                name: fullName,
              });
              this.userProfile.set(updatedProfile);

              try {
                await this.dataService.recordActivity(profile.id, 'UPDATE_PROFILE', {
                  fields: ['full_name'],
                });
                this.loadRecentActivities(profile.id);
                void this.loadPersonalMetrics(updatedProfile);
                await this.showToast('Datos personales actualizados', 'success');
              } catch (activityError) {
                console.error('Error al registrar actualización de perfil:', activityError);
                await this.showToast('Perfil guardado, pero no se pudo registrar la actividad', 'warning');
              }
              return true;
            } catch (error) {
              console.error('Error al actualizar el perfil:', error);
              await this.showToast(
                error instanceof Error ? error.message : 'No se pudieron guardar los cambios',
                'danger'
              );
              return false;
            }
          },
        },
      ],
    });
    await alert.present();
  }

  async generarReportePersonal() {
    const profile = this.userProfile();
    if (!profile) {
      await this.showToast('No hay datos de perfil para generar el reporte', 'warning');
      return;
    }

    const report = [
      `Informe personal - ${new Date().toLocaleDateString()}`,
      `Nombre: ${profile.full_name || profile.name || profile.username || 'Sin nombre'}`,
      `Correo: ${profile.email}`,
      `Rol: ${profile.role || 'user'}`,
      ...this.personalMetrics().map((metric) => `${metric.title}: ${metric.value}`),
      `Actividades recientes: ${this.activities().length}`,
    ].join('\n');

    const alert = await this.alertController.create({
      header: 'Informe personal',
      subHeader: 'Resumen de tu actividad',
      message: report,
      buttons: [
        { text: 'Cerrar', role: 'cancel' },
        {
          text: 'Descargar texto',
          handler: () => this.downloadReport(report),
        },
      ],
    });
    await alert.present();
    await alert.onDidDismiss();
    await this.showToast('Informe personal generado correctamente', 'success');
  }

  private downloadReport(report: string) {
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'informe_personal.txt';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      color,
      position: 'bottom',
    });
    await toast.present();
  }

  async cerrarSesionRapido() {
    const alert = await this.alertController.create({
      header: 'Cerrar Sesión',
      message: '¿Estás seguro de que deseas cerrar sesión?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
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
