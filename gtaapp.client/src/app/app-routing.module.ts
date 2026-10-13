import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent }           from './home/home.component';
import { Gta5MapOnlineComponent }     from './gta5/map/online/gta5-map-online.component';
import { Gta5MapOfflineComponent }   from './gta5/map/offline/gta5-map-offline.component';
import { Gta5GuiaOfflineComponent }   from './gta5/guia/offline/gta5-guia-offline.component';
import { Gta5GuiaOnlineComponent }  from './gta5/guia/online/gta5-guia-online.component';
import { Gta6MapOnlineComponent }    from './gta6/map/online/gta6-map-online.component';
import { Gta6MapOfflineComponent }  from './gta6/map/offline/gta6-map-offline.component';
import { Gta6GuiaOfflineComponent } from './gta6/guia/offline/gta6-guia-offline.component';
import { Gta6GuiaOnlineComponent }  from './gta6/guia/online/gta6-guia-online.component';
import { Gta6NoticiasComponent }  from './gta6/noticias/gta6-noticias.component';

import { DevAccessGuard }       from './services/dev-access.guard';

const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    {
        path: 'home',
        component: HomeComponent,
        data: {
            titleKey: 'seo.homeTitle',
            descriptionKey: 'seo.homeDesc',
            title: 'GTA World - Mapas GTA HD con asistente IA integrado y Guias Interactivas',
            description: 'Mapas HD y Guias Interactivas de GTA 5, GTA 5 Online, Cayo Perico, GTA 6, GTA 6 Online con Asistente de IA integrado, Misiones, Ubicaciones, Vehiculos, Armas, Misterios.',
            canonical: 'https://gtaworld.dev/home'
        }
    },

    // ── GTA V ────────────────────────────────────────────────────────────────
    {
        path: 'gta5-map-online',
        component: Gta5MapOnlineComponent,
        data: {
            titleKey: 'seo.gta5OnlineTitle',
            descriptionKey: 'seo.gta5OnlineDesc',
            title: 'Mapa GTA V Online HD - Propiedades, Negocios, Coleccionables, Cayo Perico y Asistente IA | GTA MAPS',
            description: 'Mapa interactivo en HD de GTA 5 Online y Cayo Perico. Misiones, Propiedades, Vehiculos, Armas, Negocios, Golpes, Misterios y asistente IA en tiempo real.',
            canonical: 'https://gtaworld.dev/gta5-map-online'
        }
    },
    {
        path: 'gta5-map-offline',
        component: Gta5MapOfflineComponent,
        data: {
            titleKey: 'seo.gta5HistoriaTitle',
            descriptionKey: 'seo.gta5HistoriaDesc',
            title: 'Mapa GTA V Modo Historia - Propiedades, Negocios, Misiones, Vehiculos, Armas, Coleccionables, Asistente IA | GTA MAPS',
            description: 'Mapa interactivo de GTA V en HD: Misiones Principales, Cartas, Coleccionables , Saltos, Misterios',
            canonical: 'https://gtaworld.dev/gta5-map-offline'
        }
    },
    {
        path: 'gta5-guia-offline',
        component: Gta5GuiaOfflineComponent,
        data: {
            titleKey: 'seo.gta5GuiaTitle',
            descriptionKey: 'seo.gta5GuiaDesc',
            title: 'Guía GTA V - Modo Historia : Guia para Misiones Principales, Secundarias, Misterios y Trofeos | GTA MAPS',
            description: 'Guía completa y enciclopedia de GTA V: requisitos del 100%, guía táctica de los 6 golpes, bolsa de valores con Lester, personajes y misterios de Los Santos.',
            canonical: 'https://gtaworld.dev/gta5-guia-offline'
        }
    },
    {
        path: 'gta5-guia-online',
        component: Gta5GuiaOnlineComponent,
        data: {
            title: 'Guía GTA V Online | GTA MAPS',
            description: 'Guía específica de GTA V Online en preparación.',
            canonical: 'https://gtaworld.dev/gta5-guia-online'
        }
    },
    {
        path: 'gta6-map-online',
        component: Gta6MapOnlineComponent,
        canActivate: [DevAccessGuard],
        data: {
            titleKey: 'seo.gta6OnlineTitle',
            descriptionKey: 'seo.gta6OnlineDesc',
            title: 'Mapa GTA VI Online Vice City Ultra HD - Mapa Interactivo y Novedades | GTA MAPS',
            description: 'Mapa interactivo en HD de GTA 6 Online en Vice City y Leonida. Puntos de interés, carreteras, secretos, noticias y novedades.',
            canonical: 'https://gtaworld.dev/gta6-map-online'
        }
    },
    {
        path: 'gta6-map-offline',
        component: Gta6MapOfflineComponent,
        canActivate: [DevAccessGuard],
        data: {
            titleKey: 'seo.gta6HistoriaTitle',
            descriptionKey: 'seo.gta6HistoriaDesc',
            title: 'Mapa GTA VI Modo Historia - Guía de Vice City, Jason & Lucia | GTA MAPS',
            description: 'Mapa interactivo del modo historia de GTA VI con Jason y Lucia. Mapa HD de Vice City, Misiones, Coleccionables y secretos.',
            canonical: 'https://gtaworld.dev/gta6-map-offline'
        }
    },
    {
        path: 'gta6-guia-offline',
        component: Gta6GuiaOfflineComponent,
        data: {
            titleKey: 'seo.gta6GuiaTitle',
            descriptionKey: 'seo.gta6GuiaDesc',
            title: 'Guía GTA VI - Base de Datos, Jason & Lucia y Estado de Leonida | GTA MAPS',
            description: 'Enciclopedia interactiva de GTA VI: distritos de Vice City, estado de Leonida, análisis de Jason & Lucia, inventario en maleteros y mecánicas.',
            canonical: 'https://gtaworld.dev/gta6-guia-offline'
        }
    },
    {
        path: 'gta6-guia-online',
        component: Gta6GuiaOnlineComponent,
        data: {
            title: 'Guía GTA VI Online | GTA MAPS',
            description: 'Guía específica de GTA VI Online en preparación.',
            canonical: 'https://gtaworld.dev/gta6-guia-online'
        }
    },
    {
        path: 'gta6-noticias',
        component: Gta6NoticiasComponent,
        data: {
            titleKey: 'seo.gta6NoticiasTitle',
            descriptionKey: 'seo.gta6NoticiasDesc',
            title: 'Noticias & Actualidad GTA VI - Estado de Leonida | GTA MAPS',
            description: 'Últimas noticias y Novedades de Grand Theft Auto VI y el Estado de Leonida.',
            canonical: 'https://gtaworld.dev/gta6-noticias'
        }
    },

    // Redirecciones por compatibilidad
    { path: 'gta6-guia',      redirectTo: '/gta6-guia-offline', pathMatch: 'full' },
    { path: 'gta5-guia',      redirectTo: '/gta5-guia-offline', pathMatch: 'full' },
    { path: 'noticias',      redirectTo: '/gta6-noticias', pathMatch: 'full' },
    { path: 'gta6/noticias', redirectTo: '/gta6-noticias', pathMatch: 'full' },
    { path: 'gta6noticias',  redirectTo: '/gta6-noticias', pathMatch: 'full' },
    { path: 'gta5',          redirectTo: '/gta5-map-online', pathMatch: 'full' },
    { path: 'gta5online',    redirectTo: '/gta5-map-online', pathMatch: 'full' },
    { path: 'gta5/online',   redirectTo: '/gta5-map-online', pathMatch: 'full' },
    { path: 'gta5/historia', redirectTo: '/gta5-map-offline', pathMatch: 'full' },
    { path: 'gta5historia',  redirectTo: '/gta5-map-offline', pathMatch: 'full' },
    { path: 'gta5/guia',     redirectTo: '/gta5-guia-offline', pathMatch: 'full' },
    { path: 'gta5/guia/offline', redirectTo: '/gta5-guia-offline', pathMatch: 'full' },
    { path: 'gta5/guia/online',  redirectTo: '/gta5-guia-online', pathMatch: 'full' },
    { path: 'gta5guia',      redirectTo: '/gta5-guia', pathMatch: 'full' },
    { path: 'gt5',           redirectTo: '/gta5-map-online', pathMatch: 'full' },
    { path: 'gta6',          redirectTo: '/gta6-map-online', pathMatch: 'full' },
    { path: 'gta6online',    redirectTo: '/gta6-map-online', pathMatch: 'full' },
    { path: 'gta6/online',   redirectTo: '/gta6-map-online', pathMatch: 'full' },
    { path: 'gta6/historia', redirectTo: '/gta6-map-offline', pathMatch: 'full' },
    { path: 'gta6historia',  redirectTo: '/gta6-map-offline', pathMatch: 'full' },
    { path: 'gta6/guia',     redirectTo: '/gta6-guia-offline', pathMatch: 'full' },
    { path: 'gta6/guia/offline', redirectTo: '/gta6-guia-offline', pathMatch: 'full' },
    { path: 'gta6/guia/online',  redirectTo: '/gta6-guia-online', pathMatch: 'full' },
    { path: 'gta6guia',      redirectTo: '/gta6-guia-offline', pathMatch: 'full' },

    { path: '**', redirectTo: '/home' }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
