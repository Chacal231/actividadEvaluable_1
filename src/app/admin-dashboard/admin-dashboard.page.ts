import { Component, OnInit, ViewChild, ElementRef, signal } from '@angular/core';
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
  AlertController,
  ToastController,
} from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { StatCardComponent } from '../components/stat-card/stat-card.component';
import { DataTableComponent } from '../components/data-table/data-table.component';
import { ReportService } from '../services/report';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface UserTransaction {
  id: number;
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
    CommonModule,
    StatCardComponent,
    DataTableComponent,
  ],
})

export class AdminDashboardPage implements OnInit {
  @ViewChild('mixedChart') mixedChart!: ElementRef<HTMLCanvasElement>;

  usuariosActivos: number = 156;
  ingresos: string = '$12,450';
  transacciones: number = 89;
  productos: number = 45;

  usuarios: UserTransaction[] = [
    { id: 1, nombre: 'Juan Pérez', email: 'juan@ionic.com', rol: 'user', fecha: '2024-01-15', estado: 'Activo' },
    { id: 2, nombre: 'María García', email: 'maria@ionic.com', rol: 'admin', fecha: '2024-02-20', estado: 'Activo' },
    { id: 3, nombre: 'Carlos López', email: 'carlos@ionic.com', rol: 'user', fecha: '2024-03-10', estado: 'Inactivo' },
    { id: 4, nombre: 'Ana Martínez', email: 'ana@ionic.com', rol: 'user', fecha: '2024-03-25', estado: 'Activo' },
    { id: 5, nombre: 'Pedro Sánchez', email: 'pedro@ionic.com', rol: 'admin', fecha: '2024-04-05', estado: 'Activo' },
  ];

  columns: string[] = ['nombre', 'email', 'rol', 'estado', 'fecha'];
  filterableFields = [
    { key: 'rol', label: 'Rol', options: ['admin', 'user'] },
    { key: 'estado', label: 'Estado', options: ['Activo', 'Inactivo'] },
  ];

  chart: Chart | undefined;
  // Usando Angular Signals para estado reactivo de carga
  isLoading = signal<boolean>(true);
  userRole: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController,
    private reportService: ReportService
  ) {
    this.userRole = this.authService.getCurrentRole();
  }

  ngOnInit() {
    setTimeout(() => {
      this.reportService.getMetrics().subscribe((metrics) => {
        this.usuariosActivos = metrics.find((m) => m.label === 'Usuarios')?.value || this.usuariosActivos;
        this.transacciones = metrics.find((m) => m.label === 'Ventas')?.value || this.transacciones;
        this.productos = metrics.find((m) => m.label === 'Productos')?.value || this.productos;
        this.ingresos = '$' + (metrics.find((m) => m.label === 'Ingresos (€)')?.value || 12450).toLocaleString();
        this.isLoading.set(false);
        setTimeout(() => this.createMixedChart(), 100);
      });
    }, 800);
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (!this.isLoading()) {
        this.createMixedChart();
      }
    }, 100);
  }


  createMixedChart() {
    if (this.mixedChart) {
      const ctx = this.mixedChart.nativeElement.getContext('2d');
      if (ctx) {
        if (this.chart) {
          this.chart.destroy();
        }
        this.chart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
            datasets: [
              {
                label: 'Ventas',
                type: 'bar',
                data: [65, 59, 80, 81, 56, 95],
                backgroundColor: 'rgba(54, 162, 235, 0.7)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
                order: 2,
              },
              {
                label: 'Ingresos (€)',
                type: 'line',
                data: [4500, 5200, 7800, 8100, 5600, 9500],
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.1)',
                tension: 0.4,
                order: 1,
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

  async mostrarToast() {
    const toast = await this.toastController.create({
      message: 'Datos actualizados correctamente',
      duration: 2000,
      position: 'bottom',
      color: 'success',
    });
    await toast.present();
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

  exportPDF() {
    this.reportService.exportToPDF('admin-dashboard-content', 'informe_admin.pdf');
  }

  exportCSV() {
    this.reportService.exportToCSV(this.usuarios, 'usuarios_informe.csv');
  }
}




