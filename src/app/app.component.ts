import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import {
  IonApp,
  IonBadge,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonMenu,
  IonMenuToggle,
  IonRouterOutlet,
  IonSplitPane,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { NavigationEnd, Router } from '@angular/router';
import { AuthService } from './services/auth';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [
    CommonModule,
    IonApp,
    IonBadge,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonMenu,
    IonMenuToggle,
    IonRouterOutlet,
    IonSplitPane,
    IonTitle,
    IonToolbar,
  ],
})
export class AppComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  userRole: string | null = null;
  isMenuVisible = false;
  menuItems = [
    { title: 'Inicio', icon: 'home-outline', route: '/admin-dashboard', roles: ['admin'] },
    { title: 'Dashboard Usuario', icon: 'person-outline', route: '/user-dashboard', roles: ['user', 'admin'] },
    { title: 'Informes', icon: 'document-text-outline', route: '/admin-dashboard', roles: ['admin'] },
    { title: 'Configuración', icon: 'settings-outline', route: '/admin-dashboard', roles: ['admin'] },
  ];

  constructor(private authService: AuthService, private router: Router) {
    inject(ThemeService);
  }

  ngOnInit() {
    this.updateMenuVisibility(this.router.url);
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((event) => this.updateMenuVisibility(event.urlAfterRedirects));

    this.userRole = this.authService.getCurrentRole();
    this.authService.currentUserRole$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((role) => (this.userRole = role));
  }

  private updateMenuVisibility(url: string) {
    const path = url.split(/[?#]/, 1)[0];
    this.isMenuVisible =
      path === '/admin-dashboard' ||
      path === '/user-dashboard' ||
      path === '/admin';
  }

  navigateTo(route: string) {
    void this.router.navigate([route]);
  }

  hasAccess(roles: string[]): boolean {
    return this.userRole ? roles.includes(this.userRole) : false;
  }
}
