import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AcercaDeComponent } from './acerca-de.component';

const routes: Routes = [
  {
    path: '',
    component: AcercaDeComponent,
    data: {
      titleKey: 'seo.aboutTitle',
      descriptionKey: 'seo.aboutDesc',
      title: 'Acerca de GTA Explorer - Plataforma y Comunidad',
      description: 'Conoce los detalles, tecnologías y visión de GTA Explorer.',
      canonical: 'https://gtaexplorer.com/acerca-de'
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AcercaDeRoutingModule { }
