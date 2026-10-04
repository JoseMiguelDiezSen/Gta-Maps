import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent }           from './home/home.component';
import { Gta5OnlineComponent }     from './gta5/online/gta5-online.component';
import { Gta5HistoriaComponent }   from './gta5/historia/gta5-historia.component';
import { Gta6OnlineComponent }    from './gta6/online/gta6-online.component';
import { Gta6HistoriaComponent }  from './gta6/historia/gta6-historia.component';

const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    {
        path: 'home',
        component: HomeComponent,
        data: {
            titleKey: 'seo.homeTitle',
            descriptionKey: 'seo.homeDesc',
            title: 'GTA MAPS - Mapas Interactivos de GTA V y GTA VI',
            description: 'Mapas interactivos de GTA V y GTA VI con ubicaciones de misiones, vehículos, coleccionables y secretos en Los Santos y Vice City.',
            canonical: 'https://gtamaps.dev/home'
        }
    },

    // ── GTA V ────────────────────────────────────────────────────────────────
    {
        path: 'gta5-online',
        component: Gta5OnlineComponent,
        data: {
            titleKey: 'seo.gta5OnlineTitle',
            descriptionKey: 'seo.gta5OnlineDesc',
            title: 'Mapa GTA V Online Interactivo - Ubicaciones, Vehículos y Coleccionables | GTA MAPS',
            description: 'Mapa interactivo de GTA 5 Online con ubicaciones de negocios, propiedades, vehículos, saltos y coleccionables en tiempo real.',
            canonical: 'https://gtamaps.dev/gta5-online'
        }
    },
    {
        path: 'gta5-historia',
        component: Gta5HistoriaComponent,
        data: {
            titleKey: 'seo.gta5HistoriaTitle',
            descriptionKey: 'seo.gta5HistoriaDesc',
            title: 'Mapa GTA V Modo Historia - Misiones al 100%, Saltos y Secretos | GTA MAPS',
            description: 'Mapa interactivo y guía completa del modo historia de GTA V para el 100%: misiones principales, secundarios, armas y coleccionables.',
            canonical: 'https://gtamaps.dev/gta5-historia'
        }
    },
    {
        path: 'gta6-online',
        component: Gta6OnlineComponent,
        data: {
            titleKey: 'seo.gta6OnlineTitle',
            descriptionKey: 'seo.gta6OnlineDesc',
            title: 'Mapa GTA VI Online Vice City - Ubicaciones y Guía Interactiva | GTA MAPS',
            description: 'Mapa interactivo de GTA 6 Online en Vice City y Leonida con puntos de interés, ubicaciones, carreteras y novedades.',
            canonical: 'https://gtamaps.dev/gta6-online'
        }
    },
    {
        path: 'gta6-historia',
        component: Gta6HistoriaComponent,
        data: {
            titleKey: 'seo.gta6HistoriaTitle',
            descriptionKey: 'seo.gta6HistoriaDesc',
            title: 'Mapa GTA VI Modo Historia - Misiones Jason y Lucia en Leonida | GTA MAPS',
            description: 'Mapa interactivo del modo historia de GTA VI con Jason y Lucia. Exploración de Vice City, misiones, coleccionables y secretos.',
            canonical: 'https://gtamaps.dev/gta6-historia'
        }
    },

    // Redirecciones por compatibilidad
    { path: 'gta5',          redirectTo: '/gta5-online', pathMatch: 'full' },
    { path: 'gta5online',    redirectTo: '/gta5-online', pathMatch: 'full' },
    { path: 'gta5/online',   redirectTo: '/gta5-online', pathMatch: 'full' },
    { path: 'gta5/historia', redirectTo: '/gta5-historia', pathMatch: 'full' },
    { path: 'gta5historia',  redirectTo: '/gta5-historia', pathMatch: 'full' },
    { path: 'gt5',           redirectTo: '/gta5-online', pathMatch: 'full' },
    { path: 'gta6',          redirectTo: '/gta6-online', pathMatch: 'full' },
    { path: 'gta6online',    redirectTo: '/gta6-online', pathMatch: 'full' },
    { path: 'gta6/online',   redirectTo: '/gta6-online', pathMatch: 'full' },
    { path: 'gta6/historia', redirectTo: '/gta6-historia', pathMatch: 'full' },
    { path: 'gta6historia',  redirectTo: '/gta6-historia', pathMatch: 'full' },

    { path: '**', redirectTo: '/home' }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }