import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, map, forkJoin } from 'rxjs';
import { GtaMission, GtaStrangerMission, GtaHeist } from '../../models/gta5/mission';
import { GtaMystery } from '../../models/gta5/mystery';
import { TranslationService } from '../../i18n';

@Injectable({ providedIn: 'root' })
export class MissionService {

  constructor(
    private http: HttpClient,
    private translationService: TranslationService
  ) {}

  /**
   * Carga la lista base canÃ³nica y superpone traducciones idiomÃ¡ticas disponibles.
   * Evita que misiones, atracos o misterios desaparezcan o queden desalineados.
   */
  private loadWithFallback<T extends { id: string }>(basePath: string, localizedPath: string, activeLang: string): Observable<T[]> {
    if (activeLang === 'es') {
      return this.http.get<T[]>(basePath).pipe(
        catchError(err => {
          console.error(`Error cargando base ${basePath}:`, err);
          return of([] as T[]);
        })
      );
    }

    return forkJoin({
      base: this.http.get<T[]>(basePath).pipe(catchError(() => of([] as T[]))),
      localized: this.http.get<any[]>(localizedPath).pipe(catchError(() => of([] as any[])))
    }).pipe(
      map(({ base, localized }) => {
        if (!base || base.length === 0) return (localized as T[]) || [];
        if (!localized || localized.length === 0) return base;

        const locMap = new Map<string, any>();
        localized.forEach(item => {
          if (item && item.id) locMap.set(item.id, item);
        });

        return base.map(b => {
          const trans = locMap.get(b.id);
          if (!trans) return b;
          return {
            ...b,
            ...trans,
            id: b.id
          };
        });
      }),
      catchError(err => {
        console.error(`Error cargando ${localizedPath}:`, err);
        return of([]);
      })
    );
  }

  /**
   * Obtiene la lista de misiones de GTA V Modo Historia.
   */
  getStoryMissions(lang?: string): Observable<GtaMission[]> {
    const activeLang = lang || this.translationService.currentLanguage() || 'es';
    return this.loadWithFallback<GtaMission>(
      '/assets/data/gta5/historia/es/mapa-misiones-historia.json',
      `/assets/data/gta5/historia/${activeLang}/mapa-misiones-historia.json`,
      activeLang
    );
  }

  /**
   * Obtiene la lista de misiones secundarias de ExtraÃ±os y Locos.
   */
  getStoryStrangers(lang?: string): Observable<GtaStrangerMission[]> {
    const activeLang = lang || this.translationService.currentLanguage() || 'es';
    return this.loadWithFallback<GtaStrangerMission>(
      '/assets/data/gta5/historia/es/strangers_and_freaks.json',
      `/assets/data/gta5/historia/${activeLang}/strangers_and_freaks.json`,
      activeLang
    );
  }

  /**
   * Obtiene la lista oficial de Misiones de Contacto de GTA Online.
   */
  getOnlineMissions(lang?: string): Observable<GtaMission[]> {
    const activeLang = lang || this.translationService.currentLanguage() || 'es';
    return this.loadWithFallback<GtaMission>(
      '/assets/data/gta5/online/es/mapa-misiones-online.json',
      `/assets/data/gta5/online/${activeLang}/mapa-misiones-online.json`,
      activeLang
    );
  }

  /**
   * Obtiene la lista oficial de Golpes (Heists) de GTA Online.
   */
  getOnlineHeists(lang?: string): Observable<GtaHeist[]> {
    const activeLang = lang || this.translationService.currentLanguage() || 'es';
    return this.loadWithFallback<GtaHeist>(
      '/assets/data/gta5/online/es/heists.json',
      `/assets/data/gta5/online/${activeLang}/heists.json`,
      activeLang
    );
  }

  /**
   * Obtiene el catÃ¡logo oficial de Misterios y Leyendas Urbanas de GTA Online.
   */
  getOnlineMysteries(lang?: string): Observable<GtaMystery[]> {
    const activeLang = lang || this.translationService.currentLanguage() || 'es';
    return this.loadWithFallback<GtaMystery>(
      '/assets/data/gta5/online/es/mysteries.json',
      `/assets/data/gta5/online/${activeLang}/mysteries.json`,
      activeLang
    );
  }

  /**
   * Obtiene el catÃ¡logo de Misterios y Easter Eggs de GTA V Modo Historia.
   */
  getStoryMysteries(lang?: string): Observable<GtaMystery[]> {
    const activeLang = lang || this.translationService.currentLanguage() || 'es';
    return this.loadWithFallback<GtaMystery>(
      '/assets/data/gta5/historia/es/mysteries.json',
      `/assets/data/gta5/historia/${activeLang}/mysteries.json`,
      activeLang
    );
  }
}

