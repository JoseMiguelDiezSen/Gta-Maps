import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';
import { LocationItem } from '../../models/gta5/location';
import { CollectibleItem } from '../../models/gta5/collectible';
import { TranslationService } from '../../i18n';

@Injectable({ providedIn: 'root' })
export class LocationService {

  constructor(
    private http: HttpClient,
    private translationService: TranslationService
  ) {}

  /**
   * Fusiona elementos canónicos (fuente de verdad espacial/métrica) con traducciones idiomáticas.
   * Garantiza que las coordenadas x/y/z y los identificadores siempre provengan de la base canónica.
   */
  private mergeLocalizedItems<T extends { id: string; position?: any; badge?: any }>(baseItems: T[], localizedItems: any[]): T[] {
    if (!baseItems || baseItems.length === 0) return (localizedItems as T[]) || [];
    if (!localizedItems || localizedItems.length === 0) return baseItems;

    const locMap = new Map<string, any>();
    localizedItems.forEach(item => {
      if (item && item.id) locMap.set(item.id, item);
    });

    return baseItems.map(baseItem => {
      const trans = locMap.get(baseItem.id);
      if (!trans) return baseItem;

      return {
        ...baseItem,
        ...trans,
        // Las coordenadas espaciales, ID canónico y badge se rigen SIEMPRE por la base canónica
        id: baseItem.id,
        position: baseItem.position || trans.position,
        badge: baseItem.badge || trans.badge
      };
    });
  }

  /**
   * Obtiene la lista completa de ubicaciones del mapa.
   * La geometría espacial procede de la base canónica ('es') y las cadenas de texto se traducen según el idioma activo.
   */
  getProperties(gameMode?: string, category?: string, lang?: string): Observable<LocationItem[]> {
    const activeLang = lang || this.translationService.currentLanguage() || 'es';
    const isStory = gameMode === 'story' || gameMode === 'historia';
    const modeFolder = isStory ? 'historia' : 'online';

    const fileList = isStory
      ? [
          'properties.json',
          'services.json',
          'vehicle_shops.json',
          'characters.json',
          'fauna.json',
          'activities.json',
          'strange_places.json'
        ]
      : [
          'properties.json',
          'businesses.json',
          'services.json',
          'vehicle_shops.json',
          'roleplay_jobs.json',
          'characters.json',
          'fauna.json',
          'activities.json',
          'strange_places.json'
        ];

    const requests = fileList.map(fileName => {
      const basePath = `assets/data/gta5/${modeFolder}/es/${fileName}`;

      if (activeLang === 'es') {
        return this.http.get<LocationItem[]>(basePath).pipe(
          catchError(err => {
            console.warn(`No se pudo cargar ${fileName} base:`, err);
            return of([] as LocationItem[]);
          })
        );
      }

      const localizedPath = `assets/data/gta5/${modeFolder}/${activeLang}/${fileName}`;
      return forkJoin({
        base: this.http.get<LocationItem[]>(basePath).pipe(
          catchError(() => of([] as LocationItem[]))
        ),
        localized: this.http.get<any[]>(localizedPath).pipe(
          catchError(() => of([] as any[]))
        )
      }).pipe(
        map(({ base, localized }) => this.mergeLocalizedItems<LocationItem>(base, localized))
      );
    });

    return forkJoin(requests).pipe(
      map(results => {
        let allItems: LocationItem[] = [];
        results.forEach(items => {
          if (Array.isArray(items)) {
            allItems = allItems.concat(items);
          }
        });

        if (category && category.trim() !== '' && category.toLowerCase() !== 'all') {
          return allItems.filter(item =>
            item.category && item.category.toLowerCase() === category.toLowerCase()
          );
        }

        return allItems;
      }),
      catchError(err => {
        console.error('Error al cargar propiedades consolidadas:', err);
        return of([]);
      })
    );
  }

  /**
   * Obtiene la lista de coleccionables de GTA Online o Historia fusionando base espacial con textos localizados.
   */
  getCollectibles(category?: string, lang?: string, gameMode?: string): Observable<CollectibleItem[]> {
    const activeLang = lang || this.translationService.currentLanguage() || 'es';
    const isStory = gameMode === 'story' || gameMode === 'historia';
    const modeFolder = isStory ? 'historia' : 'online';

    const basePath = `assets/data/gta5/${modeFolder}/es/collectibles.json`;

    const fetch$: Observable<CollectibleItem[]> = activeLang === 'es'
      ? this.http.get<CollectibleItem[]>(basePath).pipe(catchError(() => of([] as CollectibleItem[])))
      : forkJoin({
          base: this.http.get<CollectibleItem[]>(basePath).pipe(catchError(() => of([] as CollectibleItem[]))),
          localized: this.http.get<any[]>(`assets/data/gta5/${modeFolder}/${activeLang}/collectibles.json`).pipe(catchError(() => of([] as any[])))
        }).pipe(
          map(({ base, localized }) => this.mergeLocalizedItems<CollectibleItem>(base, localized))
        );

    return fetch$.pipe(
      map(items => {
        if (!Array.isArray(items)) return [];
        if (category && category.trim() !== '' && category.toLowerCase() !== 'all') {
          return items.filter(c => c.category && c.category.toLowerCase() === category.toLowerCase());
        }
        return items;
      }),
      catchError(err => {
        console.error(`Error al obtener coleccionables:`, err);
        return of([]);
      })
    );
  }

  /**
   * Obtiene la lista completa de ubicaciones de Cayo Perico fusionando base espacial con textos localizados.
   */
  getCayoPericoLocations(category?: string, lang?: string): Observable<LocationItem[]> {
    const activeLang = lang || this.translationService.currentLanguage() || 'es';
    const basePath = `assets/data/gta5/online/es/cayo_perico.json`;

    const fetch$: Observable<LocationItem[]> = activeLang === 'es'
      ? this.http.get<LocationItem[]>(basePath).pipe(catchError(() => of([] as LocationItem[])))
      : forkJoin({
          base: this.http.get<LocationItem[]>(basePath).pipe(catchError(() => of([] as LocationItem[]))),
          localized: this.http.get<any[]>(`assets/data/gta5/online/${activeLang}/cayo_perico.json`).pipe(catchError(() => of([] as any[])))
        }).pipe(
          map(({ base, localized }) => this.mergeLocalizedItems<LocationItem>(base, localized))
        );

    return fetch$.pipe(
      map(items => {
        if (!Array.isArray(items)) return [];
        if (category && category.trim() !== '' && category.toLowerCase() !== 'all') {
          return items.filter(loc => loc.category && loc.category.toLowerCase() === category.toLowerCase());
        }
        return items;
      }),
      catchError(err => {
        console.error(`Error al obtener Cayo Perico:`, err);
        return of([]);
      })
    );
  }
}
