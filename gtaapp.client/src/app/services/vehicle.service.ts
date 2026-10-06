import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
   * Obtiene el catálogo completo de vehículos filtrado por concesionario, categoría e idioma activo
   * leyendo directamente los ficheros de datos locales en assets/data/gta5/online/{lang}/vehicles.json.
   */
  getVehicles(dealership?: string, category?: string, lang?: string, gameMode: 'story' | 'online' = 'online'): Observable<GtaVehicle[]> {
    const activeLang = lang || this.translationService.currentLanguage() || 'es';
    const mode = gameMode === 'story' ? 'historia' : 'online';

    return this.http.get<GtaVehicle[]>(`/assets/data/gta5/${mode}/${activeLang}/vehicles.json`).pipe(
      map(vehicles => {
        let filtered = vehicles || [];
        if (dealership) {
          filtered = filtered.filter(v => (v.dealership || '').toLowerCase() === dealership.toLowerCase());
        }
        if (category && category !== 'all') {
          filtered = filtered.filter(v => (v.category || '').toLowerCase() === category.toLowerCase());
        }
        return filtered;
      }),
      catchError(err => {
        console.error('Error al obtener vehículos desde assets locales:', err);
        return of([]);
      })
    );
  }
}
