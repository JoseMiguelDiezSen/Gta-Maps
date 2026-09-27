import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { GtaVehicle } from '../models/vehicle';

@Injectable({ providedIn: 'root' })
export class VehicleService {
  constructor(private http: HttpClient) {}

  /**
   * Obtiene el catálogo completo de vehículos o filtrado por concesionario y categoría.
   * Si la API /api/vehicles no responde, utiliza fallback local a assets/data/vehicles.json.
   */
  getVehicles(dealership?: string, category?: string): Observable<GtaVehicle[]> {
    let url = '/api/vehicles';
    const params: string[] = [];
    if (dealership) params.push(`dealership=${encodeURIComponent(dealership)}`);
    if (category) params.push(`category=${encodeURIComponent(category)}`);
    if (params.length > 0) url += `?${params.join('&')}`;

    return this.http.get<GtaVehicle[]>(url).pipe(
      catchError(err => {
        console.warn('Fallo al obtener vehículos desde /api/vehicles, usando fallback local:', err);
        return this.http.get<GtaVehicle[]>('assets/data/vehicles.json').pipe(
          catchError(() => of([]))
        );
      })
    );
  }
}
