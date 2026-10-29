import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular';
import { AppMenuComponent } from './components/app-menu/app-menu.component';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [IonApp, IonRouterOutlet, AppMenuComponent],
})
export class AppComponent {
  constructor() {}
}


