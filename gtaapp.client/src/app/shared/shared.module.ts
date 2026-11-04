import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '../i18n';
import { TopNavComponent } from './top-nav/top-nav.component';

@NgModule({
  declarations: [
    TranslatePipe,
    TopNavComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  exports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    TopNavComponent
  ]
})
export class SharedModule {}
