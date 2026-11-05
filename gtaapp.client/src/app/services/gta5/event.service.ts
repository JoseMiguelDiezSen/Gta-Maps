import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { GtaEventCategory, GtaEventListsOverlay, setEventListsOverlay } from '../../models/gta5/event';
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

    this.loadEventListsOverlay(activeLang);

    return this.http.get<GtaEventCategory[]>(primaryPath).pipe(
      catchError(() => this.http.get<GtaEventCategory[]>(fallbackPath)),
      catchError(err => {
        console.error('Error cargando eventos de GTA Online:', err);
        return of([] as GtaEventCategory[]);
      })
    );
  }

  /**
   * Carga los textos de asesinos, fantasmas, pistas del Yeti y muñecos de nieve
   * en los idiomas que no tienen estas listas en `event.ts`.
   */
  private loadEventListsOverlay(lang: string): void {
    if (['es', 'en', 'pt'].includes(lang)) return;
    const path = `/assets/data/gta5/mapa/marcadores-mapa/online/idiomas/${lang}/eventos-listas.json`;
    this.http.get<GtaEventListsOverlay>(path).pipe(
      catchError(() => of(null))
    ).subscribe(data => {
      if (data) setEventListsOverlay(lang, data);
    });
  }
}
