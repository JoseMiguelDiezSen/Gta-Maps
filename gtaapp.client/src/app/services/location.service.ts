import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';
import { LocationItem } from '../models/location';
import { CollectibleItem } from '../models/collectible';
import { TranslationService } from '../i18n';

@Injectable({ providedIn: 'root' })
export class LocationService {

  constructor(
    private http: HttpClient,
    private translationService: TranslationService
  ) {}

  /**
   * Obtiene la lista completa de ubicaciones del mapa directamente desde los JSON locales localizados.
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
      const path = `assets/data/gta5/${modeFolder}/${activeLang}/${fileName}`;
      return this.http.get<LocationItem[]>(path).pipe(
        catchError(() => {
          // Fallback a español si falla el idioma específico
          return this.http.get<LocationItem[]>(`assets/data/gta5/${modeFolder}/es/${fileName}`).pipe(
            catchError(err => {
              console.warn(`No se pudo cargar ${fileName} para ${modeFolder}/${activeLang}:`, err);
              return of([] as LocationItem[]);
            })
          );
        })
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
   * Obtiene la lista de coleccionables de GTA Online o Historia directamente desde los JSON locales.
   */
  getCollectibles(category?: string, lang?: string, gameMode?: string): Observable<CollectibleItem[]> {
    const activeLang = lang || this.translationService.currentLanguage() || 'es';
    const isStory = gameMode === 'story' || gameMode === 'historia';
    const modeFolder = isStory ? 'historia' : 'online';

    const path = `assets/data/gta5/${modeFolder}/${activeLang}/collectibles.json`;
    return this.http.get<CollectibleItem[]>(path).pipe(
      catchError(() => this.http.get<CollectibleItem[]>(`assets/data/gta5/${modeFolder}/es/collectibles.json`)),
      map(items => {
        if (!Array.isArray(items)) return [];
        if (category && category.trim() !== '' && category.toLowerCase() !== 'all') {
          return items.filter(c => c.category && c.category.toLowerCase() === category.toLowerCase());
        }
        return items;
      }),
      catchError(err => {
        console.error(`Error al obtener coleccionables desde ${path}:`, err);
        return of([]);
      })
    );
  }

  /**
   * Obtiene la lista completa de ubicaciones, vehículos, armas y coleccionables de Cayo Perico directamente desde el JSON local.
   */
  getCayoPericoLocations(category?: string, lang?: string): Observable<LocationItem[]> {
    const activeLang = lang || this.translationService.currentLanguage() || 'es';
    const path = `assets/data/gta5/online/${activeLang}/cayo_perico.json`;

    return this.http.get<LocationItem[]>(path).pipe(
      catchError(() => this.http.get<LocationItem[]>('assets/data/gta5/online/es/cayo_perico.json')),
      map(items => {
        if (!Array.isArray(items)) return [];
        if (category && category.trim() !== '' && category.toLowerCase() !== 'all') {
          return items.filter(loc => loc.category && loc.category.toLowerCase() === category.toLowerCase());
        }
        return items;
      }),
      catchError(err => {
        console.error(`Error al obtener Cayo Perico desde ${path}:`, err);
        return of([]);
      })
    );
  }
}
