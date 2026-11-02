import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { GtaEventCategory } from '../../models/gta5/event';
import { TranslationService } from '../../i18n';

@Injectable({ providedIn: 'root' })
export class EventService {
  private readonly http = inject(HttpClient);
  private readonly translationService = inject(TranslationService);

  /**
   * Obtiene la lista jerárquica de Eventos Estacionales de GTA Online (Halloween, Navidad, etc.)
   */
  getOnlineEvents(lang?: string): Observable<GtaEventCategory[]> {
    const activeLang = lang || this.translationService.currentLanguage() || 'es';
    const primaryPath = `/assets/data/gta5/mapa/marcadores-mapa/online/idiomas/${activeLang}/eventos.json`;
    const fallbackPath = `/assets/data/gta5/mapa/marcadores-mapa/online/idiomas/es/eventos.json`;

    return this.http.get<GtaEventCategory[]>(primaryPath).pipe(
      catchError(() => this.http.get<GtaEventCategory[]>(fallbackPath)),
      catchError(err => {
        console.error('Error cargando eventos de GTA Online:', err);
        return of([] as GtaEventCategory[]);
      })
    );
  }
}
