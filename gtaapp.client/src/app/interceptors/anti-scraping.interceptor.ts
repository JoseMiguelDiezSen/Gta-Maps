import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Interceptor global que firma todas las peticiones salientes de datos y API
 * con un token dinámico por ventana de tiempo (X-GTA-Shield) validado por el backend .NET.
 */
@Injectable()
export class AntiScrapingInterceptor implements HttpInterceptor {
  private static readonly SHIELD_SALT = 'GTA-WORLD-SHIELD-2026-V1';

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.generateShieldToken();

    const shieldedReq = req.clone({
      setHeaders: {
        'X-GTA-Shield': token,
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    return next.handle(shieldedReq);
  }

  /**
   * Genera un token efímero determinista (FNV-1a 32-bit) vinculado al minuto UTC actual.
   */
  private generateShieldToken(): string {
    const minuteSlot = Math.floor(Date.now() / 60000);
    const payload = `${minuteSlot}:${AntiScrapingInterceptor.SHIELD_SALT}`;

    let hash = 0x811c9dc5;
    for (let i = 0; i < payload.length; i++) {
      hash ^= payload.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }

    const hex = hash.toString(16).padStart(8, '0');
    return `${minuteSlot}.${hex}`;
  }
}
