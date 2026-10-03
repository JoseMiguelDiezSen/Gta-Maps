import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GotyBotComponent } from './goty-bot.component';

@NgModule({
  declarations: [GotyBotComponent],
  imports: [
    CommonModule,
    FormsModule
  ],
  exports: [GotyBotComponent]
})
export class GotyModule { }
