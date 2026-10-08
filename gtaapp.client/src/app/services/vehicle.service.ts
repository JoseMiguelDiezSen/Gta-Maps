import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, map, forkJoin } from 'rxjs';
import { GtaVehicle } from '../models/vehicle';
import { TranslationService } from '../i18n';

@Injectable({ providedIn: 'root' })
export class VehicleService {

  constructor(
    private http: HttpClient,
    private translationService: TranslationService
  ) {}

  /**
   * Obtiene el catálogo completo de vehículos.
   * La base canónica técnica (precios, estadísticas, fotos, concesionario) procede de 'es',
   * superponiendo nombres y descripciones traducidas cuando el idioma activo es otro.
   */
  getVehicles(dealership?: string, category?: string, lang?: string, gameMode: 'story' | 'online' = 'online'): Observable<GtaVehicle[]> {
    const activeLang = lang || this.translationService.currentLanguage() || 'es';
    const mode = gameMode === 'story' ? 'historia' : 'online';
    const basePath = `/assets/data/gta5/${mode}/es/vehicles.json`;

    const fetch$: Observable<GtaVehicle[]> = activeLang === 'es'
      ? this.http.get<GtaVehicle[]>(basePath).pipe(catchError(() => of([] as GtaVehicle[])))
      : forkJoin({
          base: this.http.get<GtaVehicle[]>(basePath).pipe(catchError(() => of([] as GtaVehicle[]))),
          localized: this.http.get<any[]>(`/assets/data/gta5/${mode}/${activeLang}/vehicles.json`).pipe(catchError(() => of([] as any[])))
        }).pipe(
          map(({ base, localized }) => {
            if (!base || base.length === 0) return (localized as GtaVehicle[]) || [];
            if (!localized || localized.length === 0) return base;

            const locMap = new Map<string, any>();
            localized.forEach(v => {
              if (v && v.id) locMap.set(v.id, v);
            });

            return base.map(b => {
              const trans = locMap.get(b.id);
              if (!trans) return b;
              return {
                ...b,
                name: trans.name || b.name,
                description: trans.description || b.description,
                priceFormatted: trans.priceFormatted || b.priceFormatted
              };
            });
          })
        );

    return fetch$.pipe(
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
        console.error('Error al obtener vehículos:', err);
        return of([]);
      })
    );
  }
}
