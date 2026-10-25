import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, forkJoin, map, of, throwError } from 'rxjs';
import { LocationItem } from '../../models/gta5/location';
import { CollectibleItem } from '../../models/gta5/collectible';
import { TranslationService } from '../../i18n';

@Injectable({ providedIn: 'root' })
export class LocationService {

  private readonly http = inject(HttpClient);
  private readonly translationService = inject(TranslationService);

  private normalizeItemImages<T>(item: T): T {
    if (!item || typeof item !== 'object') return item;
    const loc = item as { imageUrl?: string; thumbnail?: string; image?: string };
    const fixPath = (path?: string): string | undefined => {
      if (!path || typeof path !== 'string') return path;
      if (path.includes('/assets/images/gta5/marcadores-mapa/')) {
        return path.replace('/assets/images/gta5/marcadores-mapa/', '/assets/images/gta5/mapa/marcadores-mapa/');
      }
      if (path.startsWith('assets/images/gta5/marcadores-mapa/')) {
        return path.replace('assets/images/gta5/marcadores-mapa/', '/assets/images/gta5/mapa/marcadores-mapa/');
      }
      return path;
    };
    if (loc.imageUrl) loc.imageUrl = fixPath(loc.imageUrl);
    if (loc.thumbnail) loc.thumbnail = fixPath(loc.thumbnail);
    if (loc.image) loc.image = fixPath(loc.image);
    return item;
  }

  /**
   * Carga un archivo JSON canónico de datos.
   * Si falla, propaga el error (throwError) para que la vista o el llamador no interprete
   * un error de red o de parseo como si la categoría estuviera vacía.
   */
  private fetchJson<T>(path: string): Observable<T> {
    return this.http.get<T>(path).pipe(
      catchError(err => {
        console.error(`[LocationService] Error crítico al cargar dataset canónico ${path}:`, err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Carga un archivo JSON de idioma secundario opcional.
   * Si no existe o falla, realiza fallback resiliente a lista vacía para no romper la carga base en español.
   */
  private fetchOptionalTranslation<T>(path: string): Observable<T | null> {
    return this.http.get<T>(path).pipe(
      catchError(err => {
        console.warn(`[LocationService] Traducción opcional no disponible en ${path}, usando texto base:`, err.statusText || err.message);
        return of(null);
      })
    );
  }

  /**
   * Fusiona elementos canónicos (fuente de verdad espacial/métrica) con traducciones idiomáticas.
   * Garantiza que las coordenadas x/y/z y los identificadores siempre provengan de la base canónica.
   */
  private mergeLocalizedItems<T extends { id: string; position?: unknown; badge?: unknown }>(baseItems: T[], localizedItems: Partial<T>[]): T[] {
    if (!baseItems || baseItems.length === 0) return (localizedItems as T[]) || [];
    if (!localizedItems || localizedItems.length === 0) return baseItems;

    const locMap = new Map<string, Partial<T>>();
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
    const modeFolder = isStory ? 'offline' : 'online';

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
      const primaryBasePath = `assets/data/gta5/mapa/marcadores-mapa/${modeFolder}/idiomas/es/${fileName}`;

      if (activeLang === 'es') {
        return this.fetchJson<LocationItem[]>(primaryBasePath).pipe(
          map(items => (items || []).map(i => this.normalizeItemImages(i)))
        );
      }

      const primaryLocalizedPath = `assets/data/gta5/mapa/marcadores-mapa/${modeFolder}/idiomas/${activeLang}/${fileName}`;

      return forkJoin({
        base: this.fetchJson<LocationItem[]>(primaryBasePath),
        localized: this.fetchOptionalTranslation<Partial<LocationItem>[]>(primaryLocalizedPath)
      }).pipe(
        map(({ base, localized }) => this.mergeLocalizedItems<LocationItem>(base, localized || []).map(i => this.normalizeItemImages(i)))
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
    const modeFolder = isStory ? 'offline' : 'online';

    const primaryBasePath = `assets/data/gta5/mapa/marcadores-mapa/${modeFolder}/idiomas/es/collectibles.json`;
    const primaryLocalizedPath = `assets/data/gta5/mapa/marcadores-mapa/${modeFolder}/idiomas/${activeLang}/collectibles.json`;

    const fetch$: Observable<CollectibleItem[]> = activeLang === 'es'
      ? this.fetchJson<CollectibleItem[]>(primaryBasePath)
      : forkJoin({
          base: this.fetchJson<CollectibleItem[]>(primaryBasePath),
          localized: this.fetchOptionalTranslation<Partial<CollectibleItem>[]>(primaryLocalizedPath)
        }).pipe(
          map(({ base, localized }) => this.mergeLocalizedItems<CollectibleItem>(base, localized || []))
        );

    return fetch$.pipe(
      map(items => {
        if (!Array.isArray(items)) return [];
        const normalized = items.map(i => this.normalizeItemImages(i));
        if (category && category.trim() !== '' && category.toLowerCase() !== 'all') {
          return normalized.filter(c => c.category && c.category.toLowerCase() === category.toLowerCase());
        }
        return normalized;
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
    const primaryBasePath = `assets/data/gta5/mapa/marcadores-mapa/online/idiomas/es/cayo_perico.json`;
    const primaryLocalizedPath = `assets/data/gta5/mapa/marcadores-mapa/online/idiomas/${activeLang}/cayo_perico.json`;

    const fetch$: Observable<LocationItem[]> = activeLang === 'es'
      ? this.fetchJson<LocationItem[]>(primaryBasePath)
      : forkJoin({
          base: this.fetchJson<LocationItem[]>(primaryBasePath),
          localized: this.fetchOptionalTranslation<Partial<LocationItem>[]>(primaryLocalizedPath)
        }).pipe(
          map(({ base, localized }) => this.mergeLocalizedItems<LocationItem>(base, localized || []))
        );

    return fetch$.pipe(
      map(items => {
        if (!Array.isArray(items)) return [];
        const normalized = items.map(i => this.normalizeItemImages(i));
        if (category && category.trim() !== '' && category.toLowerCase() !== 'all') {
          return normalized.filter(loc => loc.category && loc.category.toLowerCase() === category.toLowerCase());
        }
        return normalized;
      }),
      catchError(err => {
        console.error(`Error al obtener Cayo Perico:`, err);
        return of([]);
      })
    );
  }
}
