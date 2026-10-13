import { CommonModule } from '@angular/common';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppComponent }           from './app.component';
import { Gta5MapOnlineComponent }    from './gta5/map/online/gta5-map-online.component';
import { Gta5MapOfflineComponent }  from './gta5/map/offline/gta5-map-offline.component';
import { Gta5GuiaOfflineComponent } from './gta5/guia/offline/gta5-guia-offline.component';
import { Gta5GuiaOnlineComponent }  from './gta5/guia/online/gta5-guia-online.component';
import { Gta6MapOnlineComponent }    from './gta6/map/online/gta6-map-online.component';
import { Gta6MapOfflineComponent }  from './gta6/map/offline/gta6-map-offline.component';
import { Gta6GuiaOfflineComponent } from './gta6/guia/offline/gta6-guia-offline.component';
import { Gta6GuiaOnlineComponent }  from './gta6/guia/online/gta6-guia-online.component';
import { Gta6NoticiasComponent }  from './gta6/noticias/gta6-noticias.component';
import { HomeComponent }          from './home/home.component';
import { Gta5InfoPanelComponent } from './components/gta5-info-panel/gta5-info-panel.component';
import { Gta6InfoPanelComponent } from './components/gta6-info-panel/gta6-info-panel.component';
import { CookieBannerComponent } from './components/cookie-banner/cookie-banner.component';
import { GotyComponent } from './home/goty/goty.component';
import { Goty5Component } from './gta5/goty5/goty5.component';
import { Goty6Component } from './gta6/goty6/goty6.component';
import { AppRoutingModule }       from './app-routing.module';
import { TranslatePipe }          from './i18n';

@NgModule({
    declarations: [
        AppComponent,
        Gta5MapOnlineComponent,
        Gta5MapOfflineComponent,
        Gta5GuiaOfflineComponent,
        Gta5GuiaOnlineComponent,
        Gta6MapOnlineComponent,
        Gta6MapOfflineComponent,
        Gta6GuiaOfflineComponent,
        Gta6GuiaOnlineComponent,
        Gta6NoticiasComponent,
        HomeComponent,
        Gta5InfoPanelComponent,
        Gta6InfoPanelComponent,
        CookieBannerComponent,
        GotyComponent,
        Goty5Component,
        Goty6Component,
        TranslatePipe
    ],
    bootstrap: [AppComponent],
    imports: [
        BrowserModule,
        CommonModule,
        FormsModule,
        AppRoutingModule
    ],
    providers: [
        provideHttpClient(withInterceptorsFromDi())
    ]
})
export class AppModule { }
