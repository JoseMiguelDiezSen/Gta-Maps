import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
import { VideoItem } from '../../models/gta6';

@Injectable({
  providedIn: 'root'
})
export class VideosGta6Service {
  private readonly dataUrl = 'assets/data/gta6/videos.json';
  private cache$?: Observable<VideoItem[]>;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene la lista completa de vídeos de GTA 6 desde el archivo JSON estructurado.
   */
  getVideos(): Observable<VideoItem[]> {
    if (!this.cache$) {
      this.cache$ = this.http.get<VideoItem[]>(this.dataUrl).pipe(
        catchError(error => {
          console.error('[VideosGta6Service] Error cargando vídeos:', error);
          return of([]);
        }),
        shareReplay(1)
      );
    }
    return this.cache$;
  }

  /**
   * Obtiene un vídeo específico por su identificador único.
   */
  getVideoById(id: string): Observable<VideoItem | undefined> {
    return this.getVideos().pipe(
      map(videos => videos.find(v => v.id === id))
    );
  }

  /**
   * Obtiene un vídeo específico por su slug amigable.
   */
  getVideoPorSlug(slug: string): Observable<VideoItem | undefined> {
    return this.getVideos().pipe(
      map(videos => videos.find(v => v.slug === slug))
    );
  }

  /**
   * Limpia la caché en memoria para forzar recarga si fuera necesario.
   */
  limpiarCache(): void {
    this.cache$ = undefined;
  }
}
