import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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
   * Obtiene la lista de misiones de GTA V Modo Historia desde /api/gta5/historia/missions.
   */
  getStoryMissions(lang?: string): Observable<GtaMission[]> {
    let params = new HttpParams();
    const activeLang = lang || this.translationService.currentLanguage();
    if (activeLang) params = params.set('lang', activeLang);

    return this.http.get<GtaMission[]>('/api/gta5/historia/missions', { params }).pipe(
      catchError(() => {
        return this.http.get<GtaMission[]>(`/assets/data/gta5/historia/${activeLang}/missions.json`).pipe(
          catchError(() => of([]))
        );
      })
    );
  }

  /**
   * Obtiene la lista de misiones secundarias de Extraños y Locos desde /api/gta5/historia/strangers.
   */
  getStoryStrangers(lang?: string): Observable<GtaStrangerMission[]> {
    let params = new HttpParams();
    const activeLang = lang || this.translationService.currentLanguage();
    if (activeLang) params = params.set('lang', activeLang);

    return this.http.get<GtaStrangerMission[]>('/api/gta5/historia/strangers', { params }).pipe(
      catchError(() => {
        return this.http.get<GtaStrangerMission[]>(`/assets/data/gta5/historia/${activeLang}/strangers_and_freaks.json`).pipe(
          catchError(() => of([]))
        );
      })
    );
  }

  /**
   * Obtiene la lista oficial de Misiones de Contacto y Operaciones de GTA Online desde /api/gta5/online/missions
   * con fallback a los ficheros locales en assets/data/gta5/online/{lang}/missions.json.
   */
  getOnlineMissions(lang?: string): Observable<GtaMission[]> {
    let params = new HttpParams();
    const activeLang = lang || this.translationService.currentLanguage();
    if (activeLang) params = params.set('lang', activeLang);

    return this.http.get<GtaMission[]>('/api/gta5/online/missions', { params }).pipe(
      catchError(() => {
        return this.http.get<GtaMission[]>(`/assets/data/gta5/online/${activeLang}/missions.json`).pipe(
          catchError(() => of([]))
        );
      })
    );
  }

  /**
   * Obtiene la lista oficial de Golpes (Heists) de GTA Online desde /api/gta5/online/heists
   * con fallback a los ficheros locales en assets/data/gta5/online/{lang}/heists.json.
   */
  getOnlineHeists(lang?: string): Observable<GtaHeist[]> {
    let params = new HttpParams();
    const activeLang = lang || this.translationService.currentLanguage();
    if (activeLang) params = params.set('lang', activeLang);

    return this.http.get<GtaHeist[]>('/api/gta5/online/heists', { params }).pipe(
      catchError(() => {
        return this.http.get<GtaHeist[]>(`/assets/data/gta5/online/${activeLang}/heists.json`).pipe(
          catchError(() => of([]))
        );
      })
    );
  }

  /**
   * Obtiene el catálogo oficial de Misterios y Leyendas Urbanas de GTA Online
   * con fallback a los ficheros locales en assets/data/gta5/online/{lang}/mysteries.json.
   */
  getOnlineMysteries(lang?: string): Observable<GtaMystery[]> {
    let params = new HttpParams();
    const activeLang = lang || this.translationService.currentLanguage();
    if (activeLang) params = params.set('lang', activeLang);

    return this.http.get<GtaMystery[]>('/api/gta5/online/mysteries', { params }).pipe(
      catchError(() => {
        return this.http.get<GtaMystery[]>(`/assets/data/gta5/online/${activeLang}/mysteries.json`).pipe(
          catchError(() => of([]))
        );
      })
    );
  }

  /**
   * Obtiene el catálogo de Misterios y Easter Eggs de GTA V Modo Historia
   * con fallback a los ficheros locales en assets/data/gta5/historia/{lang}/mysteries.json.
   */
  getStoryMysteries(lang?: string): Observable<GtaMystery[]> {
    let params = new HttpParams();
    const activeLang = lang || this.translationService.currentLanguage();
    if (activeLang) params = params.set('lang', activeLang);

    return this.http.get<GtaMystery[]>('/api/gta5/historia/mysteries', { params }).pipe(
      catchError(() => {
        return this.http.get<GtaMystery[]>(`/assets/data/gta5/historia/${activeLang}/mysteries.json`).pipe(
          catchError(() => of([]))
        );
      })
    );
  }
}
