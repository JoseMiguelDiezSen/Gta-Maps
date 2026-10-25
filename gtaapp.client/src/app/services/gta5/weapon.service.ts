import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, map, forkJoin } from 'rxjs';
import { GtaWeapon } from '../../models/gta5/weapon';
import { TranslationService } from '../../i18n';

@Injectable({ providedIn: 'root' })
export class WeaponService {

  constructor(
    private http: HttpClient,
    private translationService: TranslationService
  ) {}

  private normalizeWeaponImage(weapon: GtaWeapon): GtaWeapon {
    return weapon;
  }

  /**
   * Obtiene el catálogo oficial de armas de GTA V / GTA Online.
   * La base canónica técnica (precios, daño, categoría, imagen) procede de 'es',
   * superponiendo nombres y descripciones traducidas cuando el idioma activo es otro.
   */
  getWeapons(gameMode: 'story' | 'online' = 'online', category?: string, lang?: string): Observable<GtaWeapon[]> {
    const activeLang = lang || this.translationService.currentLanguage() || 'es';
    const mode = gameMode === 'story' ? 'offline' : 'online';

    const primaryBasePath = `/assets/data/gta5/mapa/marcadores-mapa/${mode}/idiomas/es/weapons.json`;
    const primaryLocalizedPath = `/assets/data/gta5/mapa/marcadores-mapa/${mode}/idiomas/${activeLang}/weapons.json`;

    const fetchBase$ = this.http.get<GtaWeapon[]>(primaryBasePath).pipe(
      catchError(() => of([] as GtaWeapon[]))
    );

    const fetchLocalized$ = this.http.get<any[]>(primaryLocalizedPath).pipe(
      catchError(() => of([] as any[]))
    );

    const fetch$: Observable<GtaWeapon[]> = activeLang === 'es'
      ? fetchBase$
      : forkJoin({
          base: fetchBase$,
          localized: fetchLocalized$
        }).pipe(
          map(({ base, localized }) => {
            if (!base || base.length === 0) return (localized as GtaWeapon[]) || [];
            if (!localized || localized.length === 0) return base;

            const locMap = new Map<string, any>();
            localized.forEach(w => {
              if (w && w.id) locMap.set(w.id, w);
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
      map(weapons => {
        let filtered = (weapons || []).map(w => this.normalizeWeaponImage(w));
        if (category && category !== 'all') {
          filtered = filtered.filter(w => (w.category || '').toLowerCase() === category.toLowerCase());
        }
        return filtered;
      }),
      catchError(err => {
        console.error('Error al obtener armas:', err);
        return of([]);
      })
    );
  }
}
