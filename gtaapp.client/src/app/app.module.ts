import { CommonModule } from '@angular/common';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { SharedModule } from './shared/shared.module';

import { AppComponent }           from './app.component';
/* Componentes desacoplados en Gta5Module y Gta6Module
import { Gta5MapOnlineComponent }    from './gta5/map/online/gta5-map-online.component';
import { Gta5MapOfflineComponent }  from './gta5/map/offline/gta5-map-offline.component';
import { Gta5GuiaOfflineComponent } from './gta5/guia/offline/gta5-guia-offline.component';
import { Gta5GuiaOnlineComponent }  from './gta5/guia/online/gta5-guia-online.component';
import { Gta6MapOnlineComponent }    from './gta6/map/online/gta6-map-online.component';
import { Gta6MapOfflineComponent }  from './gta6/map/offline/gta6-map-offline.component';
import { Gta6GuiaOfflineComponent } from './gta6/guia/offline/gta6-guia-offline.component';
import { Gta6GuiaOnlineComponent }  from './gta6/guia/online/gta6-guia-online.component';
import { Gta6VideosComponent }    from './gta6/videos/gta6-videos.component'; */
import { HomeComponent }          from './home/home.component';
/* import { Gta5InfoPanelComponent } from './gta5/map/info-panel/gta5-info-panel.component';
import { Gta6InfoPanelComponent } from './gta6/map/info-panel/gta6-info-panel.component'; */
import { CookieBannerComponent } from './components/cookie-banner/cookie-banner.component';
import { GotyComponent } from './home/goty/goty.component';
/* import { Goty5Component } from './gta5/goty5/goty5.component';
import { Goty6Component } from './gta6/goty6/goty6.component'; */
import { AppRoutingModule }       from './app-routing.module';
// import { TranslatePipe }          from './i18n';
import { AntiScrapingInterceptor } from './interceptors/anti-scraping.interceptor';

@NgModule({
    declarations: [
        AppComponent,
        /* Componentes desacoplados
        Gta5MapOnlineComponent,
        Gta5MapOfflineComponent,
        Gta5GuiaOfflineComponent,
        Gta5GuiaOnlineComponent,
        Gta6MapOnlineComponent,
        Gta6MapOfflineComponent,
        Gta6GuiaOfflineComponent,
        Gta6GuiaOnlineComponent,
        Gta6VideosComponent, */
        HomeComponent,


        CookieBannerComponent,
        GotyComponent,



    ],
    bootstrap: [AppComponent],
    imports: [
        BrowserModule,
        SharedModule,

        AppRoutingModule
    ],
    providers: [
        provideHttpClient(withInterceptorsFromDi()),
        { provide: HTTP_INTERCEPTORS, useClass: AntiScrapingInterceptor, multi: true }
    ]
})
export class AppModule { }
