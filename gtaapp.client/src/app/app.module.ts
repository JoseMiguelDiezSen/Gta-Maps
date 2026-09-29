import { CommonModule } from '@angular/common';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppComponent }           from './app.component';
import { Gta5OnlineComponent }    from './gta5/online/gta5-online.component';
import { Gta5HistoriaComponent }  from './gta5/historia/gta5-historia.component';
import { Gta6Component }          from './gta6/gta6.component';
import { HomeComponent }          from './home/home.component';
import { InfoPanelComponent } from './components/info-panel/info-panel.component';
import { AppRoutingModule }       from './app-routing.module';
import { TranslatePipe }          from './i18n';

@NgModule({
    declarations: [
        AppComponent,
        Gta5OnlineComponent,
        Gta5HistoriaComponent,
        Gta6Component,
        HomeComponent,
        InfoPanelComponent,
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
