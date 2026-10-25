import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { Gta5MapOnlineComponent }   from './map/online/gta5-map-online.component';
import { Gta5MapOfflineComponent }  from './map/offline/gta5-map-offline.component';
import { Gta5GuiaOnlineComponent }  from './guia/online/gta5-guia-online.component';

const routes: Routes = [
  {
    path: 'gta5-map-online',
    component: Gta5MapOnlineComponent,
    data: {
      titleKey: 'seo.gta5OnlineTitle',
      descriptionKey: 'seo.gta5OnlineDesc',
      title: 'Mapa GTA V Online HD - Propiedades, Negocios, Coleccionables, Cayo Perico y Asistente IA | GTA MAPS',
      description: 'Mapa interactivo en HD de GTA 5 Online y Cayo Perico. Misiones, Propiedades, Vehiculos, Armas, Negocios, Golpes, Misterios y asistente IA en tiempo real.',
      canonical: 'https://gtaexplorer.com/gta5-map-online'
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
      canonical: 'https://gtaexplorer.com/gta5-map-offline'
    }
  },
  {
    path: 'gta5-guia-offline',
    redirectTo: 'gta5-guia-online',
    pathMatch: 'full'
  },
  {
    path: 'gta5-guia-online',
    component: Gta5GuiaOnlineComponent,
    data: {
      title: 'Guía GTA V Online | GTA MAPS',
      description: 'Guía específica de GTA V Online en preparación.',
      canonical: 'https://gtaexplorer.com/gta5-guia-online'
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class Gta5RoutingModule {}
