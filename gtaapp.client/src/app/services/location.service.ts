import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
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
   * Obtiene la lista completa de ubicaciones del mapa desde /api/locations.
   */
  getProperties(gameMode?: string, category?: string, lang?: string): Observable<LocationItem[]> {
    let params = new HttpParams();
    if (gameMode) params = params.set('gameMode', gameMode);
    if (category) params = params.set('category', category);
    
    const activeLang = lang || this.translationService.currentLanguage();
    if (activeLang) params = params.set('lang', activeLang);

    return this.http.get<LocationItem[]>('/api/locations', { params }).pipe(
      catchError(err => {
        console.error('Error al obtener ubicaciones desde /api/locations:', err);
        return of([]);
      })
    );
  }

  /**
   * Obtiene la lista de coleccionables de GTA Online o Historia desde /api/locations/collectibles.
   */
  getCollectibles(category?: string, lang?: string, gameMode?: string): Observable<CollectibleItem[]> {
    let params = new HttpParams();
    if (category) params = params.set('category', category);

    const activeLang = lang || this.translationService.currentLanguage();
    if (activeLang) params = params.set('lang', activeLang);

    const url = gameMode === 'story' ? '/api/gta5/historia/collectibles' : '/api/locations/collectibles';
    if (gameMode && gameMode !== 'story') params = params.set('gameMode', gameMode);

    return this.http.get<CollectibleItem[]>(url, { params }).pipe(
      catchError(err => {
        console.error('Error al obtener coleccionables desde ' + url + ':', err);
        return of([]);
      })
    );
  }

  /**
   * Obtiene la lista completa de ubicaciones, vehículos, armas y coleccionables de Cayo Perico.
   */
  getCayoPericoLocations(category?: string, lang?: string): Observable<LocationItem[]> {
    let params = new HttpParams();
    if (category) params = params.set('category', category);

    const activeLang = lang || this.translationService.currentLanguage() || 'es';
    params = params.set('lang', activeLang);

    return this.http.get<LocationItem[]>('/api/locations/cayo-perico', { params }).pipe(
      catchError(() => {
        // Fallback a archivos JSON locales
        return this.http.get<LocationItem[]>(`assets/data/gta5/online/${activeLang}/cayo_perico.json`).pipe(
          catchError(() => this.http.get<LocationItem[]>('assets/data/gta5/online/es/cayo_perico.json')),
          catchError(err => {
            console.error('Error al obtener Cayo Perico:', err);
            return of([]);
          })
        );
      })
    );
  }
}
