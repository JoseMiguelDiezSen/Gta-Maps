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

  /**
   * Obtiene el catálogo oficial de armas de GTA V / GTA Online.
   * La base canónica técnica (precios, daño, categoría, imagen) procede de 'es',
   * superponiendo nombres y descripciones traducidas cuando el idioma activo es otro.
   */
  getWeapons(gameMode: 'story' | 'online' = 'online', category?: string, lang?: string): Observable<GtaWeapon[]> {
    const activeLang = lang || this.translationService.currentLanguage() || 'es';
    const mode = gameMode === 'story' ? 'historia' : 'online';
    const basePath = `/assets/data/gta5/${mode}/es/weapons.json`;

    const fetch$: Observable<GtaWeapon[]> = activeLang === 'es'
      ? this.http.get<GtaWeapon[]>(basePath).pipe(catchError(() => of([] as GtaWeapon[])))
      : forkJoin({
          base: this.http.get<GtaWeapon[]>(basePath).pipe(catchError(() => of([] as GtaWeapon[]))),
          localized: this.http.get<any[]>(`/assets/data/gta5/${mode}/${activeLang}/weapons.json`).pipe(catchError(() => of([] as any[])))
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
        let filtered = weapons || [];
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
