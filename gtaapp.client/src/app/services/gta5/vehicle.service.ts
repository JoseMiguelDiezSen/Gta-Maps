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
  private normalizeVehicleImage(vehicle: GtaVehicle): GtaVehicle {
    if (!vehicle) return vehicle;
    if (vehicle.imageUrl && vehicle.imageUrl.includes('/assets/images/gta5/marcadores-mapa/')) {
      vehicle.imageUrl = vehicle.imageUrl.replace('/assets/images/gta5/marcadores-mapa/', '/assets/images/gta5/mapa/marcadores-mapa/');
    } else if (vehicle.imageUrl && vehicle.imageUrl.startsWith('assets/images/gta5/marcadores-mapa/')) {
      vehicle.imageUrl = vehicle.imageUrl.replace('assets/images/gta5/marcadores-mapa/', 'assets/images/gta5/mapa/marcadores-mapa/');
    }
    return vehicle;
  }

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
      map(vehicles => (vehicles || []).map(v => this.normalizeVehicleImage(v))),
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
    const dealerPrimaryPath = normalizedDealer ? `/assets/data/gta5/mapa/marcadores-mapa/${mode}/idiomas/es/vehicles/${normalizedDealer}.json` : null;
    const dealerFallbackPath = normalizedDealer ? `/assets/data/gta5/marcadores-mapa/${mode}/idiomas/es/vehicles/${normalizedDealer}.json` : null;

    const fetchDealer = (d: string) => {
      const p1 = `/assets/data/gta5/mapa/marcadores-mapa/${mode}/idiomas/es/vehicles/${d}.json`;
      const p2 = `/assets/data/gta5/marcadores-mapa/${mode}/idiomas/es/vehicles/${d}.json`;
      return this.http.get<GtaVehicle[]>(p1).pipe(catchError(() => this.http.get<GtaVehicle[]>(p2).pipe(catchError(() => of([] as GtaVehicle[])))));
    };

    const dealerNames = ['legendarymotorsport', 'superautos', 'bennys', 'elitas', 'docktease', 'warstock', 'pedal_and_metal', 'pegasus', 'arena_war'];
    const baseSource$: Observable<GtaVehicle[]> = dealerPrimaryPath
      ? this.http.get<GtaVehicle[]>(dealerPrimaryPath).pipe(
          catchError(() => this.http.get<GtaVehicle[]>(dealerFallbackPath!).pipe(catchError(() => of([] as GtaVehicle[]))))
        )
      : forkJoin(dealerNames.map(d => fetchDealer(d))).pipe(map(lists => lists.flat()));

    const fetchLocalized = () => {
      const p1 = `/assets/data/gta5/mapa/marcadores-mapa/${mode}/idiomas/${activeLang}/vehicles.json`;
      const p2 = `/assets/data/gta5/marcadores-mapa/${mode}/idiomas/${activeLang}/vehicles.json`;
      return this.http.get<any[]>(p1).pipe(catchError(() => this.http.get<any[]>(p2).pipe(catchError(() => of([] as any[])))));
    };

    const fetch$: Observable<GtaVehicle[]> = activeLang === 'es'
      ? baseSource$
      : forkJoin({
          base: baseSource$,
          localized: fetchLocalized()
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
        let filtered = (vehicles || []).map(v => this.normalizeVehicleImage(v));
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
