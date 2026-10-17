import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface EncryptedPayloadEnvelope {
  readonly _gta_v1: string;
}

/**
 * Interceptor global que firma todas las peticiones salientes de datos y API
 * con un token dinámico por ventana de tiempo (X-GTA-Shield) y descifra en memoria
 * los paquetes de datos protegidos (_gta_v1) enviados por el backend .NET.
 */
@Injectable()
export class AntiScrapingInterceptor implements HttpInterceptor {
  private static readonly SHIELD_SALT = 'GTA-WORLD-SHIELD-2026-V1';
  private readonly textDecoder = new TextDecoder('utf-8');
  private readonly keyBytes: Uint8Array;

  constructor() {
    const encoder = new TextEncoder();
    this.keyBytes = encoder.encode(AntiScrapingInterceptor.SHIELD_SALT);
  }

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.generateShieldToken();

    const shieldedReq = req.clone({
      setHeaders: {
        'X-GTA-Shield': token,
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    return next.handle(shieldedReq).pipe(
      map((event: HttpEvent<unknown>) => {
        if (event instanceof HttpResponse && this.isEncryptedEnvelope(event.body)) {
          const decodedBody = this.decryptPayload(event.body._gta_v1);
          return event.clone({ body: decodedBody });
        }
        return event;
      })
    );
  }

  private isEncryptedEnvelope(body: unknown): body is EncryptedPayloadEnvelope {
    if (!body || typeof body !== 'object') {
      return false;
    }
    const candidate = body as Record<string, unknown>;
    return typeof candidate['_gta_v1'] === 'string';
  }

  /**
   * Reconstruye en memoria el objeto JSON original a partir del paquete cifrado en tránsito.
   */
  private decryptPayload(cipherBase64: string): unknown {
    const binaryStr = atob(cipherBase64);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    const keyLen = this.keyBytes.length;

    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i) ^ this.keyBytes[i % keyLen];
    }

    const jsonString = this.textDecoder.decode(bytes);
    return JSON.parse(jsonString) as unknown;
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
