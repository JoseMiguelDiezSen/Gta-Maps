import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { GtaMission, GtaStrangerMission, GtaHeist } from '../models/mission';
import { GtaMystery } from '../models/mystery';
import { TranslationService } from '../i18n';

@Injectable({ providedIn: 'root' })
export class MissionService {

  constructor(
    private http: HttpClient,
    private translationService: TranslationService
  ) {}

  /**
   * Obtiene la lista de misiones de GTA V Modo Historia leyendo directamente los assets locales en el idioma activo.
   */
  getStoryMissions(lang?: string): Observable<GtaMission[]> {
    const activeLang = lang || this.translationService.currentLanguage() || 'es';
    return this.http.get<GtaMission[]>(`/assets/data/gta5/historia/${activeLang}/missions.json`).pipe(
      catchError(err => {
        console.error('Error al obtener misiones de historia:', err);
        return of([]);
      })
    );
  }

  /**
   * Obtiene la lista de misiones secundarias de Extraños y Locos leyendo los assets locales en el idioma activo.
   */
  getStoryStrangers(lang?: string): Observable<GtaStrangerMission[]> {
    const activeLang = lang || this.translationService.currentLanguage() || 'es';
    return this.http.get<GtaStrangerMission[]>(`/assets/data/gta5/historia/${activeLang}/strangers_and_freaks.json`).pipe(
      catchError(err => {
        console.error('Error al obtener extraños y locos:', err);
        return of([]);
      })
    );
  }

  /**
   * Obtiene la lista oficial de Misiones de Contacto de GTA Online leyendo los assets locales en el idioma activo.
   */
  getOnlineMissions(lang?: string): Observable<GtaMission[]> {
    const activeLang = lang || this.translationService.currentLanguage() || 'es';
    return this.http.get<GtaMission[]>(`/assets/data/gta5/online/${activeLang}/missions.json`).pipe(
      catchError(err => {
        console.error('Error al obtener misiones online:', err);
        return of([]);
      })
    );
  }

  /**
   * Obtiene la lista oficial de Golpes (Heists) de GTA Online leyendo los assets locales en el idioma activo.
   */
  getOnlineHeists(lang?: string): Observable<GtaHeist[]> {
    const activeLang = lang || this.translationService.currentLanguage() || 'es';
    return this.http.get<GtaHeist[]>(`/assets/data/gta5/online/${activeLang}/heists.json`).pipe(
      catchError(err => {
        console.error('Error al obtener golpes online:', err);
        return of([]);
      })
    );
  }

  /**
   * Obtiene el catálogo oficial de Misterios y Leyendas Urbanas de GTA Online leyendo los assets locales en el idioma activo.
   */
  getOnlineMysteries(lang?: string): Observable<GtaMystery[]> {
    const activeLang = lang || this.translationService.currentLanguage() || 'es';
    return this.http.get<GtaMystery[]>(`/assets/data/gta5/online/${activeLang}/mysteries.json`).pipe(
      catchError(err => {
        console.error('Error al obtener misterios online:', err);
        return of([]);
      })
    );
  }

  /**
   * Obtiene el catálogo de Misterios y Easter Eggs de GTA V Modo Historia leyendo los assets locales en el idioma activo.
   */
  getStoryMysteries(lang?: string): Observable<GtaMystery[]> {
    const activeLang = lang || this.translationService.currentLanguage() || 'es';
    return this.http.get<GtaMystery[]>(`/assets/data/gta5/historia/${activeLang}/mysteries.json`).pipe(
      catchError(err => {
        console.error('Error al obtener misterios historia:', err);
        return of([]);
      })
    );
  }
}
