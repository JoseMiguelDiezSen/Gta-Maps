import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, of, map, forkJoin } from 'rxjs';
import { GtaVehicle } from '../../models/gta5/vehicle';
import { TranslationService } from '../../i18n';

@Injectable({ providedIn: 'root' })
export class VehicleService {

  constructor(
    private http: HttpClient,
    private translationService: TranslationService
  ) {}

  /**
   * Obtiene el catálogo de vehículos de GTA 5.
   * Conecta con la API backend /api/vehicles (.NET 10) con filtrado y rate-limiting en servidor.
   * Cuenta con mecanismo de fallback resiliente a assets locales si la API no está disponible.
   */
  getVehicles(dealership?: string, category?: string, lang?: string, gameMode: 'story' | 'online' = 'online'): Observable<GtaVehicle[]> {
    const activeLang = lang || this.translationService.currentLanguage() || 'es';

    let params = new HttpParams().set('lang', activeLang);
    if (dealership) {
      params = params.set('dealership', dealership);
    }
    if (category && category !== 'all') {
      params = params.set('category', category);
    }

    return this.http.get<GtaVehicle[]>('/api/vehicles', { params }).pipe(
      catchError(err => {
        console.warn('[VehicleService] API backend no disponible, activando fallback local:', err);
        return this.loadLocalVehiclesFallback(dealership, category, activeLang, gameMode);
      })
    );
  }

  /**
   * Fallback local directo desde assets estáticos en caso de desconexión del backend.
   */
  private loadLocalVehiclesFallback(dealership?: string, category?: string, activeLang = 'es', gameMode: 'story' | 'online' = 'online'): Observable<GtaVehicle[]> {
    const mode = gameMode === 'story' ? 'offline' : 'online';
    const normalizedDealer = dealership ? (dealership.toLowerCase() === 'especiales' ? 'pegasus' : dealership.toLowerCase()) : null;
    const dealerPath = normalizedDealer ? `/assets/data/gta5/marcadores-mapa/${mode}/idiomas/es/vehicles/${normalizedDealer}.json` : null;
    const dealerNames = ['legendarymotorsport', 'superautos', 'bennys', 'elitas', 'docktease', 'warstock', 'pedal_and_metal', 'pegasus', 'arena_war'];
    const baseSource$: Observable<GtaVehicle[]> = dealerPath
      ? this.http.get<GtaVehicle[]>(dealerPath).pipe(catchError(() => of([] as GtaVehicle[])))
      : forkJoin(
          dealerNames.map(d => this.http.get<GtaVehicle[]>(`/assets/data/gta5/marcadores-mapa/${mode}/idiomas/es/vehicles/${d}.json`).pipe(catchError(() => of([] as GtaVehicle[]))))
        ).pipe(map(lists => lists.flat()));

    const fetch$: Observable<GtaVehicle[]> = activeLang === 'es'
      ? baseSource$
      : forkJoin({
          base: baseSource$,
          localized: this.http.get<any[]>(`/assets/data/gta5/marcadores-mapa/${mode}/idiomas/${activeLang}/vehicles.json`).pipe(catchError(() => of([] as any[])))
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
          const d = dealership.toLowerCase();
          filtered = filtered.filter(v => {
            const vd = (v.dealership || '').toLowerCase();
            return (d === 'pegasus' || d === 'especiales')
              ? (vd === 'pegasus' || vd === 'especiales')
              : vd === d;
          });
        }
        if (category && category !== 'all') {
          filtered = filtered.filter(v => (v.category || '').toLowerCase() === category.toLowerCase());
        }
        return filtered;
      }),
      catchError(() => of([]))
    );
  }
}
