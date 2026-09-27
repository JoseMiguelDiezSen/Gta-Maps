import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, forkJoin, map } from 'rxjs';
import { PropertyLocation } from '../models/property';
import { CollectibleItem } from '../models/collectible';
import { GtaVehicle } from '../models/vehicle';

@Injectable({ providedIn: 'root' })
export class LocationService {

  constructor(private http: HttpClient) {}

  /**
   * Obtiene la lista completa de ubicaciones del mapa.
   * Si la API de ASP.NET no responde, carga y unifica en paralelo todas las categorías modulares en assets.
   */
  getProperties(gameMode?: string, category?: string): Observable<PropertyLocation[]> {
    let url = '/api/locations/properties';
    const params: string[] = [];
    if (gameMode) params.push(`gameMode=${encodeURIComponent(gameMode)}`);
    if (category) params.push(`category=${encodeURIComponent(category)}`);
    if (params.length > 0) url += `?${params.join('&')}`;

    return this.http.get<PropertyLocation[]>(url).pipe(
      catchError(err => {
        console.warn('Fallo al obtener propiedades desde /api, usando fallback modular:', err);
        return this.getAllLocations();
      })
    );
  }

  /**
   * Agregador unificado de todas las categorías modulares de GTA 5.
   * Carga en paralelo cada JSON específico y los combina para el renderizado del mapa.
   */
  getAllLocations(): Observable<PropertyLocation[]> {
    return forkJoin({
      properties: this.getPropertiesOnly().pipe(catchError(() => of([]))),
      businesses: this.getBusinesses().pipe(catchError(() => of([]))),
      services: this.getServices().pipe(catchError(() => of([]))),
      vehicleShops: this.getVehicleShops().pipe(catchError(() => of([]))),
      roleplayJobs: this.getRoleplayJobs().pipe(catchError(() => of([]))),
      characters: this.getCharacters().pipe(catchError(() => of([]))),
      fauna: this.getFauna().pipe(catchError(() => of([]))),
      activities: this.getActivities().pipe(catchError(() => of([]))),
      strangePlaces: this.getStrangePlaces().pipe(catchError(() => of([])))
    }).pipe(
      map(res => [
        ...res.properties,
        ...res.businesses,
        ...res.services,
        ...res.vehicleShops,
        ...res.roleplayJobs,
        ...res.characters,
        ...res.fauna,
        ...res.activities,
        ...res.strangePlaces
      ])
    );
  }

  /** 1. PROPIEDADES (Mansiones, Búnkeres, Hangares, Oficinas CEO, Agencias...) */
  getPropertiesOnly(): Observable<PropertyLocation[]> {
    return this.http.get<PropertyLocation[]>('assets/data/properties.json');
  }

  /** 2. NEGOCIOS (Laboratorios de cocaína, meta, hierba, dinero falso, clubes nocturnos...) */
  getBusinesses(): Observable<PropertyLocation[]> {
    return this.http.get<PropertyLocation[]>('assets/data/businesses.json');
  }

  /** 3. SERVICIOS (Comisarías, hospitales, bomberos, Ammu-Nation, 24/7, autolavados...) */
  getServices(): Observable<PropertyLocation[]> {
    return this.http.get<PropertyLocation[]>('assets/data/services.json');
  }

  /** 4. VEHÍCULOS / TALLERES (LS Customs, Benny's, Garaje Hao, Car Meet...) */
  getVehicleShops(): Observable<PropertyLocation[]> {
    return this.http.get<PropertyLocation[]>('assets/data/vehicle_shops.json');
  }

  /** 5. TRABAJOS ROLEPLAY (Los 7 puestos activos de rol) */
  getRoleplayJobs(): Observable<PropertyLocation[]> {
    return this.http.get<PropertyLocation[]>('assets/data/roleplay_jobs.json');
  }

  /** 6. PERSONAJES Y CONTACTOS (Lester, Franklin, Trevor, Lamar, Agatha Baker...) */
  getCharacters(): Observable<PropertyLocation[]> {
    return this.http.get<PropertyLocation[]>('assets/data/characters.json');
  }

  /** 7. FAUNA Y VIDA SALVAJE (12 Hábitats de fauna y fotografía animal) */
  getFauna(): Observable<PropertyLocation[]> {
    return this.http.get<PropertyLocation[]>('assets/data/fauna.json');
  }

  /** 8. ACTIVIDADES Y DEPORTES (Plantilla preparada) */
  getActivities(): Observable<PropertyLocation[]> {
    return this.http.get<PropertyLocation[]>('assets/data/activities.json');
  }

  /** 9. LUGARES EXTRAÑOS (OVNIs, naufragios, cuevas - Plantilla preparada) */
  getStrangePlaces(): Observable<PropertyLocation[]> {
    return this.http.get<PropertyLocation[]>('assets/data/strange_places.json');
  }

  /**
   * Obtiene la lista de coleccionables de GTA Online.
   * Si la API de ASP.NET no responde, usa como fallback el archivo estático en assets.
   */
  getCollectibles(category?: string): Observable<CollectibleItem[]> {
    let url = '/api/locations/collectibles';
    if (category) {
      url += `?category=${encodeURIComponent(category)}`;
    }

    return this.http.get<CollectibleItem[]>(url).pipe(
      catchError(err => {
        console.warn('Fallo al obtener coleccionables desde /api, usando fallback local:', err);
        return this.http.get<CollectibleItem[]>('assets/data/collectibles.json');
      })
    );
  }

  /**
   * Obtiene la base de datos completa de vehículos catalogados por concesionario.
   * Si la API de ASP.NET no responde, usa como fallback el archivo local assets/data/vehicles.json.
   */
  getVehicles(dealership?: string): Observable<GtaVehicle[]> {
    let url = '/api/locations/vehicles';
    if (dealership) {
      url += `?dealership=${encodeURIComponent(dealership)}`;
    }

    return this.http.get<GtaVehicle[]>(url).pipe(
      catchError(err => {
        return this.http.get<GtaVehicle[]>('assets/data/vehicles.json');
      })
    );
  }
}
