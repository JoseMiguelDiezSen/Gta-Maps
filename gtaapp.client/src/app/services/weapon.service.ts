import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
   * Obtiene el catálogo oficial de armas de GTA V / GTA Online leyendo directamente los assets locales en el idioma activo.
   */
  getWeapons(gameMode: 'story' | 'online' = 'online', category?: string, lang?: string): Observable<GtaWeapon[]> {
    const activeLang = lang || this.translationService.currentLanguage() || 'es';
    const mode = gameMode === 'story' ? 'historia' : 'online';

    return this.http.get<GtaWeapon[]>(`/assets/data/gta5/${mode}/${activeLang}/weapons.json`).pipe(
      map(weapons => {
        let filtered = weapons || [];
        if (category && category !== 'all') {
          filtered = filtered.filter(w => (w.category || '').toLowerCase() === category.toLowerCase());
        }
        return filtered;
      }),
      catchError(err => {
        console.error('Error al obtener armas desde assets locales:', err);
        return of([]);
      })
    );
  }
}
