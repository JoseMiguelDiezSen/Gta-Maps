import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { Gta6RoutingModule } from './gta6-routing.module';

import { Gta6MapOnlineComponent }    from './map/online/gta6-map-online.component';
import { Gta6MapOfflineComponent }  from './map/offline/gta6-map-offline.component';
import { Gta6GuiaOfflineComponent } from './guia/offline/gta6-guia-offline.component';
import { Gta6GuiaOnlineComponent }  from './guia/online/gta6-guia-online.component';
import { Gta6InfoPanelComponent }   from './map/info-panel/gta6-info-panel.component';
import { Goty6Component }           from './goty6/goty6.component';
import { Gta6VideosComponent }      from './videos/gta6-videos.component';
import { Gta6NoticiasComponent }    from './noticias/gta6-noticias.component';
import { Gta6MomentosComponent }    from './momentos/gta6-momentos.component';

@NgModule({
  declarations: [
    Gta6MapOnlineComponent,
    Gta6MapOfflineComponent,
    Gta6GuiaOfflineComponent,
    Gta6GuiaOnlineComponent,
    Gta6InfoPanelComponent,
    Goty6Component,
    Gta6VideosComponent,
    Gta6NoticiasComponent,
    Gta6MomentosComponent
  ],
  imports: [
    SharedModule,
    Gta6RoutingModule
  ]
})
export class Gta6Module {}
