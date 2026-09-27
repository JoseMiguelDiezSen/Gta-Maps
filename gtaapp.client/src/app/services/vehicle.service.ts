import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { GtaVehicle } from '../models/vehicle';

@Injectable({ providedIn: 'root' })
export class VehicleService {

  constructor(private http: HttpClient) {}

  /**
   * Obtiene el catálogo completo de vehículos o filtrado por concesionario y categoría desde /api/vehicles.
   */
  getVehicles(dealership?: string, category?: string): Observable<GtaVehicle[]> {
    let params = new HttpParams();
    if (dealership) params = params.set('dealership', dealership);
    if (category) params = params.set('category', category);

    return this.http.get<GtaVehicle[]>('/api/vehicles', { params }).pipe(
      catchError(err => {
        console.error('Error al obtener vehículos desde /api/vehicles:', err);
        return of([]);
      })
    );
  }
}
