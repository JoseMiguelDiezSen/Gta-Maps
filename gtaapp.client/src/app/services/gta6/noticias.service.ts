import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
import { NoticiaItem } from '../../models/gta6';

@Injectable({
  providedIn: 'root'
})
export class NoticiasGta6Service {
  private readonly dataUrl = 'assets/data/gta6/noticias.json';
  private cache$?: Observable<NoticiaItem[]>;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene la lista completa de noticias de GTA 6 desde el archivo JSON estructurado.
   */
  getNoticias(): Observable<NoticiaItem[]> {
    if (!this.cache$) {
      this.cache$ = this.http.get<NoticiaItem[]>(this.dataUrl).pipe(
        catchError(error => {
          console.error('[NoticiasGta6Service] Error cargando noticias:', error);
          return of([]);
        }),
        shareReplay(1)
      );
    }
    return this.cache$;
  }

  /**
   * Obtiene una noticia específica por su identificador único.
   */
  getNoticiaById(id: string): Observable<NoticiaItem | undefined> {
    return this.getNoticias().pipe(
      map(noticias => noticias.find(n => n.id === id))
    );
  }

  /**
   * Obtiene una noticia específica por su slug amigable.
   */
  getNoticiaPorSlug(slug: string): Observable<NoticiaItem | undefined> {
    return this.getNoticias().pipe(
      map(noticias => noticias.find(n => n.slug === slug))
    );
  }

  /**
   * Limpia la caché en memoria para forzar recarga si fuera necesario.
   */
  limpiarCache(): void {
    this.cache$ = undefined;
  }
}
