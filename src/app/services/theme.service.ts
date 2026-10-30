import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';

export type ThemePreference = 'dark' | 'light';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly storageKey = 'app-theme';
  readonly isDark = signal<boolean>(this.readPreference() === 'dark');

  readonly theme = computed<ThemePreference>(() => (this.isDark() ? 'dark' : 'light'));
  readonly themeIcon = computed(() => (this.isDark() ? 'sunny-outline' : 'moon-outline'));
  readonly themeLabel = computed(() =>
    this.isDark() ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'
  );

  constructor() {
    this.applyTheme(this.isDark());
  }

  toggleTheme() {
    const isDark = !this.isDark();
    this.isDark.set(isDark);
    this.applyTheme(isDark);

    try {
      this.document.defaultView?.localStorage.setItem(this.storageKey, isDark ? 'dark' : 'light');
    } catch (error) {
      console.error('No se pudo guardar la preferencia del tema:', error);
    }
  }

  private readPreference(): ThemePreference {
    try {
      const savedTheme = this.document.defaultView?.localStorage.getItem(this.storageKey);
      return savedTheme === 'light' ? 'light' : 'dark';
    } catch (error) {
      console.error('No se pudo leer la preferencia del tema:', error);
      return 'dark';
    }
  }

  private applyTheme(isDark: boolean) {
    const theme: ThemePreference = isDark ? 'dark' : 'light';
    this.document.body?.classList.toggle('dark', isDark);
    this.document.documentElement.classList.toggle('dark', isDark);
    this.document.body?.classList.toggle('ion-palette-dark', isDark);
    this.document.documentElement.classList.toggle('ion-palette-dark', isDark);
    this.document.documentElement.setAttribute('data-theme', theme);
  }
}
