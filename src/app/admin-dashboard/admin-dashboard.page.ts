import { Component, OnInit, ViewChild, ElementRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon,
  IonBadge,
  IonAvatar,
  IonButtons,
  IonMenuButton,
  IonLabel,
  AlertController,
  ToastController,
  IonSpinner,
  IonSegment,
  IonSegmentButton,
} from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { StatCardComponent } from '../components/stat-card/stat-card.component';
import { DataTableComponent } from '../components/data-table/data-table.component';
import { ReportService } from '../services/report';
import { DataService, UserActivity } from '../services/data';
import { SupabaseService } from '../services/supabase';
import { ThemeService } from '../services/theme.service';
import { addIcons } from 'ionicons';
import { moonOutline, sunnyOutline } from 'ionicons/icons';
import { Chart, registerables } from 'chart.js';
import { firstValueFrom } from 'rxjs';

Chart.register(...registerables);

interface UserTransaction {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  fecha: string;
  estado: string;
}

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.page.html',
  styleUrls: ['./admin-dashboard.page.scss'],
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonIcon,
    IonBadge,
    IonAvatar,
    IonButtons,
    IonMenuButton,
    IonLabel,
    IonSpinner,
    IonSegment,
    IonSegmentButton,
    CommonModule,
    StatCardComponent,
    DataTableComponent,
  ],
})

export class AdminDashboardPage implements OnInit {
  @ViewChild('mixedChart') mixedChart!: ElementRef<HTMLCanvasElement>;

  statsMetrics = signal<any[]>([]);
  usuarios: UserTransaction[] = [];
  allUsers: UserTransaction[] = [];
  activities = signal<UserActivity[]>([]);
  currentUserId: string | null = null;
  rowActions = [
    { key: 'role', label: 'Cambiar rol', icon: 'shield-outline', color: 'primary' },
    { key: 'status', label: 'Cambiar estado', icon: 'pause-circle-outline', color: 'warning' },
    { key: 'delete', label: 'Eliminar usuario', icon: 'trash-outline', color: 'danger' },
  ];

  columns: string[] = ['nombre', 'email', 'rol', 'estado', 'fecha'];
  filterableFields = [
    { key: 'rol', label: 'Rol', options: ['admin', 'user'] },
    { key: 'estado', label: 'Estado', options: ['Activo', 'Inactivo'] },
  ];

  chart: Chart | undefined;
  isLoading = signal<boolean>(true);
  refreshing = signal<boolean>(false);
  activeTab = signal<'overview' | 'users' | 'activity'>('overview');
  activeActionKey = signal<string | null>(null);
  readonly themeService = inject(ThemeService);
  userRole: string | null = null;
  monthlyPerformance: any[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController,
    private reportService: ReportService,
    private dataService: DataService,
    private supabaseService: SupabaseService
  ) {
    addIcons({ 'sunny-outline': sunnyOutline, 'moon-outline': moonOutline });
    this.userRole = this.authService.getCurrentRole();
  }

  ngOnInit() {
    void this.loadAdminData();
  }

  async loadAdminData(): Promise<boolean> {
    this.isLoading.set(true);
    try {
      const [metrics, performance, profiles, activities, { data: authData, error: authError }] =
        await Promise.all([
          firstValueFrom(this.dataService.getStatsMetrics()),
          firstValueFrom(this.dataService.getMonthlyPerformance()),
          firstValueFrom(this.dataService.getProfiles()),
          firstValueFrom(this.dataService.getRecentActivities()),
          this.supabaseService.getUser(),
        ]);
      if (authError) {
        throw authError;
      }

      this.currentUserId = authData.user?.id || null;
      this.statsMetrics.set(metrics);
      this.monthlyPerformance = performance;
      this.activities.set(
        activities.map((activity) => ({
          ...activity,
          user_label:
            profiles.find((profile) => profile.id === activity.user_id)?.email || activity.user_id,
        }))
      );
      this.allUsers = profiles
        .sort((a, b) => {
          const da = a.created_at ? new Date(a.created_at).getTime() : 0;
          const db = b.created_at ? new Date(b.created_at).getTime() : 0;
          return db - da;
        })
        .map((profile) => ({
          id: profile.id,
          nombre: profile.full_name || profile.name || profile.username || profile.email?.split('@')[0] || 'Usuario',
          email: profile.email || '',
          rol: profile.role || 'user',
          fecha: profile.created_at
            ? new Date(profile.created_at).toISOString().split('T')[0]
            : '—',
          estado: profile.status === 'Inactivo' || profile.active === false ? 'Inactivo' : 'Activo',
        }));
      this.usuarios = [...this.allUsers];
      setTimeout(() => this.createMixedChart(), 100);
      return true;
    } catch (error) {
      console.error('Error al cargar los datos de administración:', error);
      await this.showToast('No se pudieron cargar los datos de administración', 'danger');
      return false;
    } finally {
      this.isLoading.set(false);
      this.refreshing.set(false);
    }
  }

  async refreshData() {
    this.refreshing.set(true);
    if (await this.loadAdminData()) {
      await this.showToast('Datos actualizados correctamente', 'success');
    }
  }

  selectTab(value: unknown) {
    if (value === 'overview' || value === 'users' || value === 'activity') {
      this.activeTab.set(value);
      if (value === 'overview') {
        setTimeout(() => this.createMixedChart(), 100);
      }
    }
  }

