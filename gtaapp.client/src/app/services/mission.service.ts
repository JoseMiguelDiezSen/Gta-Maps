import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { GtaMission } from '../models/mission';
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
      catchError(err => {
        console.error('Error al obtener misiones desde /api/gta5/historia/missions:', err);
        return of([]);
      })
    );
  }
}
