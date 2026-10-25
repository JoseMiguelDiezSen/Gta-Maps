import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, map, forkJoin } from 'rxjs';
import { GtaMission, GtaStrangerMission, GtaHeist } from '../../models/gta5/mission';
import { GtaMystery } from '../../models/gta5/mystery';
import { TranslationService } from '../../i18n';

@Injectable({ providedIn: 'root' })
export class MissionService {


    private readonly http = inject(HttpClient);
    private readonly translationService = inject(TranslationService);


  /**
   * Carga la lista base canÃ³nica y superpone traducciones idiomÃ¡ticas disponibles.
   * Evita que misiones, atracos o misterios desaparezcan o queden desalineados.
   */
  private getCandidatePaths(path: string): string[] {
    const withoutSlash = path.startsWith('/') ? path.substring(1) : path;
    const withSlash = '/' + withoutSlash;
    const dataWithoutSlash = withoutSlash.replace(/^assets\/data\//, 'data/');
    const dataWithSlash = '/' + dataWithoutSlash;

    const alternates: string[] = [];
    if (withoutSlash.includes('/mapa/marcadores-mapa/')) {
      const alt = withoutSlash.replace('/mapa/marcadores-mapa/', '/marcadores-mapa/');
      alternates.push(alt, '/' + alt, alt.replace(/^assets\/data\//, 'data/'), '/' + alt.replace(/^assets\/data\//, 'data/'));
    } else if (withoutSlash.includes('/marcadores-mapa/')) {
      const alt = withoutSlash.replace('/marcadores-mapa/', '/mapa/marcadores-mapa/');
      alternates.push(alt, '/' + alt, alt.replace(/^assets\/data\//, 'data/'), '/' + alt.replace(/^assets\/data\//, 'data/'));
    }

    return Array.from(new Set([path, withSlash, withoutSlash, dataWithSlash, dataWithoutSlash, ...alternates]));
  }

  private fetchWithFallback<T>(paths: string[]): Observable<T[]> {
    const tryNext = (idx: number): Observable<T[]> => {
      if (idx >= paths.length) {
        return of([] as T[]);
      }
      return this.http.get<T[]>(paths[idx]).pipe(
        catchError(() => tryNext(idx + 1))
      );
    };
    return tryNext(0);
  }

  /**
   * Carga la lista base canónica y superpone traducciones idiomáticas disponibles.
   * Evita que misiones, atracos o misterios desaparezcan o queden desalineados.
   */
  private loadWithFallback<T extends { id: string }>(basePath: string, localizedPath: string, activeLang: string): Observable<T[]> {
    const baseCandidates = this.getCandidatePaths(basePath);

    if (activeLang === 'es') {
      return this.fetchWithFallback<T>(baseCandidates);
    }

    const locCandidates = this.getCandidatePaths(localizedPath);

    return forkJoin({
      base: this.fetchWithFallback<T>(baseCandidates),
      localized: this.fetchWithFallback<Partial<T>>(locCandidates)
    }).pipe(
      map(({ base, localized }) => {
        if (!base || base.length === 0) return (localized as T[]) || [];
        if (!localized || localized.length === 0) return base;

        const locMap = new Map<string, Partial<T>>();
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
        console.error(`Error cargando datos:`, err);
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
      '/assets/data/gta5/mapa/marcadores-mapa/offline/idiomas/es/mapa-misiones-historia.json',
      `/assets/data/gta5/mapa/marcadores-mapa/offline/idiomas/${activeLang}/mapa-misiones-historia.json`,
      activeLang
    );
  }

  /**
   * Obtiene la lista de misiones secundarias de Extraños y Locos.
   */
  getStoryStrangers(lang?: string): Observable<GtaStrangerMission[]> {
    const activeLang = lang || this.translationService.currentLanguage() || 'es';
    return this.loadWithFallback<GtaStrangerMission>(
      '/assets/data/gta5/mapa/marcadores-mapa/offline/idiomas/es/strangers_and_freaks.json',
      `/assets/data/gta5/mapa/marcadores-mapa/offline/idiomas/${activeLang}/strangers_and_freaks.json`,
      activeLang
    );
  }

  /**
   * Obtiene la lista oficial de Misiones de Contacto de GTA Online.
   */
  getOnlineMissions(lang?: string): Observable<GtaMission[]> {
    const activeLang = lang || this.translationService.currentLanguage() || 'es';
    return this.loadWithFallback<GtaMission>(
      '/assets/data/gta5/mapa/marcadores-mapa/online/idiomas/es/mapa-misiones-online.json',
      `/assets/data/gta5/mapa/marcadores-mapa/online/idiomas/${activeLang}/mapa-misiones-online.json`,
      activeLang
    );
  }

  /**
   * Obtiene la lista oficial de Golpes (Heists) de GTA Online.
   */
  getOnlineHeists(lang?: string): Observable<GtaHeist[]> {
    const activeLang = lang || this.translationService.currentLanguage() || 'es';
    return this.loadWithFallback<GtaHeist>(
      '/assets/data/gta5/mapa/marcadores-mapa/online/idiomas/es/heists.json',
      `/assets/data/gta5/mapa/marcadores-mapa/online/idiomas/${activeLang}/heists.json`,
      activeLang
    );
  }

  /**
   * Obtiene el catálogo oficial de Misterios y Leyendas Urbanas de GTA Online.
   */
  getOnlineMysteries(lang?: string): Observable<GtaMystery[]> {
    const activeLang = lang || this.translationService.currentLanguage() || 'es';
    return this.loadWithFallback<GtaMystery>(
      '/assets/data/gta5/mapa/marcadores-mapa/online/idiomas/es/misterios-mapa-online.json',
      `/assets/data/gta5/mapa/marcadores-mapa/online/idiomas/${activeLang}/misterios-mapa-online.json`,
      activeLang
    );
  }

  /**
   * Obtiene el catálogo de Misterios y Easter Eggs de GTA V Modo Historia.
   */
  getStoryMysteries(lang?: string): Observable<GtaMystery[]> {
    const activeLang = lang || this.translationService.currentLanguage() || 'es';
    return this.loadWithFallback<GtaMystery>(
      '/assets/data/gta5/mapa/marcadores-mapa/offline/idiomas/es/misterios-mapa-offline.json',
      `/assets/data/gta5/mapa/marcadores-mapa/offline/idiomas/${activeLang}/misterios-mapa-offline.json`,
      activeLang
    );
  }
}

