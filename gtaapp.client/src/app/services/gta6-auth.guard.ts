import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class Gta6AuthGuard implements CanActivate {
  constructor(private readonly router: Router) {}

  canActivate(): boolean | UrlTree {
    const isUnlocked = localStorage.getItem('gta6_unlocked') === 'true';
    if (isUnlocked) {
      return true;
    }
    // Redirigir a Home con parámetro para abrir el modal de contraseña
    return this.router.createUrlTree(['/home'], { queryParams: { gta6locked: '1' } });
  }
}
