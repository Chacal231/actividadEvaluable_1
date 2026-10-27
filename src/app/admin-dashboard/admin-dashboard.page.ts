import { Component } from '@angular/core';
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
  AlertController,
  ToastController,
} from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { StatCardComponent } from '../components/stat-card/stat-card.component';
import { DataTableComponent } from '../components/data-table/data-table.component';

interface UserTransaction {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  fecha: string;
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
    CommonModule,
    StatCardComponent,
    DataTableComponent,
  ],
})
export class AdminDashboardPage {
  usuariosActivos: number = 156;
  ingresos: string = '$12,450';
  transacciones: number = 89;

  usuarios: UserTransaction[] = [
    { id: 1, nombre: 'Juan Pérez', email: 'juan@ionic.com', rol: 'user', fecha: '2024-01-15' },
    { id: 2, nombre: 'María García', email: 'maria@ionic.com', rol: 'admin', fecha: '2024-02-20' },
    { id: 3, nombre: 'Carlos López', email: 'carlos@ionic.com', rol: 'user', fecha: '2024-03-10' },
    { id: 4, nombre: 'Ana Martínez', email: 'ana@ionic.com', rol: 'user', fecha: '2024-03-25' },
    { id: 5, nombre: 'Pedro Sánchez', email: 'pedro@ionic.com', rol: 'admin', fecha: '2024-04-05' },
  ];

  columns: string[] = ['nombre', 'email', 'rol', 'fecha'];

  constructor(
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController
  ) {}

  async onRowSelected(row: UserTransaction) {
    const alert = await this.alertController.create({
      header: 'Usuario Seleccionado',
      message: `Has seleccionado a ${row.nombre} (${row.email}) con rol ${row.rol}`,
      buttons: ['Aceptar'],
    });
    await alert.present();
  }

  async mostrarToast() {
    const toast = await this.toastController.create({
      message: 'Datos actualizados correctamente',
      duration: 2000,
      position: 'bottom',
    });
    await toast.present();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}


