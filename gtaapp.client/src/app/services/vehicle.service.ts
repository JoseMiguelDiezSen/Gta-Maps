import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, of, map } from 'rxjs';
import { GtaVehicle } from '../models/vehicle';
import { TranslationService } from '../i18n';

@Injectable({ providedIn: 'root' })
export class VehicleService {

  constructor(
    private http: HttpClient,
    private translationService: TranslationService
  ) {}

  /**
   * Obtiene el catálogo completo de vehículos o filtrado por concesionario y categoría.
   * Cuenta con fallback automático al archivo estático en assets/data si /api/vehicles no responde.
   */
  getVehicles(dealership?: string, category?: string, lang?: string): Observable<GtaVehicle[]> {
    let params = new HttpParams();
    if (dealership) params = params.set('dealership', dealership);
    if (category) params = params.set('category', category);

    const activeLang = lang || this.translationService.currentLanguage() || 'es';

    return this.http.get<GtaVehicle[]>('/api/vehicles', { params }).pipe(
      catchError(() => {
        // Fallback robusto a los assets estáticos
        return this.http.get<GtaVehicle[]>(`/assets/data/gta5/online/${activeLang}/vehicles.json`).pipe(
          map(vehicles => {
            let filtered = vehicles || [];
            if (dealership) {
              filtered = filtered.filter(v => (v.dealership || '').toLowerCase() === dealership.toLowerCase());
            }
            if (category) {
              filtered = filtered.filter(v => (v.category || '').toLowerCase() === category.toLowerCase());
            }
            return filtered;
          }),
          catchError(err => {
            console.error('Error al obtener vehículos desde fallback local:', err);
            return of([]);
          })
        );
      })
    );
  }
}