  async onUserAction(event: { action: string; row: UserTransaction }) {
    const { action, row } = event;
    this.activeActionKey.set(`${row.id}:${action}`);
    try {
      if (action === 'role') {
        const role = row.rol === 'admin' ? 'user' : 'admin';
        await this.dataService.updateUserRole(row.id, role);
        const refreshed = await this.loadAdminData();
        await this.showToast(
          refreshed ? `Rol actualizado a ${role}` : `Rol actualizado a ${role}, pero no se pudo refrescar la tabla`,
          refreshed ? 'success' : 'warning'
        );
      } else if (action === 'status') {
        const active = row.estado !== 'Activo';
        await this.dataService.updateUserStatus(row.id, active);
        const status = active ? 'Activo' : 'Inactivo';
        const refreshed = await this.loadAdminData();
        await this.showToast(
          refreshed ? `Estado actualizado a ${status}` : `Estado actualizado a ${status}, pero no se pudo refrescar la tabla`,
          refreshed ? 'success' : 'warning'
        );
      } else if (action === 'delete') {
        await this.confirmDeleteUser(row);
      }
    } catch (error) {
      console.error('Error al actualizar el usuario:', error);
      await this.showToast(this.getErrorMessage(error, 'No se pudo completar la acción'), 'danger');
    } finally {
      this.activeActionKey.set(null);
    }
  }

  async confirmDeleteUser(row: UserTransaction) {
    if (row.id === this.currentUserId) {
      await this.showToast('No puedes eliminar tu propia cuenta desde el panel', 'warning');
      return;
    }
    const alert = await this.alertController.create({
      header: 'Eliminar Usuario',
      message: `¿Seguro que deseas eliminar a ${row.nombre}? Esta acción no se puede deshacer.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            try {
              await this.dataService.deleteUserAccount(row.id);
              const refreshed = await this.loadAdminData();
              await this.showToast(
                refreshed ? 'Usuario eliminado correctamente' : 'Usuario eliminado, pero no se pudo refrescar la tabla',
                refreshed ? 'success' : 'warning'
              );
            } catch (error) {
              console.error('Error al eliminar usuario:', error);
              await this.showToast(this.getErrorMessage(error, 'No se pudo eliminar el usuario'), 'danger');
            }
          },
        },
      ],
    });
    await alert.present();
    await alert.onDidDismiss();
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

  private getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'object' && error !== null && 'message' in error) {
      const message = error.message;
      if (typeof message === 'string') {
        return message;
      }
    }

    return fallback;
  }


  getMetricIcon(label: string): string {
    const key = (label || '').toLowerCase();
    if (key.includes('usuario')) return 'people-outline';
    if (key.includes('ingreso')) return 'cash-outline';
    if (key.includes('venta') || key.includes('transac')) return 'swap-outline';
    if (key.includes('producto')) return 'cube-outline';
    return 'stats-chart-outline';
  }

  getMetricColor(label: string): string {
    const key = (label || '').toLowerCase();
    if (key.includes('usuario')) return 'primary';
    if (key.includes('ingreso')) return 'success';
    if (key.includes('venta') || key.includes('transac')) return 'warning';
    if (key.includes('producto')) return 'tertiary';
    return 'primary';
  }

  createMixedChart() {
    if (this.mixedChart && this.monthlyPerformance.length > 0) {
      const ctx = this.mixedChart.nativeElement.getContext('2d');
      if (ctx) {
        if (this.chart) {
          this.chart.destroy();
        }
        this.chart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: this.monthlyPerformance.map((m: any) => m.month),
            datasets: [
              {
                label: 'Ventas',
                data: this.monthlyPerformance.map((m: any) => m.sales),
                backgroundColor: 'rgba(59, 130, 246, 0.22)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 3,
                pointRadius: 4,
                pointHoverRadius: 6,
                tension: 0.4,
                fill: true,
              },
              {
                label: 'Ingresos (€)',
                data: this.monthlyPerformance.map((m: any) => m.income),
                borderColor: 'rgba(16, 185, 129, 1)',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                borderWidth: 3,
                pointRadius: 4,
                pointHoverRadius: 6,
                tension: 0.4,
                fill: false,
                yAxisID: 'y1',
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
              mode: 'index',
              intersect: false,
            },
            plugins: {
              legend: {
                display: true,
                position: 'top',
              },
              title: {
                display: true,
                text: 'Rendimiento Mensual',
              },
            },
            scales: {
              y: {
                type: 'linear',
                display: true,
                position: 'left',
                beginAtZero: true,
              },
              y1: {
                type: 'linear',
                display: true,
                position: 'right',
                beginAtZero: true,
                grid: {
                  drawOnChartArea: false,
                },
              },
            },
          },
        });
      }
    }
  }

  async onRowSelected(row: UserTransaction) {
    const alert = await this.alertController.create({
      header: 'Usuario Seleccionado',
      message: `Has seleccionado a ${row.nombre} (${row.email}) con rol ${row.rol} - Estado: ${row.estado}`,
      buttons: ['Aceptar'],
      cssClass: 'custom-alert',
    });
    await alert.present();
  }

  async   logout() {
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
            try {
              this.router.navigate(['/login']);
            } catch (e) {
              window.location.href = '/login';
            }
          },
        },
      ],
    });
    await alert.present();
  }


  exportPDF() {
    this.reportService.exportToPDF('admin-dashboard-content', 'informe_admin.pdf');
  }

  exportCSV() {
    this.reportService.exportToCSV(this.usuarios, 'usuarios_informe.csv');
  }
}
