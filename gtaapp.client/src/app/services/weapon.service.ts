import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, of, map } from 'rxjs';
import { GtaWeapon } from '../models/weapon';
import { TranslationService } from '../i18n';

@Injectable({ providedIn: 'root' })
export class WeaponService {

  constructor(
    private http: HttpClient,
    private translationService: TranslationService
  ) {}

  /**
   * Obtiene el catálogo oficial de armas de GTA V / GTA Online.
   * Con soporte para filtrado por categoría y fallback a los ficheros locales en assets/data.
   */
  getWeapons(gameMode: 'story' | 'online' = 'online', category?: string, lang?: string): Observable<GtaWeapon[]> {
    let params = new HttpParams();
    if (category) params = params.set('category', category);

    const activeLang = lang || this.translationService.currentLanguage() || 'es';
    if (activeLang) params = params.set('lang', activeLang);

    const apiPath = gameMode === 'story' ? '/api/gta5/historia/weapons' : '/api/gta5/online/weapons';
    const fallbackMode = gameMode === 'story' ? 'historia' : 'online';

    return this.http.get<GtaWeapon[]>(apiPath, { params }).pipe(
      catchError(() => {
        return this.http.get<GtaWeapon[]>(`/assets/data/gta5/${fallbackMode}/${activeLang}/weapons.json`).pipe(
          map(weapons => {
            let filtered = weapons || [];
            if (category && category !== 'all') {
              filtered = filtered.filter(w => (w.category || '').toLowerCase() === category.toLowerCase());
            }
            return filtered;
          }),
          catchError(err => {
            console.error('Error al obtener armas desde fallback local:', err);
            return of([]);
          })
        );
      })
    );
  }
}
