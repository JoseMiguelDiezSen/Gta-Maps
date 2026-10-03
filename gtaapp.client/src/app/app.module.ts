import { CommonModule } from '@angular/common';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppComponent }           from './app.component';
import { Gta5OnlineComponent }    from './gta5/online/gta5-online.component';
import { Gta5HistoriaComponent }  from './gta5/historia/gta5-historia.component';
import { Gta6OnlineComponent }    from './gta6/online/gta6-online.component';
import { Gta6HistoriaComponent }  from './gta6/historia/gta6-historia.component';
import { HomeComponent }          from './home/home.component';
import { InfoPanelComponent } from './components/info-panel/info-panel.component';
import { GotyModule } from './components/goty-bot/goty.module';
import { AppRoutingModule }       from './app-routing.module';
import { TranslatePipe }          from './i18n';

@NgModule({
    declarations: [
        AppComponent,
        Gta5OnlineComponent,
        Gta5HistoriaComponent,
        Gta6OnlineComponent,
        Gta6HistoriaComponent,
        HomeComponent,
        InfoPanelComponent,
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
