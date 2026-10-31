import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withComponentInputBinding } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  checkmarkCircle,
  cashOutline,
  create,
  createOutline,
  cubeOutline,
  filter,
  moon,
  moonOutline,
  pauseCircle,
  pauseCircleOutline,
  person,
  personOutline,
  playCircle,
  peopleOutline,
  receiptOutline,
  refresh,
  refreshOutline,
  search,
  shield,
  shieldOutline,
  swapHorizontalOutline,
  sunny,
  sunnyOutline,
  trendingUpOutline,
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
  'people-outline': peopleOutline,
  'cash-outline': cashOutline,
  'trending-up-outline': trendingUpOutline,
  'swap-horizontal-outline': swapHorizontalOutline,
  'receipt-outline': receiptOutline,
  'cube-outline': cubeOutline,
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
    provideRouter(routes, withComponentInputBinding()),
  ],
});
