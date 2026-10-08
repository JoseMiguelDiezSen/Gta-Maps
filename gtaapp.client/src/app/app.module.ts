import { CommonModule } from '@angular/common';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppComponent }           from './app.component';
import { Gta5OnlineComponent }    from './gta5/online/gta5-online.component';
import { Gta5HistoriaComponent }  from './gta5/historia/gta5-historia.component';
import { Gta5GuiaComponent }      from './gta5/guia/gta5-guia.component';
import { Gta6OnlineComponent }    from './gta6/online/gta6-online.component';
import { Gta6HistoriaComponent }  from './gta6/historia/gta6-historia.component';
import { Gta6GuiaComponent }      from './gta6/guia/gta6-guia.component';
import { HomeComponent }          from './home/home.component';
import { Gta5InfoPanelComponent } from './components/gta5-info-panel/gta5-info-panel.component';
import { Gta6InfoPanelComponent } from './components/gta6-info-panel/gta6-info-panel.component';
import { CookieBannerComponent } from './components/cookie-banner/cookie-banner.component';
import { GotyModule } from './components/goty-bot/goty.module';
import { AppRoutingModule }       from './app-routing.module';
import { TranslatePipe }          from './i18n';

@NgModule({
    declarations: [
        AppComponent,
        Gta5OnlineComponent,
        Gta5HistoriaComponent,
        Gta5GuiaComponent,
        Gta6OnlineComponent,
        Gta6HistoriaComponent,
        Gta6GuiaComponent,
        HomeComponent,
        Gta5InfoPanelComponent,
        Gta6InfoPanelComponent,
        CookieBannerComponent,
        TranslatePipe
    ],
    bootstrap: [AppComponent],
    imports: [
        BrowserModule,
        CommonModule,
        FormsModule,
        AppRoutingModule,
        GotyModule
    ],
    providers: [
        provideHttpClient(withInterceptorsFromDi())
    ]
})
export class AppModule { }
