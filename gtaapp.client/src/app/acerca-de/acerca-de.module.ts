import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { AcercaDeRoutingModule } from './acerca-de-routing.module';
import { AcercaDeComponent } from './acerca-de.component';

@NgModule({
  declarations: [
    AcercaDeComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    AcercaDeRoutingModule
  ]
})
export class AcercaDeModule { }
