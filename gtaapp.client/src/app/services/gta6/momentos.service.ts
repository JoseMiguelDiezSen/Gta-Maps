import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
import { MomentoItem } from '../../models/gta6';

@Injectable({
  providedIn: 'root'
})
export class MomentosGta6Service {
  private readonly dataUrl = 'assets/data/gta6/momentos.json';
  private cache$?: Observable<MomentoItem[]>;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene la lista completa de momentos audiovisuales de GTA 6 desde el archivo JSON estructurado.
   */
  getMomentos(): Observable<MomentoItem[]> {
    if (!this.cache$) {
      this.cache$ = this.http.get<MomentoItem[]>(this.dataUrl).pipe(
        catchError(error => {
          console.error('[MomentosGta6Service] Error cargando momentos:', error);
          return of([]);
        }),
        shareReplay(1)
      );
    }
    return this.cache$;
  }

  /**
   * Obtiene un momento específico por su identificador único.
   */
  getMomentoById(id: string): Observable<MomentoItem | undefined> {
    return this.getMomentos().pipe(
      map(momentos => momentos.find(m => m.id === id))
    );
  }

  /**
   * Obtiene un momento específico por su slug amigable.
   */
  getMomentoPorSlug(slug: string): Observable<MomentoItem | undefined> {
    return this.getMomentos().pipe(
      map(momentos => momentos.find(m => m.slug === slug))
    );
  }

  /**
   * Limpia la caché en memoria para forzar recarga si fuera necesario.
   */
  limpiarCache(): void {
    this.cache$ = undefined;
  }
}
