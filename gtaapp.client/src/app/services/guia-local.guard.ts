import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class GuiaLocalGuard implements CanActivate {
  private readonly router = inject(Router);

  canActivate(): boolean | UrlTree {
    const isLocal = typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    if (isLocal) {
      return true;
    }

    // En producción redirigir a Home (acceso bloqueado)
    return this.router.createUrlTree(['/home']);
  }
}
