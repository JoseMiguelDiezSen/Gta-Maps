import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GuiaManifest, GuiaSeccion, GuiaArticulo, GuiaArticuloResumen } from '../models/guia';

@Injectable({
  providedIn: 'root'
})
export class GuiaService {
  constructor(private http: HttpClient) {}

  /**
   * Obtiene el manifiesto completo con secciones y listado de artículos para GTA 5 o GTA 6.
   * @param juegoId 'gta5' o 'gta6'
   */
  getManifest(juegoId: 'gta5' | 'gta6'): Observable<GuiaManifest> {
    return this.http.get<GuiaManifest>(`/api/${juegoId}/guia/manifest`);
  }

  /**
   * Obtiene las secciones temáticas de la guía.
   */
  getSecciones(juegoId: 'gta5' | 'gta6'): Observable<GuiaSeccion[]> {
    return this.http.get<GuiaSeccion[]>(`/api/${juegoId}/guia/secciones`);
  }

  /**
   * Obtiene el contenido completo de un artículo por su ID o slug.
   */
  getArticulo(juegoId: 'gta5' | 'gta6', articuloId: string): Observable<GuiaArticulo> {
    return this.http.get<GuiaArticulo>(`/api/${juegoId}/guia/articulos/${encodeURIComponent(articuloId)}`);
  }

  /**
   * Busca artículos en la guía correspondiente.
   */
  buscarArticulos(juegoId: 'gta5' | 'gta6', query: string): Observable<GuiaArticuloResumen[]> {
    const params = new HttpParams().set('q', query);
    return this.http.get<GuiaArticuloResumen[]>(`/api/${juegoId}/guia/buscar`, { params });
  }
}
