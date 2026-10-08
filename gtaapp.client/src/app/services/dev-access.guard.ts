import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';

/**
 * Interruptor maestro para funciones en desarrollo (GTA 6 y Guías).
 * Para liberar todo en producción, basta con cambiar esta variable a true.
 */
export const IS_DEV_FEATURE_UNLOCKED = false;

export function isDevAccessAllowed(): boolean {
  if (IS_DEV_FEATURE_UNLOCKED) {
    return true;
  }
  return typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
}

@Injectable({
  providedIn: 'root'
})
export class DevAccessGuard implements CanActivate {
  constructor(private readonly router: Router) {}

  canActivate(): boolean | UrlTree {
    if (isDevAccessAllowed()) {
      return true;
    }
    // En producción expulsa a la Home
    return this.router.createUrlTree(['/home']);
  }
}
