import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
import { VideoItem } from '../../models/gta6';

@Injectable({
  providedIn: 'root'
})
export class VideosGta6Service {
  private readonly http = inject(HttpClient);
  private readonly offlineUrl = 'assets/data/gta6/videos-offline.json';
  private readonly onlineUrl = 'assets/data/gta6/videos-online.json';
  private cache$?: Observable<VideoItem[]>;

  /**
   * Obtiene la lista completa de vídeos de GTA 6 combinando los datasets modulares.
   */
  getVideos(): Observable<VideoItem[]> {
    if (!this.cache$) {
      this.cache$ = forkJoin({
        offline: this.http.get<VideoItem[]>(this.offlineUrl).pipe(catchError(() => of([]))),
        online: this.http.get<VideoItem[]>(this.onlineUrl).pipe(catchError(() => of([])))
      }).pipe(
        map(({ offline, online }) => [...offline, ...online]),
        catchError(error => {
          console.error('[VideosGta6Service] Error cargando vídeos modulares:', error);
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
