import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { Gta6MapOnlineComponent }    from './map/online/gta6-map-online.component';
import { Gta6MapOfflineComponent }  from './map/offline/gta6-map-offline.component';
import { Gta6GuiaOfflineComponent } from './guia/offline/gta6-guia-offline.component';
import { Gta6GuiaOnlineComponent }  from './guia/online/gta6-guia-online.component';
import { Gta6VideosComponent }      from './videos/gta6-videos.component';

const routes: Routes = [
  {
    path: 'gta6-map-online',
    component: Gta6MapOnlineComponent,
    data: {
      titleKey: 'seo.gta6OnlineTitle',
      descriptionKey: 'seo.gta6OnlineDesc',
      title: 'Mapa GTA VI Online Vice City Ultra HD - Mapa Interactivo y Novedades | GTA MAPS',
      description: 'Mapa interactivo en HD de GTA 6 Online en Vice City y Leonida. Puntos de interés, carreteras, secretos, noticias y novedades.',
      canonical: 'https://gtaexplorer.com/gta6-map-online'
    }
  },
  {
    path: 'gta6-map-offline',
    component: Gta6MapOfflineComponent,
    data: {
      titleKey: 'seo.gta6HistoriaTitle',
      descriptionKey: 'seo.gta6HistoriaDesc',
      title: 'Mapa GTA VI Modo Historia - Guía de Vice City, Jason & Lucia | GTA MAPS',
      description: 'Mapa interactivo del modo historia de GTA VI con Jason y Lucia. Mapa HD de Vice City, Misiones, Coleccionables y secretos.',
      canonical: 'https://gtaexplorer.com/gta6-map-offline'
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
      canonical: 'https://gtaexplorer.com/gta6-guia-offline'
    }
  },
  {
    path: 'gta6-guia-online',
    component: Gta6GuiaOnlineComponent,
    data: {
      title: 'Guía GTA VI Online | GTA MAPS',
      description: 'Guía específica de GTA VI Online en preparación.',
      canonical: 'https://gtaexplorer.com/gta6-guia-online'
    }
  },
  {
    path: 'gta6-videos',
    component: Gta6VideosComponent,
    data: {
      titleKey: 'seo.gta6VideosTitle',
      descriptionKey: 'seo.gta6VideosDesc',
      title: 'Vídeos GTA VI - Clips de Gameplay & Situaciones en Leonida | GTA MAPS',
      description: 'Recopilación de vídeos, clips breves de gameplay, situaciones curiosas y surrealistas en Grand Theft Auto VI y el Estado de Leonida.',
      canonical: 'https://gtaexplorer.com/gta6-videos'
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class Gta6RoutingModule {}
