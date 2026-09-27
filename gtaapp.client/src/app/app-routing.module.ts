import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent }           from './home/home.component';
import { Gta5OnlineComponent }     from './gta5/online/gta5-online.component';
import { Gta5HistoriaComponent }   from './gta5/historia/gta5-historia.component';
import { Gta6Component }           from './gta6/gta6.component';

const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'home', component: HomeComponent },

    // ── GTA V ────────────────────────────────────────────────────────────────
    // /gta5 y /gta5online van directo al Online — igual que siempre desde la home
    // Dentro del mapa hay botón para cambiar a Historia (/gta5/historia o /gta5historia)
    { path: 'gta5',          component: Gta5OnlineComponent },
    { path: 'gta5online',    component: Gta5OnlineComponent },
    { path: 'gta5/online',   component: Gta5OnlineComponent },
    { path: 'gta5/historia', component: Gta5HistoriaComponent },
    { path: 'gta5historia',  component: Gta5HistoriaComponent },
    { path: 'gt5',           redirectTo: '/gta5', pathMatch: 'full' },

    // ── GTA VI ───────────────────────────────────────────────────────────────
    { path: 'gta6', component: Gta6Component },

    { path: '**', redirectTo: '/home' }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }