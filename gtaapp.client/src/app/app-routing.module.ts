import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { Gta6Component } from './gta6/gta6.component';
import { Gta5Component } from './gta5/gta5.component';
import { HomeComponent } from './home/home.component';

const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'home', component: HomeComponent },
    { path: 'gta5', component: Gta5Component },
    { path: 'gt5', redirectTo: '/gta5', pathMatch: 'full' },
    { path: 'gta6', component: Gta6Component },
    { path: '**', redirectTo: '/home' }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }