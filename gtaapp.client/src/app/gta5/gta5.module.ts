import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { Gta5RoutingModule } from './gta5-routing.module';

import { Gta5MapOnlineComponent }   from './map/online/gta5-map-online.component';
import { Gta5MapOfflineComponent }  from './map/offline/gta5-map-offline.component';
import { Gta5GuiaOfflineComponent } from './guia/offline/gta5-guia-offline.component';
import { Gta5GuiaOnlineComponent }  from './guia/online/gta5-guia-online.component';
import { Gta5InfoPanelComponent }   from './map/info-panel/gta5-info-panel.component';
import { Goty5Component }           from './goty5/goty5.component';

@NgModule({
  declarations: [
    Gta5MapOnlineComponent,
    Gta5MapOfflineComponent,
    Gta5GuiaOfflineComponent,
    Gta5GuiaOnlineComponent,
    Gta5InfoPanelComponent,
    Goty5Component
  ],
  imports: [
    SharedModule,
    Gta5RoutingModule
  ]
})
export class Gta5Module {}
