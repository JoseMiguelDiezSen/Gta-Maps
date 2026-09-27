import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { LocationItem } from '../models/location';
import { CollectibleItem } from '../models/collectible';

@Injectable({ providedIn: 'root' })
export class LocationService {

  constructor(private http: HttpClient) {}

  /**
   * Obtiene la lista completa de ubicaciones del mapa desde /api/locations.
   */
  getProperties(gameMode?: string, category?: string): Observable<LocationItem[]> {
    let params = new HttpParams();
    if (gameMode) params = params.set('gameMode', gameMode);
    if (category) params = params.set('category', category);

    return this.http.get<LocationItem[]>('/api/locations', { params }).pipe(
      catchError(err => {
        console.error('Error al obtener ubicaciones desde /api/locations:', err);
        return of([]);
      })
    );
  }

  /**
   * Obtiene la lista de coleccionables de GTA Online desde /api/locations/collectibles.
   */
  getCollectibles(category?: string): Observable<CollectibleItem[]> {
    let params = new HttpParams();
    if (category) params = params.set('category', category);

    return this.http.get<CollectibleItem[]>('/api/locations/collectibles', { params }).pipe(
      catchError(err => {
        console.error('Error al obtener coleccionables desde /api/locations/collectibles:', err);
        return of([]);
      })
    );
  }
}
