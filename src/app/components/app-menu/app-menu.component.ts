import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonMenu,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonIcon,
  IonLabel,
  IonMenuToggle,
  IonBadge,
} from '@ionic/angular';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-menu',
  templateUrl: './app-menu.component.html',
  styleUrls: ['./app-menu.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonMenu,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonIcon,
    IonLabel,
    IonMenuToggle,
    IonBadge,
  ],
})
export class AppMenuComponent implements OnInit {
  userRole: string | null = null;

  menuItems = [
    { title: 'Inicio', icon: 'home-outline', route: '/admin-dashboard', roles: ['admin'] },
    { title: 'Dashboard Usuario', icon: 'person-outline', route: '/user-dashboard', roles: ['user', 'admin'] },
    { title: 'Informes', icon: 'document-text-outline', route: '/admin-dashboard', roles: ['admin'] },
    { title: 'Configuración', icon: 'settings-outline', route: '/admin-dashboard', roles: ['admin'] },
  ];

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.userRole = this.authService.getCurrentRole();
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  hasAccess(roles: string[]): boolean {
    return this.userRole ? roles.includes(this.userRole) : false;
  }
}
