import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { Gta5MapOnlineComponent }   from './map/online/gta5-map-online.component';
import { Gta5MapOfflineComponent }  from './map/offline/gta5-map-offline.component';
import { Gta5GuiaOfflineComponent } from './guia/offline/gta5-guia-offline.component';
import { Gta5GuiaOnlineComponent }  from './guia/online/gta5-guia-online.component';

const routes: Routes = [
  {
    path: 'gta5-map-online',
    component: Gta5MapOnlineComponent,
    data: {
      titleKey: 'seo.gta5OnlineTitle',
      descriptionKey: 'seo.gta5OnlineDesc',
      title: 'Mapa GTA V Online | GTA Explorer',
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
      title: 'Mapa GTA V Modo Historia | GTA Explorer',
      description: 'Mapa interactivo de GTA V en HD: Misiones Principales, Cartas, Coleccionables , Saltos, Misterios',
      canonical: 'https://gtaexplorer.com/gta5-map-offline'
    }
  },
  {
    path: 'gta5-guia-offline',
    component: Gta5GuiaOfflineComponent,
    data: {
      titleKey: 'seo.gta5GuiaTitle',
      descriptionKey: 'seo.gta5GuiaDesc',
      title: 'Guía GTA V Modo Historia | GTA Explorer',
      description: 'Guía completa y enciclopedia de GTA V: requisitos del 100%, guía táctica de los 6 golpes, bolsa de valores con Lester, personajes y misterios de Los Santos.',
      canonical: 'https://gtaexplorer.com/gta5-guia-offline'
    }
  },
  {
    path: 'gta5-guia-online',
    component: Gta5GuiaOnlineComponent,
    data: {
      titleKey: 'seo.gta5GuiaOnlineTitle',
      title: 'Guía GTA V Online | GTA Explorer',
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
