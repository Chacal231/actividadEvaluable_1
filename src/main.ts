import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withComponentInputBinding, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  checkmarkCircle,
  create,
  createOutline,
  filter,
  moon,
  moonOutline,
  pauseCircle,
  pauseCircleOutline,
  person,
  personOutline,
  playCircle,
  refresh,
  refreshOutline,
  search,
  shield,
  shieldOutline,
  sunny,
  sunnyOutline,
  trash,
  trashOutline,
} from 'ionicons/icons';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

addIcons({
  sunny,
  'sunny-outline': sunnyOutline,
  moon,
  'moon-outline': moonOutline,
  shield,
  'shield-outline': shieldOutline,
  person,
  'person-outline': personOutline,
  'pause-circle': pauseCircle,
  'pause-circle-outline': pauseCircleOutline,
  'play-circle': playCircle,
  'checkmark-circle': checkmarkCircle,
  trash,
  'trash-outline': trashOutline,
  create,
  'create-outline': createOutline,
  refresh,
  'refresh-outline': refreshOutline,
  search,
  filter,
});

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules), withComponentInputBinding()),
  ],
});
