import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent }           from './home/home.component';
import { Gta5OnlineComponent }     from './gta5/online/gta5-online.component';
import { Gta5HistoriaComponent }   from './gta5/historia/gta5-historia.component';
import { Gta5GuiaComponent }       from './gta5/guia/gta5-guia.component';
import { Gta6OnlineComponent }    from './gta6/online/gta6-online.component';
import { Gta6HistoriaComponent }  from './gta6/historia/gta6-historia.component';
import { Gta6GuiaComponent }      from './gta6/guia/gta6-guia.component';

import { DevAccessGuard }       from './services/dev-access.guard';

const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    {
        path: 'home',
        component: HomeComponent,
        data: {
            titleKey: 'seo.homeTitle',
            descriptionKey: 'seo.homeDesc',
            title: 'GTA MAPS - Mapas Interactivos Ultra HD y Asistente IA para GTA V & GTA VI (Sin Anuncios)',
            description: 'Mapas interactivos en Ultra HD de GTA V, GTA Online, Cayo Perico y GTA VI Vice City. 100% sin anuncios, con Asistente IA, guía de coleccionables al 100%, misterios y vehículos en tiempo real.',
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
            title: 'Mapa GTA V Online Ultra HD - Negocios, Cayo Perico y Asistente IA (Sin Anuncios) | GTA MAPS',
            description: 'Mapa interactivo en Ultra HD de GTA 5 Online y Cayo Perico 100% sin anuncios. Negocios, propiedades, golpes, vehículos, armas y asistente IA en tiempo real.',
            canonical: 'https://gtamaps.dev/gta5-online'
        }
    },
    {
        path: 'gta5-historia',
        component: Gta5HistoriaComponent,
        data: {
            titleKey: 'seo.gta5HistoriaTitle',
            descriptionKey: 'seo.gta5HistoriaDesc',
            title: 'Mapa GTA V 100% Modo Historia - Guía Completa, Misterios y Mapa UV (Sin Anuncios) | GTA MAPS',
            description: 'Guía interactiva 100% de GTA V en Ultra HD y sin anuncios: misiones principales, cartas, piezas de ovni, saltos, misterios paranormales y mapa UV secreto.',
            canonical: 'https://gtamaps.dev/gta5-historia'
        }
    },
    {
        path: 'gta5-guia',
        component: Gta5GuiaComponent,
        canActivate: [DevAccessGuard],
        data: {
            title: 'Guía GTA V - Modo Historia al 100%, Golpes y Misterios | GTA MAPS',
            description: 'Guía completa y enciclopedia de GTA V: requisitos del 100%, guía de golpes, bolsa de valores con Lester, personajes y misterios de Los Santos.',
            canonical: 'https://gtamaps.dev/gta5-guia'
        }
    },
    {
        path: 'gta6-online',
        component: Gta6OnlineComponent,
        canActivate: [DevAccessGuard],
        data: {
            titleKey: 'seo.gta6OnlineTitle',
            descriptionKey: 'seo.gta6OnlineDesc',
            title: 'Mapa GTA VI Online Vice City Ultra HD - Mapa Interactivo y Novedades (Sin Anuncios) | GTA MAPS',
            description: 'Primer mapa interactivo en Ultra HD de GTA 6 Online en Vice City y Leonida 100% sin anuncios. Puntos de interés, carreteras, secretos y novedades.',
            canonical: 'https://gtamaps.dev/gta6-online'
        }
    },
    {
        path: 'gta6-historia',
        component: Gta6HistoriaComponent,
        canActivate: [DevAccessGuard],
        data: {
            titleKey: 'seo.gta6HistoriaTitle',
            descriptionKey: 'seo.gta6HistoriaDesc',
            title: 'Mapa GTA VI Modo Historia - Guía de Vice City, Jason & Lucia (Sin Anuncios) | GTA MAPS',
            description: 'Mapa interactivo del modo historia de GTA VI sin anuncios con Jason y Lucia. Exploración en Ultra HD de Vice City, misiones, coleccionables y secretos.',
            canonical: 'https://gtamaps.dev/gta6-historia'
        }
    },
    {
        path: 'gta6-guia',
        component: Gta6GuiaComponent,
        canActivate: [DevAccessGuard],
        data: {
            title: 'Base de Datos & Guía GTA VI - Vice City y Estado de Leonida | GTA MAPS',
            description: 'Enciclopedia interactiva de GTA VI: análisis de regiones de Leonida, Jason & Lucia, vehículos, armas e inventario físico confirmado.',
            canonical: 'https://gtamaps.dev/gta6-guia'
        }
    },

    // Redirecciones por compatibilidad
    { path: 'gta5',          redirectTo: '/gta5-online', pathMatch: 'full' },
    { path: 'gta5online',    redirectTo: '/gta5-online', pathMatch: 'full' },
    { path: 'gta5/online',   redirectTo: '/gta5-online', pathMatch: 'full' },
    { path: 'gta5/historia', redirectTo: '/gta5-historia', pathMatch: 'full' },
    { path: 'gta5historia',  redirectTo: '/gta5-historia', pathMatch: 'full' },
    { path: 'gta5/guia',     redirectTo: '/gta5-guia', pathMatch: 'full' },
    { path: 'gta5guia',      redirectTo: '/gta5-guia', pathMatch: 'full' },
    { path: 'gt5',           redirectTo: '/gta5-online', pathMatch: 'full' },
    { path: 'gta6',          redirectTo: '/gta6-online', pathMatch: 'full' },
    { path: 'gta6online',    redirectTo: '/gta6-online', pathMatch: 'full' },
    { path: 'gta6/online',   redirectTo: '/gta6-online', pathMatch: 'full' },
    { path: 'gta6/historia', redirectTo: '/gta6-historia', pathMatch: 'full' },
    { path: 'gta6historia',  redirectTo: '/gta6-historia', pathMatch: 'full' },
    { path: 'gta6/guia',     redirectTo: '/gta6-guia', pathMatch: 'full' },
    { path: 'gta6guia',      redirectTo: '/gta6-guia', pathMatch: 'full' },

    { path: '**', redirectTo: '/home' }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }