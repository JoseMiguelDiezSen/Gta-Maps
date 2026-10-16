import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { GuiaManifest, GuiaSeccion, GuiaArticulo, GuiaArticuloResumen, TrofeosCatalogo } from '../models/guia';

@Injectable({
  providedIn: 'root'
})
export class GuiaService {
  constructor(private http: HttpClient) {}

  /**
   * Obtiene el manifiesto completo con secciones y listado de artículos para GTA 5 o GTA 6.
   */
  getManifest(juegoId: 'gta5' | 'gta6'): Observable<GuiaManifest> {
    return of(this.getFallbackManifest(juegoId));
  }

  /**
   * Obtiene las secciones temáticas de la guía.
   */
  getSecciones(juegoId: 'gta5' | 'gta6'): Observable<GuiaSeccion[]> {
    if (juegoId === 'gta5') {
      return of(this.getFallbackManifest(juegoId).secciones);
    }
    return this.http.get<GuiaSeccion[]>(`/api/${juegoId}/guia/secciones`).pipe(
      catchError(() => of(this.getFallbackManifest(juegoId).secciones))
    );
  }

  /**
   * Obtiene el contenido completo de un artículo por su ID o slug.
   */
  getArticulo(juegoId: 'gta5' | 'gta6', articuloId: string): Observable<GuiaArticulo> {
    if (juegoId === 'gta5') {
      const manifest = this.getFallbackManifest('gta5');
      const sec = manifest.secciones.find(s => s.articulos.some(a => a.id === articuloId || a.slug === articuloId));
      const isPrologo = sec?.id === 'prologo' || ['prologo-introduccion-guia', 'michael-de-santa', 'franklin-clinton', 'trevor-philips', 'michael-trevor-franklin-intrahistoria', 'requisitos-100', 'golpes-principales', 'finales-opcion-abc', 'lista-trucos-gta5'].includes(articuloId);
      const isNegocios = sec?.id === 'negocios-economia' || ['asesinatos-lester-bolsa', 'guia-negocios-propiedades'].includes(articuloId);
      const isExtranos = articuloId.startsWith('eyl-') || sec?.id === 'extranos-locos';
      const isMisterio = sec?.id === 'secretos-misterios' || ['ghost_jolene', 'underwater_', 'tunnel_', 'mount_chiliad', 'thelma_', 'infinity_', 'nothing_here', 'fridgit_', 'yellow_jack', 'greyfriars_', 'ufos_', 'sasquatch_'].some(prefix => articuloId.startsWith(prefix)) || articuloId.includes('misterio') || articuloId.includes('chiliad') || articuloId.includes('cranley');
      const isEvento = articuloId.startsWith('evento-') || sec?.id === 'eventos-aleatorios';
      const jsonUrl = isPrologo
          ? 'assets/data/gta5/guia/offline/guia-offline-prologo.json?t=' + new Date().getTime()
          : isNegocios
          ? 'assets/data/gta5/guia/offline/negocios-economia.json?t=' + new Date().getTime()
          : isExtranos 
          ? 'assets/data/gta5/guia/offline/extranos-locos.json?t=' + new Date().getTime()
          : isMisterio
          ? 'assets/data/gta5/guia/offline/secretos-misterios.json?t=' + new Date().getTime()
          : isEvento
          ? 'assets/data/gta5/guia/offline/eventos-aleatorios.json?t=' + new Date().getTime()
          : 'assets/data/gta5/guia/offline/guia-misiones-historia.json?t=' + new Date().getTime();
          
      return this.http.get<GuiaArticulo[]>(jsonUrl).pipe(
        map(misiones => {
          const found = misiones.find(m => m.id === articuloId || m.slug === articuloId);
          if (found) {
            const siblings = misiones.filter(m => m.id !== found.id);
            return {
              ...found,
              tags: found.tags || ['Guía', sec?.titulo || 'Historia', 'GTA V', found.badge || 'Los Santos'],
              relacionados: siblings.slice(0, 2).map(m => ({ id: m.id, titulo: m.titulo, slug: m.slug })),
              ultimaActualizacion: new Date().toISOString()
            } as GuiaArticulo;
          }
          return this.getFallbackArticulo(juegoId, articuloId);
        }),
        catchError(() => of(this.getFallbackArticulo(juegoId, articuloId)))
      );
    }

    const gta6JsonUrl = 'assets/data/gta6/guia/offline/guia-offline-prologo.json?t=' + new Date().getTime();
    return this.http.get<GuiaArticulo[]>(gta6JsonUrl).pipe(
      map(articulos => {
        const found = articulos.find(a => a.id === articuloId || a.slug === articuloId);
        if (found) {
          const siblings = articulos.filter(a => a.id !== found.id);
          return {
            ...found,
            tags: found.tags || ['Guía', 'GTA VI', found.badge || 'Vice City'],
            relacionados: siblings.slice(0, 2).map(a => ({ id: a.id, titulo: a.titulo, slug: a.slug })),
            ultimaActualizacion: new Date().toISOString()
          } as GuiaArticulo;
        }
        return this.getFallbackArticulo(juegoId, articuloId);
      }),
      catchError(() => of(this.getFallbackArticulo(juegoId, articuloId)))
    );
  }

  /**
   * Obtiene los artículos narrativos del prólogo de la guía de GTA Online.
   */
  getOnlinePrologoArticulos(): Observable<GuiaArticulo[]> {
    const jsonUrl = 'assets/data/gta5/guia/online/guia-online-prologo.json?t=' + new Date().getTime();
    return this.http.get<GuiaArticulo[]>(jsonUrl).pipe(
      catchError(() => of([]))
    );
  }

  /**
   * Obtiene el catálogo de trofeos de GTA V (listado real en español).
   */
  getTrofeos(juegoId: 'gta5' | 'gta6'): Observable<TrofeosCatalogo> {
    if (juegoId === 'gta5') {
      const jsonUrl = 'assets/data/gta5/guia/offline/trofeos.json?t=' + new Date().getTime();
      return this.http.get<TrofeosCatalogo>(jsonUrl).pipe(
        catchError(() => of(this.getFallbackTrofeos()))
      );
    }
    return of(this.getFallbackTrofeos());
  }

  private getFallbackTrofeos(): TrofeosCatalogo {
    return {
      juego: 'Grand Theft Auto V',
      plataforma: 'PlayStation',
      resumen: { total: 0, platino: 0, oro: 0, plata: 0, bronce: 0 },
      trofeos: []
    };
  }

  /**
   * Busca artículos en la guía
   */
  buscarArticulos(juegoId: 'gta5' | 'gta6', query: string): Observable<GuiaArticuloResumen[]> {
    const params = new HttpParams().set('q', query);
    return this.http.get<GuiaArticuloResumen[]>(`/api/${juegoId}/guia/buscar`, { params }).pipe(
      catchError(() => {
        const q = (query || '').toLowerCase().trim();
        const manifest = this.getFallbackManifest(juegoId);
        const results: GuiaArticuloResumen[] = [];
        for (const sec of manifest.secciones) {
          for (const a of sec.articulos) {
            if (a.titulo.toLowerCase().includes(q) || a.subtitulo.toLowerCase().includes(q)) {
              results.push(a);
            }
          }
        }
        return of(results);
      })
    );
  }

  /* --------------------------------------------------------------------------
     DATOS LOCALES DE RESPALDO (OFFLINE / INICIALES)
     -------------------------------------------------------------------------- */
  private getFallbackManifest(juegoId: 'gta5' | 'gta6'): GuiaManifest {
    if (juegoId === 'gta5') {
      return {
        id: 'gta5',
        juego: 'Grand Theft Auto V',
        titulo: 'Guía GTA V',
        descripcion: 'Compendio interactivo de Los Santos y Blaine County: Modo Historia al 100%, Golpes, Bolsa e Inversiones, y Secretos.',
        bannerUrl: 'assets/home-bg.jpg',
        secciones: [
            {
              id: 'prologo',
              titulo: 'Prólogo',
              icono: 'book-open',
              descripcion: 'Introducción a la guía interactiva de Grand Theft Auto V y perfiles de los protagonistas.',
              orden: 0,
              articulos: [
                { id: 'prologo-introduccion-guia', slug: 'prologo-introduccion-guia', titulo: 'Guía de GTA V - (Historia)', subtitulo: 'Guía del modo historia de Grand Theft Auto 5', categoria: 'prologo', badge: 'Introducción', tiempoLecturaMinutos: 4 },
                { id: 'michael-de-santa', slug: 'michael-de-santa', titulo: 'Michael De Santa: El Ladrón Retirado', subtitulo: 'Habilidades y características · Tiempo bala, crisis existencial y relación con el FIB', categoria: 'prologo', badge: 'Michael', tiempoLecturaMinutos: 5 },
                { id: 'franklin-clinton', slug: 'franklin-clinton', titulo: 'Franklin Clinton: La Nueva Sangre', subtitulo: 'Habilidades y características · Conducción ralentizada, Chop y Forum Drive', categoria: 'prologo', badge: 'Franklin', tiempoLecturaMinutos: 5 },
                { id: 'trevor-philips', slug: 'trevor-philips', titulo: 'Trevor Philips: El Caos Encarnado', subtitulo: 'Habilidades y características · Modo Furia, Industrias TP y su pasado en North Yankton', categoria: 'prologo', badge: 'Trevor', tiempoLecturaMinutos: 6 },
                { id: 'michael-trevor-franklin-intrahistoria', slug: 'michael-trevor-franklin-intrahistoria', titulo: 'Michael, Trevor y Franklin: Tres Caminos hacia el Desastre', subtitulo: 'La intrahistoria del trío · Encuentros, lealtades cruzadas y el secreto de North Yankton', categoria: 'prologo', badge: 'Intrahistoria', tiempoLecturaMinutos: 6 }
              ]
            },
            {
              id: 'misiones-historia',
              titulo: 'Misiones Principales',
              icono: 'gun',
              descripcion: 'Guía detallada paso a paso de todas las misiones principales de GTA V.',
              orden: 1,
              articulos: [
                { id: 'mision-01-prologo', slug: 'prologo', titulo: '01. Prólogo', subtitulo: 'Michael, Trevor y Brad · Ludendorff, North Yankton (2004)', categoria: 'misiones-historia', badge: 'North Yankton', tiempoLecturaMinutos: 5 },
                { id: 'mision-02-franklin-y-lamar', slug: 'franklin-y-lamar', titulo: '02. Franklin y Lamar', subtitulo: 'Franklin Clinton · Del Perro & Richards Majestic', categoria: 'misiones-historia', badge: 'Franklin', tiempoLecturaMinutos: 6 },
                { id: 'mision-03-embargo', slug: 'embargo', titulo: '03. Embargo (Repossession)', subtitulo: 'Franklin Clinton · Vespucci Beach & Callejón Vagos', categoria: 'misiones-historia', badge: 'Franklin', tiempoLecturaMinutos: 6 },
                { id: 'mision-04-complicaciones', slug: 'complicaciones', titulo: '04. Complicaciones (Complications)', subtitulo: 'Franklin y Michael · Mansión de Rockford Hills', categoria: 'misiones-historia', badge: 'Michael & Franklin', tiempoLecturaMinutos: 6 },
                { id: 'mision-05-chop', slug: 'chop', titulo: '05. Chop', subtitulo: 'Franklin Clinton · Strawberry & Vías del Ferrocarril', categoria: 'misiones-historia', badge: 'Franklin', tiempoLecturaMinutos: 6 },
                { id: 'mision-06-padre-e-hijo', slug: 'padre-e-hijo', titulo: '06. Padre e hijo', subtitulo: 'Michael y Franklin · Pacific Bluffs & Los Santos Freeway', categoria: 'misiones-historia', badge: 'Michael & Franklin', tiempoLecturaMinutos: 6 },
                { id: 'mision-07-asesoramiento-matrimonial', slug: 'asesoramiento-matrimonial', titulo: '07. Asesoramiento matrimonial', subtitulo: 'Michael y Franklin · Vinewood Hills', categoria: 'misiones-historia', badge: 'Michael & Franklin', tiempoLecturaMinutos: 7 },
                { id: 'mision-08-nina-de-papa', slug: 'nina-de-papa', titulo: '08. La niña de papá', subtitulo: 'Michael De Santa · Vespucci Beach & Puertos', categoria: 'misiones-historia', badge: 'Michael', tiempoLecturaMinutos: 6 },
                { id: 'mision-09-solicitud-de-amistad', slug: 'solicitud-de-amistad', titulo: '09. Solicitud de amistad', subtitulo: 'Michael De Santa · Oficinas de Lifeinvader', categoria: 'misiones-historia', badge: 'Michael', tiempoLecturaMinutos: 8 },
                { id: 'mision-10-el-largo-trecho', slug: 'el-largo-trecho', titulo: '10. El largo trecho', subtitulo: 'Franklin Clinton · Ammu-Nation & Rogers Salvage', categoria: 'misiones-historia', badge: 'Franklin', tiempoLecturaMinutos: 10 },
                { id: 'mision-11-caso-joyero', slug: 'caso-joyero', titulo: '11. Caso joyero', subtitulo: 'Michael De Santa · Rockford Hills', categoria: 'misiones-historia', badge: 'Michael', tiempoLecturaMinutos: 7 },
                { id: 'mision-12-equipo-bugstars', slug: 'equipo-bugstars', titulo: '12. Equipo de Bugstars', subtitulo: 'Michael De Santa · Puerto de Los Santos', categoria: 'misiones-historia', badge: 'Preparación', tiempoLecturaMinutos: 4 },
                { id: 'mision-13-granadas-gas-bz', slug: 'granadas-gas-bz', titulo: '13. Granadas de gas BZ', subtitulo: 'Michael De Santa · Aeropuerto Internacional (LSIA)', categoria: 'misiones-historia', badge: 'Preparación', tiempoLecturaMinutos: 5 },
                { id: 'mision-14-golpe-joyeria', slug: 'golpe-joyeria', titulo: '14. El golpe a la joyería', subtitulo: 'Michael y Franklin · Rockford Hills', categoria: 'misiones-historia', badge: 'Gran Golpe', tiempoLecturaMinutos: 12 },
                { id: 'mision-15-senor-philips', slug: 'senor-philips', titulo: '15. El señor Philips', subtitulo: 'Trevor Philips · Sandy Shores & Grapeseed', categoria: 'misiones-historia', badge: 'Trevor', tiempoLecturaMinutos: 10 },
                { id: 'mision-16-trevor-philips-industries', slug: 'trevor-philips-industries', titulo: '16. Industrias Trevor Philips', subtitulo: 'Trevor Philips · Yellow Jack Inn', categoria: 'misiones-historia', badge: 'Trevor', tiempoLecturaMinutos: 8 },
                { id: 'mision-17-ron-el-nervioso', slug: 'ron-el-nervioso', titulo: '17. Ron el nervioso', subtitulo: 'Trevor Philips · Sandy Shores', categoria: 'misiones-historia', badge: 'Trevor', tiempoLecturaMinutos: 10 },
                { id: 'mision-18-laberinto-de-cristal', slug: 'laberinto-de-cristal', titulo: '18. Laberinto de cristal', subtitulo: 'Trevor Philips · Granja O\'Neil', categoria: 'misiones-historia', badge: 'Trevor', tiempoLecturaMinutos: 7 },
                { id: 'mision-19-reencuentro', slug: 'reencuentro', titulo: '19. Reencuentro', subtitulo: 'Trevor Philips · Los Santos', categoria: 'misiones-historia', badge: 'Trevor', tiempoLecturaMinutos: 6 },
                { id: 'mision-20-fama-o-drama', slug: 'fama-o-drama', titulo: '20. Fama o drama', subtitulo: 'Michael y Trevor · Maze Bank Arena', categoria: 'misiones-historia', badge: 'Michael & Trevor', tiempoLecturaMinutos: 8 },
                { id: 'mision-21-muerto-en-vida', slug: 'muerto-en-vida', titulo: '21. El muerto viviente', subtitulo: 'Michael De Santa · Centro Médico de LS', categoria: 'misiones-historia', badge: 'Michael', tiempoLecturaMinutos: 8 },
                { id: 'mision-22-tres-son-multitud', slug: 'tres-son-multitud', titulo: '22. Tres son multitud', subtitulo: 'Michael, Franklin y Trevor · Edificio IAA', categoria: 'misiones-historia', badge: 'FIB', tiempoLecturaMinutos: 10 },
                { id: 'mision-23-de-libro', slug: 'de-libro', titulo: '23. De libro', subtitulo: 'Trevor y Michael · Murrieta Oil Field / Rockford Hills', categoria: 'misiones-historia', badge: 'FIB', tiempoLecturaMinutos: 9 },
                { id: 'mision-24-safari-por-el-barrio', slug: 'safari-por-el-barrio', titulo: '24. Safari por el barrio', subtitulo: 'Franklin y Trevor · Grove Street (Davis)', categoria: 'misiones-historia', badge: 'Franklin & Trevor', tiempoLecturaMinutos: 10 },
                { id: 'mision-25-alguien-dijo-yoga', slug: 'alguien-dijo-yoga', titulo: '25. ¿Alguien dijo yoga?', subtitulo: 'Michael De Santa · Rockford Hills', categoria: 'misiones-historia', badge: 'Michael', tiempoLecturaMinutos: 12 },
                { id: 'mision-26-reconocimiento-del-puerto', slug: 'reconocimiento-del-puerto', titulo: '26. Reconocimiento del puerto', subtitulo: 'Trevor Philips · Puerto de Los Santos', categoria: 'misiones-historia', badge: 'Trevor', tiempoLecturaMinutos: 10 },
                { id: 'mision-27-minisubmarino', slug: 'minisubmarino', titulo: '27. Minisubmarino', subtitulo: 'Trevor Philips · Puerto de Los Santos', categoria: 'misiones-historia', badge: 'Preparación', tiempoLecturaMinutos: 5 },
                { id: 'mision-28-cargobob', slug: 'cargobob', titulo: '28. Cargobob', subtitulo: 'Trevor Philips · Base Militar Fort Zancudo', categoria: 'misiones-historia', badge: 'Preparación', tiempoLecturaMinutos: 6 },
                { id: 'mision-29-golpe-a-merryweather', slug: 'golpe-a-merryweather', titulo: '29. El golpe a Merryweather', subtitulo: 'Michael, Franklin y Trevor · Alta Mar / Puerto', categoria: 'misiones-historia', badge: 'Gran Golpe', tiempoLecturaMinutos: 12 },
                { id: 'mision-30-camion-de-basura', slug: 'camion-de-basura', titulo: '30. Camión de la basura', subtitulo: 'Cualquier protagonista · Los Santos', categoria: 'misiones-historia', badge: 'Preparación', tiempoLecturaMinutos: 4 },
                { id: 'mision-31-grua', slug: 'grua', titulo: '31. Grúa', subtitulo: 'Cualquier protagonista · Los Santos', categoria: 'misiones-historia', badge: 'Preparación', tiempoLecturaMinutos: 4 },
                { id: 'mision-32-el-buzo', slug: 'el-buzo', titulo: '32. El buzo (Blitz Play)', subtitulo: 'Michael, Franklin y Trevor · Cypress Flats', categoria: 'misiones-historia', badge: 'Gran Golpe', tiempoLecturaMinutos: 12 },
                { id: 'mision-33-el-senor-richards', slug: 'el-senor-richards', titulo: '33. El señor Richards', subtitulo: 'Michael De Santa · Vinewood (Estudios Richards)', categoria: 'misiones-historia', badge: 'Michael', tiempoLecturaMinutos: 8 },
                { id: 'mision-34-enfrentamiento-con-la-ley', slug: 'enfrentamiento-con-la-ley', titulo: '34. Enfrentamiento con la ley...', subtitulo: 'Franklin, Michael y Trevor · Del Perro Freeway', categoria: 'misiones-historia', badge: 'Devin Weston', tiempoLecturaMinutos: 10 },
                { id: 'mision-35-el-ojo-en-el-cielo', slug: 'el-ojo-en-el-cielo', titulo: '35. El ojo en el cielo', subtitulo: 'Trevor y Franklin · LSPD Central', categoria: 'misiones-historia', badge: 'Trevor & Franklin', tiempoLecturaMinutos: 9 },
                { id: 'mision-36-caida-libre', slug: 'caida-libre', titulo: '36. Caída libre', subtitulo: 'Michael y Trevor · Observatorio Galileo', categoria: 'misiones-historia', badge: 'Martín Madrazo', tiempoLecturaMinutos: 10 },
                { id: 'mision-37-en-el-fondo-del-mar', slug: 'en-el-fondo-del-mar', titulo: '37. En el fondo del mar', subtitulo: 'Franklin Clinton · Richards Majestic', categoria: 'misiones-historia', badge: 'Devin Weston', tiempoLecturaMinutos: 8 },
                { id: 'mision-38-pasajero-clandestino', slug: 'pasajero-clandestino', titulo: '38. Pasajero clandestino', subtitulo: 'Trevor Philips · Aeródromo de Grapeseed', categoria: 'misiones-historia', badge: 'Trevor', tiempoLecturaMinutos: 12 },
                { id: 'mision-39-el-bloqueo', slug: 'el-bloqueo', titulo: '39. El bloqueo', subtitulo: 'Michael y Trevor · Paleto Bay', categoria: 'misiones-historia', badge: 'Preparación', tiempoLecturaMinutos: 10 },
                { id: 'mision-40-depredador', slug: 'depredador', titulo: '40. Depredador', subtitulo: 'Trevor, Michael y Franklin · Bosque de Paleto', categoria: 'misiones-historia', badge: 'Trevor', tiempoLecturaMinutos: 12 },
                { id: 'mision-41-material-militar', slug: 'material-militar', titulo: '41. Material militar', subtitulo: 'Cualquier protagonista · Autopista de Paleto Bay', categoria: 'misiones-historia', badge: 'Preparación', tiempoLecturaMinutos: 6 },
                { id: 'mision-42-golpe-de-paleto', slug: 'golpe-de-paleto', titulo: '42. El golpe de Paleto', subtitulo: 'Michael, Trevor y Franklin · Banco de Paleto', categoria: 'misiones-historia', badge: 'Gran Golpe', tiempoLecturaMinutos: 15 },
                { id: 'mision-43-descarrilado', slug: 'descarrilado', titulo: '43. Descarrilado', subtitulo: 'Trevor y Michael · Sandy Shores / Río Zancudo', categoria: 'misiones-historia', badge: 'Trevor & Michael', tiempoLecturaMinutos: 10 },
                { id: 'mision-44-el-mono-se-la-gana', slug: 'el-mono-se-la-gana', titulo: '44. El mono se la gana (Monkey Business)', subtitulo: 'Michael, Franklin y Trevor · Humane Labs', categoria: 'misiones-historia', badge: 'FIB', tiempoLecturaMinutos: 12 },
                { id: 'mision-45-hang-ten', slug: 'hang-ten', titulo: '45. Hang Ten', subtitulo: 'Trevor Philips · Vanilla Unicorn (Strawberry)', categoria: 'misiones-historia', badge: 'Trevor', tiempoLecturaMinutos: 4 },
                { id: 'mision-46-investigando-el-golpe', slug: 'investigando-el-golpe', titulo: '46. Investigando el golpe', subtitulo: 'Michael, Franklin y Trevor · Union Depository', categoria: 'misiones-historia', badge: 'Gran Golpe', tiempoLecturaMinutos: 10 },
                { id: 'mision-47-enterrando-el-hacha', slug: 'enterrando-el-hacha', titulo: '47. Enterrando el hacha de guerra', subtitulo: 'Michael y Trevor · North Yankton', categoria: 'misiones-historia', badge: 'Michael & Trevor', tiempoLecturaMinutos: 10 },
                { id: 'mision-48-secuestrador', slug: 'secuestrador', titulo: '48. Secuestrador (Pack Man)', subtitulo: 'Franklin y Trevor · Gran Señora Freeway', categoria: 'misiones-historia', badge: 'Devin Weston', tiempoLecturaMinutos: 12 },
                { id: 'mision-49-carne-fresca', slug: 'carne-fresca', titulo: '49. Carne fresca', subtitulo: 'Franklin y Michael · Matadero (Cypress Flats)', categoria: 'misiones-historia', badge: 'Franklin', tiempoLecturaMinutos: 10 },
                { id: 'mision-50-la-balada-de-rocco', slug: 'la-balada-de-rocco', titulo: '50. La balada de Rocco', subtitulo: 'Michael De Santa · Estudios Richards', categoria: 'misiones-historia', badge: 'Michael', tiempoLecturaMinutos: 4 },
                { id: 'mision-51-limpiando-el-fib', slug: 'limpiando-el-fib', titulo: '51. Limpiando el FIB', subtitulo: 'Michael De Santa · Sede del FIB', categoria: 'misiones-historia', badge: 'Lester', tiempoLecturaMinutos: 7 },
                { id: 'mision-52-reuniendo-a-la-familia', slug: 'reuniendo-a-la-familia', titulo: '52. Reuniendo a la familia', subtitulo: 'Michael De Santa · Los Santos', categoria: 'misiones-historia', badge: 'Michael', tiempoLecturaMinutos: 6 },
                { id: 'mision-53-arquitecto-para-todo', slug: 'arquitecto-para-todo', titulo: '53. Arquitecto para todo', subtitulo: 'Franklin Clinton · Obras de Pillbox Hill', categoria: 'misiones-historia', badge: 'Preparación', tiempoLecturaMinutos: 5 },
                { id: 'mision-54-problemas-legales', slug: 'problemas-legales', titulo: '54. Problemas legales', subtitulo: 'Michael De Santa · Aeropuerto de Los Santos', categoria: 'misiones-historia', badge: 'Michael', tiempoLecturaMinutos: 8 },
                { id: 'mision-55-asalto-al-fib', slug: 'asalto-al-fib', titulo: '55. Asalto al FIB', subtitulo: 'Michael y Franklin · Torre del FIB', categoria: 'misiones-historia', badge: 'Gran Golpe', tiempoLecturaMinutos: 16 },
                { id: 'mision-56-el-enredo', slug: 'el-enredo', titulo: '56. El enredo (The Wrap Up)', subtitulo: 'Michael y Trevor · Centro Kortz', categoria: 'misiones-historia', badge: 'FIB', tiempoLecturaMinutos: 12 },
                { id: 'mision-57-lamar-de-problemas', slug: 'lamar-de-problemas', titulo: '57. Lamar de problemas', subtitulo: 'Franklin, Michael y Trevor · Aserradero de Paleto', categoria: 'misiones-historia', badge: 'Franklin', tiempoLecturaMinutos: 14 },
                { id: 'mision-58-cataclismo', slug: 'cataclismo', titulo: '58. Cataclismo (Meltdown)', subtitulo: 'Michael De Santa · Vinewood Boulevard', categoria: 'misiones-historia', badge: 'Michael', tiempoLecturaMinutos: 10 },
                { id: 'mision-59-perforadoras', slug: 'perforadoras', titulo: '59. Perforadoras (Drillers)', subtitulo: 'Cualquier protagonista · La Mesa', categoria: 'misiones-historia', badge: 'Preparación', tiempoLecturaMinutos: 5 },
                { id: 'mision-60-via-muerta', slug: 'via-muerta', titulo: '60. Vía muerta (Sidetracked)', subtitulo: 'Cualquier protagonista · Vías del tren de Davis', categoria: 'misiones-historia', badge: 'Preparación', tiempoLecturaMinutos: 5 },
                { id: 'mision-61-el-gran-golpe', slug: 'el-gran-golpe', titulo: '61. El gran golpe (The Big Score)', subtitulo: 'Todos los protagonistas · Union Depository', categoria: 'misiones-historia', badge: 'Gran Golpe', tiempoLecturaMinutos: 15 },
                { id: 'mision-62-el-asesinato-del-hotel', slug: 'el-asesinato-del-hotel', titulo: '62. El asesinato del hotel', subtitulo: 'Franklin Clinton · Von Crastenburg Hotel', categoria: 'misiones-historia', badge: 'Lester', tiempoLecturaMinutos: 6 },
                { id: 'mision-63-el-asesinato-multiple', slug: 'el-asesinato-multiple', titulo: '63. El asesinato múltiple', subtitulo: 'Franklin Clinton · Varias ubicaciones (Los Santos)', categoria: 'misiones-historia', badge: 'Lester', tiempoLecturaMinutos: 8 },
                { id: 'mision-64-el-asesinato-del-vicio', slug: 'el-asesinato-del-vicio', titulo: '64. El asesinato del vicio', subtitulo: 'Franklin Clinton · Mutiny Road (La Puerta)', categoria: 'misiones-historia', badge: 'Lester', tiempoLecturaMinutos: 6 },
                { id: 'mision-65-el-asesinato-del-autobus', slug: 'el-asesinato-del-autobus', titulo: '65. El asesinato del autobús', subtitulo: 'Franklin Clinton · Varias rutas (Los Santos)', categoria: 'misiones-historia', badge: 'Lester', tiempoLecturaMinutos: 7 },
                { id: 'mision-66-el-asesinato-de-la-obra', slug: 'el-asesinato-de-la-obra', titulo: '66. El asesinato de la obra', subtitulo: 'Franklin Clinton · Obra en construcción (Pillbox Hill)', categoria: 'misiones-historia', badge: 'Lester', tiempoLecturaMinutos: 8 },
                { id: 'mision-67-opcion-a', slug: 'opcion-a', titulo: '67. Opción A: Con sentido común', subtitulo: 'Franklin Clinton · Los Santos / Murrieta Oil Field', categoria: 'misiones-historia', badge: 'Final (A)', tiempoLecturaMinutos: 5 },
                { id: 'mision-68-opcion-b', slug: 'opcion-b', titulo: '68. Opción B: Ha llegado la hora', subtitulo: 'Franklin Clinton · Pacific Bluffs', categoria: 'misiones-historia', badge: 'Final (B)', tiempoLecturaMinutos: 5 },
                { id: 'mision-69-opcion-c', slug: 'opcion-c', titulo: '69. Opción C: La tercera vía', subtitulo: 'Todos los protagonistas · Fundición / Chumash', categoria: 'misiones-historia', badge: 'Final (C) (Canon)', tiempoLecturaMinutos: 25 }
              ]
            },
            {
              id: 'extranos-locos',
              titulo: 'Locos y Extraños',
              icono: 'burst',
              descripcion: 'Misiones secundarias de Extraños y Locos por todo San Andreas.',
              orden: 2,
              articulos: [
                { id: 'eyl-tonya-1', slug: 'tonya-favores', titulo: 'Favores (Tonya 1)', subtitulo: 'Franklin y Tonya · Licorería de Strawberry', categoria: 'extranos-locos', badge: 'Tonya', tiempoLecturaMinutos: 5 },
                { id: 'eyl-tonya-2', slug: 'tonya-otro-favor', titulo: 'Otro favor (Tonya 2)', subtitulo: 'Franklin y Tonya · Depósito de Polmon', categoria: 'extranos-locos', badge: 'Tonya', tiempoLecturaMinutos: 5 },
                { id: 'eyl-tonya-3', slug: 'tonya-mas-favores', titulo: 'Más favores (Tonya 3)', subtitulo: 'Franklin y Tonya · Servicio Telefónico', categoria: 'extranos-locos', badge: 'Tonya', tiempoLecturaMinutos: 5 },
                { id: 'eyl-tonya-4', slug: 'tonya-aun-con-favores', titulo: 'Aún con favores (Tonya 4)', subtitulo: 'Franklin y Tonya · Autopista de Great Chaparral', categoria: 'extranos-locos', badge: 'Tonya', tiempoLecturaMinutos: 6 },
                { id: 'eyl-tonya-5', slug: 'tonya-un-ultimo-favor', titulo: 'Un último favor (Tonya 5)', subtitulo: 'Franklin y Tonya · Davis & Adquisición del Negocio', categoria: 'extranos-locos', badge: 'Tonya', tiempoLecturaMinutos: 6 },
                { id: 'eyl-beverly-1', slug: 'paparazzo-beverly-1', titulo: '06. Paparazzo (Beverly 1)', subtitulo: 'Franklin y Beverly · Eclipse Boulevard', categoria: 'extranos-locos', badge: 'Beverly', tiempoLecturaMinutos: 6 },
                { id: 'eyl-beverly-2', slug: 'paparazzo-el-video-porno-beverly-2', titulo: '07. Paparazzo: El vídeo porno (Beverly 2)', subtitulo: 'Franklin y Beverly · The Gentry Manor Hotel', categoria: 'extranos-locos', badge: 'Beverly', tiempoLecturaMinutos: 6 },
                { id: 'eyl-beverly-3', slug: 'paparazzo-la-colaboracion-beverly-3', titulo: '08. Paparazzo: La colaboración (Beverly 3)', subtitulo: 'Franklin y Beverly · Spitroasters Meathouse', categoria: 'extranos-locos', badge: 'Beverly', tiempoLecturaMinutos: 4 },
                { id: 'eyl-beverly-4', slug: 'paparazzo-el-colapso-beverly-4', titulo: '09. Paparazzo: El colapso (Beverly 4)', subtitulo: 'Franklin Clinton · Doppler Theater & Vinewood Hills', categoria: 'extranos-locos', badge: 'Beverly', tiempoLecturaMinutos: 6 },
                { id: 'eyl-beverly-5', slug: 'paparazzo-su-alteza-beverly-5', titulo: '10. Paparazzo: Su alteza (Beverly 5)', subtitulo: 'Franklin Clinton · Chico\'s Hypermarket & Mirror Park', categoria: 'extranos-locos', badge: 'Beverly', tiempoLecturaMinutos: 6 },
                { id: 'eyl-beverly-6', slug: 'paparazzo-choque-con-la-realidad-beverly-6', titulo: '11. Paparazzo: Choque con la realidad (Beverly 6)', subtitulo: 'Franklin y Beverly · The Generic Hotel, West Vinewood', categoria: 'extranos-locos', badge: 'Beverly', tiempoLecturaMinutos: 5 },
                { id: 'eyl-hao-1', slug: 'hao-turno-de-noche', titulo: '12. Turno de noche (Hao 1)', subtitulo: 'Franklin y Hao · Carreras Urbanas de Los Santos', categoria: 'extranos-locos', badge: 'Hao', tiempoLecturaMinutos: 5 },
                { id: 'eyl-barry-1', slug: 'movimiento-verde-michael-barry-1', titulo: '13. Movimiento verde: Michael (Barry 1)', subtitulo: 'Michael de Santa · Legion Square & Alucinación Alienígena', categoria: 'extranos-locos', badge: 'Barry', tiempoLecturaMinutos: 5 },
                { id: 'eyl-barry-2', slug: 'movimiento-verde-trevor-barry-2', titulo: '14. Movimiento verde: Trevor (Barry 2)', subtitulo: 'Trevor Philips · Legion Square & Pesadilla de Payasos', categoria: 'extranos-locos', badge: 'Barry', tiempoLecturaMinutos: 5 },
                { id: 'eyl-barry-3', slug: 'movimiento-verde-franklin-barry-3', titulo: '15. Movimiento verde: Franklin (Barry 3)', subtitulo: 'Franklin Clinton · Legion Square & Encuentro con Barry', categoria: 'extranos-locos', badge: 'Barry', tiempoLecturaMinutos: 4 },
                { id: 'eyl-barry-4', slug: 'movimiento-verde-la-recogida-barry-4', titulo: '16. Movimiento verde: La recogida (Barry 4)', subtitulo: 'Franklin Clinton · Alijo en El Burro Heights', categoria: 'extranos-locos', badge: 'Barry', tiempoLecturaMinutos: 6 },
                { id: 'eyl-barry-5', slug: 'movimiento-verde-el-arrastre-barry-5', titulo: '17. Movimiento verde: El arrastre (Barry 5)', subtitulo: 'Franklin Clinton · Desguace de La Puerta & Remolque a Vespucci', categoria: 'extranos-locos', badge: 'Barry', tiempoLecturaMinutos: 6 },
                { id: 'eyl-barry-6', slug: 'movimiento-verde-la-protesta-barry-6', titulo: '18. Movimiento verde: La protesta (Barry 6)', subtitulo: 'Franklin Clinton · Ayuntamiento de Los Santos (City Hall)', categoria: 'extranos-locos', badge: 'Barry', tiempoLecturaMinutos: 4 },
                { id: 'eyl-maryann-1', slug: 'ejercicio-demoniaco-michael-maryann-1', titulo: '19. Ejercicio demoníaco: Michael (Mary-Ann 1)', subtitulo: 'Michael de Santa y Mary-Ann · Pacific Bluffs', categoria: 'extranos-locos', badge: 'Mary-Ann', tiempoLecturaMinutos: 5 },
                { id: 'eyl-maryann-2', slug: 'ejercicio-demoniaco-trevor-maryann-2', titulo: '20. Ejercicio demoníaco: Trevor (Mary-Ann 2)', subtitulo: 'Trevor Philips y Mary-Ann · Colinas de Vinewood Hills', categoria: 'extranos-locos', badge: 'Mary-Ann', tiempoLecturaMinutos: 5 },
                { id: 'eyl-maryann-3', slug: 'ejercicio-demoniaco-franklin-maryann-3', titulo: '21. Ejercicio demoníaco: Franklin (Mary-Ann 3)', subtitulo: 'Franklin Clinton y Mary-Ann · Paleto Bay & Triatlón', categoria: 'extranos-locos', badge: 'Mary-Ann', tiempoLecturaMinutos: 6 },
                { id: 'eyl-cletus-1', slug: 'practica-de-tiro-cletus-1', titulo: '22. Práctica de tiro (Cletus 1)', subtitulo: 'Trevor Philips y Cletus · Sandy Shores', categoria: 'extranos-locos', badge: 'Cletus', tiempoLecturaMinutos: 6 },
                { id: 'eyl-cletus-2', slug: 'caza-mayor-cletus-2', titulo: '23. Caza mayor (Cletus 2)', subtitulo: 'Trevor Philips y Cletus · Paleto Forest & Caza de Ciervos', categoria: 'extranos-locos', badge: 'Cletus', tiempoLecturaMinutos: 6 },
                { id: 'eyl-dom-1', slug: 'evaluacion-del-riesgo-dom-1', titulo: '24. Evaluación del riesgo (Dom 1)', subtitulo: 'Franklin Clinton y Dom · Galileo Observatory & Monte Chiliad', categoria: 'extranos-locos', badge: 'Dom', tiempoLecturaMinutos: 6 },
                { id: 'eyl-dom-2', slug: 'riesgo-de-liquidez-dom-2', titulo: '25. Riesgo de liquidez (Dom 2)', subtitulo: 'Franklin Clinton y Dom · Aeropuerto de Los Santos & Alamo Sea', categoria: 'extranos-locos', badge: 'Dom', tiempoLecturaMinutos: 6 },
                { id: 'eyl-dom-3', slug: 'riesgo-especifico-dom-3', titulo: '26. Riesgo específico (Dom 3)', subtitulo: 'Franklin Clinton y Dom · Azotea de la Torre Maze Bank', categoria: 'extranos-locos', badge: 'Dom', tiempoLecturaMinutos: 5 },
                { id: 'eyl-dom-4', slug: 'riesgo no calculado-dom-4', titulo: '27. Riesgo no calculado (Dom 4)', subtitulo: 'Franklin Clinton y Dom · Presa de Land Act Reservoir', categoria: 'extranos-locos', badge: 'Dom', tiempoLecturaMinutos: 5 },
                { id: 'eyl-maude-1', slug: 'lazos-especiales-maude-1', titulo: '28. Lazos especiales (Maude 1)', subtitulo: 'Trevor Philips y Maude · Grapeseed & Caza de Fugitivos', categoria: 'extranos-locos', badge: 'Maude', tiempoLecturaMinutos: 5 },
                { id: 'eyl-patrulla-1', slug: 'patrulla-fronteriza-civil-1', titulo: '29. La patrulla fronteriza civil (Patrulla 1)', subtitulo: 'Trevor Philips · Grand Senora Desert & Yellow Jack Inn', categoria: 'extranos-locos', badge: 'Patrulla', tiempoLecturaMinutos: 6 },
                { id: 'eyl-patrulla-2', slug: 'bienvenida-americana-patrulla-2', titulo: '30. Una bienvenida americana (Patrulla 2)', subtitulo: 'Trevor Philips · North Calafia Way & Alamo Sea', categoria: 'extranos-locos', badge: 'Patrulla', tiempoLecturaMinutos: 6 },
                { id: 'eyl-patrulla-3', slug: 'blues-del-miliciano-patrulla-3', titulo: '31. Blues del miliciano (Patrulla 3)', subtitulo: 'Trevor Philips · Granja de Grapeseed', categoria: 'extranos-locos', badge: 'Patrulla', tiempoLecturaMinutos: 5 },
                { id: 'eyl-dreyfuss-1', slug: 'una-estrella-en-vinewood-dreyfuss-1', titulo: '32. Una estrella en Vinewood (Peter Dreyfuss)', subtitulo: 'Franklin Clinton · Hangman Avenue & Mansión de Peter Dreyfuss', categoria: 'extranos-locos', badge: 'Dreyfuss', tiempoLecturaMinutos: 6 },
                { id: 'eyl-epsilon-1', slug: 'buscando-la-verdad-epsilon-1', titulo: '33. Buscando la verdad (Epsilon 1)', subtitulo: 'Michael de Santa · Raton Canyon & Camioneta Roja', categoria: 'extranos-locos', badge: 'Epsilon', tiempoLecturaMinutos: 5 },
                { id: 'eyl-epsilon-2', slug: 'aceptando-la-verdad-epsilon-2', titulo: '34. Aceptando la verdad (Epsilon 2)', subtitulo: 'Michael de Santa · Almacén de Downtown Vinewood', categoria: 'extranos-locos', badge: 'Epsilon', tiempoLecturaMinutos: 4 },
                { id: 'eyl-epsilon-3', slug: 'asumiendo-la-verdad-epsilon-3', titulo: '35. Asumiendo la verdad (Epsilon 3)', subtitulo: 'Michael de Santa · Grapeseed & Entrega de 5 Vehículos', categoria: 'extranos-locos', badge: 'Epsilon', tiempoLecturaMinutos: 7 },
                { id: 'eyl-epsilon-4', slug: 'persiguiendo-la-verdad-epsilon-4', titulo: '36. Persiguiendo la verdad (Epsilon 4)', subtitulo: 'Michael de Santa · Grapeseed & Detector Extraterrestre', categoria: 'extranos-locos', badge: 'Epsilon', tiempoLecturaMinutos: 6 },
                { id: 'eyl-epsilon-5', slug: 'portando-la-verdad-epsilon-5', titulo: '37. Portando la verdad (Epsilon 5)', subtitulo: 'Michael de Santa · Vinewood & Túnicas de Epsilon durante 10 Días', categoria: 'extranos-locos', badge: 'Epsilon', tiempoLecturaMinutos: 6 },
                { id: 'eyl-epsilon-6', slug: 'entregando-la-verdad-epsilon-6', titulo: '38. Entregando la verdad (Epsilon 6)', subtitulo: 'Michael de Santa · Fort Zancudo & Vuelo a Sandy Shores', categoria: 'extranos-locos', badge: 'Epsilon', tiempoLecturaMinutos: 6 },
                { id: 'eyl-epsilon-7', slug: 'ejercitando-la-verdad-epsilon-7', titulo: '39. Ejercitando la verdad (Epsilon 7)', subtitulo: 'Michael de Santa · Desierto de Grand Senora (Peregrinación de 5 Millas)', categoria: 'extranos-locos', badge: 'Epsilon', tiempoLecturaMinutos: 7 },
                { id: 'eyl-epsilon-8', slug: 'desconociendo-la-verdad-epsilon-8', titulo: '40. Desconociendo la verdad (Epsilon 8)', subtitulo: 'Michael de Santa · Centro Epsilon de Vinewood ($2.100.000)', categoria: 'extranos-locos', badge: 'Epsilon', tiempoLecturaMinutos: 8 },
                { id: 'eyl-josh-1', slug: 'comision-extra-josh-1', titulo: '41. Comisión extra (Josh 1)', subtitulo: 'Trevor Philips y Josh · West Eclipse Boulevard & 15 Carteles', categoria: 'extranos-locos', badge: 'Josh', tiempoLecturaMinutos: 6 },
                { id: 'eyl-josh-2', slug: 'cerrando-el-trato-josh-2', titulo: '42. Cerrando el trato (Josh 2)', subtitulo: 'Trevor Philips y Josh · Bilingsgate Motel & Lenny Avery', categoria: 'extranos-locos', badge: 'Josh', tiempoLecturaMinutos: 6 },
                { id: 'eyl-josh-3', slug: 'bienes-inmuebles-josh-3', titulo: '43. Bienes raíces surrealistas (Josh 3)', subtitulo: 'Trevor Philips y Josh · Incendio Provocado en Rockford Hills', categoria: 'extranos-locos', badge: 'Josh', tiempoLecturaMinutos: 5 },
                { id: 'eyl-josh-4', slug: 'ruptura-de-contrato-josh-4', titulo: '44. Ruptura de contrato (Josh 4)', subtitulo: 'Trevor Philips y Josh · Emboscada Policial en la Mansión Calcinada', categoria: 'extranos-locos', badge: 'Josh', tiempoLecturaMinutos: 5 },
                { id: 'eyl-nigel-1', slug: 'nigel-y-mrs-thornhill-1', titulo: '45. Nigel y la Sra. Thornhill (Nigel 1)', subtitulo: 'Trevor Philips · Mad Wayne Thunder Drive, Vinewood Hills', categoria: 'extranos-locos', badge: 'Nigel', tiempoLecturaMinutos: 5 },
                { id: 'eyl-nigel-2', slug: 'recuerdos-de-vinewood-willie-nigel-2', titulo: '46. Recuerdos de Vinewood: Willie (Nigel 2)', subtitulo: 'Trevor Philips · Club Tequi-la-la, West Vinewood (Diente de Oro)', categoria: 'extranos-locos', badge: 'Nigel', tiempoLecturaMinutos: 5 },
                { id: 'eyl-nigel-3', slug: 'recuerdos-de-vinewood-tyler-nigel-3', titulo: '47. Recuerdos de Vinewood: Tyler (Nigel 3)', subtitulo: 'Trevor Philips · Mansión de Tyler Dixon (Ropa de Baño)', categoria: 'extranos-locos', badge: 'Nigel', tiempoLecturaMinutos: 5 },
                { id: 'eyl-nigel-4', slug: 'recuerdos-de-vinewood-kerry-nigel-4', titulo: '48. Recuerdos de Vinewood: Kerry (Nigel 4)', subtitulo: 'Trevor Philips · Paseo Comercial de Portola Drive (Collar del Perro)', categoria: 'extranos-locos', badge: 'Nigel', tiempoLecturaMinutos: 5 },
                { id: 'eyl-nigel-5', slug: 'recuerdos-de-vinewood-mark-nigel-5', titulo: '49. Recuerdos de Vinewood: Mark (Nigel 5)', subtitulo: 'Trevor Philips · Club de Golf de Los Santos (Palo de Golf)', categoria: 'extranos-locos', badge: 'Nigel', tiempoLecturaMinutos: 6 },
                { id: 'eyl-nigel-6', slug: 'recuerdos-de-vinewood-al-di-napoli-nigel-6', titulo: '50. Recuerdos de Vinewood: Al Di Napoli (Nigel 6)', subtitulo: 'Trevor Philips · Prosperity Street Promenade & Hospital', categoria: 'extranos-locos', badge: 'Nigel', tiempoLecturaMinutos: 7 },
                { id: 'eyl-nigel-7', slug: 'recuerdos-de-vinewood-el-ultimo-acto-nigel-7', titulo: '51. Recuerdos de Vinewood: El último acto (Nigel 7)', subtitulo: 'Trevor Philips · Callejón Industrial & Vías del Tren (Palmer-Taylor)', categoria: 'extranos-locos', badge: 'Nigel', tiempoLecturaMinutos: 6 },
                { id: 'eyl-masacre-1', slug: 'masacre-1-paletos', titulo: '52. Masacre 1: Paletos de Sandy Shores', subtitulo: 'Trevor Philips · Licorería de Marina Drive, Sandy Shores', categoria: 'extranos-locos', badge: 'Masacre', tiempoLecturaMinutos: 5 },
                { id: 'eyl-masacre-2', slug: 'masacre-2-vagos', titulo: '53. Masacre 2: Pandilleros Vagos', subtitulo: 'Trevor Philips · Macdonald Street con Jamestown Street, Rancho', categoria: 'extranos-locos', badge: 'Masacre', tiempoLecturaMinutos: 5 },
                { id: 'eyl-masacre-3', slug: 'masacre-3-ballas', titulo: '54. Masacre 3: Pandilleros Ballas', subtitulo: 'Trevor Philips · Callejón de Forum Drive, Chamberlain Hills', categoria: 'extranos-locos', badge: 'Masacre', tiempoLecturaMinutos: 5 },
                { id: 'eyl-masacre-4', slug: 'masacre-4-militares', titulo: '55. Masacre 4: Soldados del Ejército', subtitulo: 'Trevor Philips · Carretera de Fort Zancudo, Great Chaparral', categoria: 'extranos-locos', badge: 'Masacre', tiempoLecturaMinutos: 6 },
                { id: 'eyl-masacre-5', slug: 'masacre-5-hipsters', titulo: '56. Masacre 5: Hipsters de Mirror Park', subtitulo: 'Trevor Philips · Cafetería Cool Beans, Mirror Park', categoria: 'extranos-locos', badge: 'Masacre', tiempoLecturaMinutos: 5 },
                { id: 'eyl-abigail-1', slug: 'muerte-en-el-mar-abigail-1', titulo: '57. Muerte en el mar (Abigail Mathers)', subtitulo: 'Michael de Santa y Abigail · Muelle de Sonar Collections Dock', categoria: 'extranos-locos', badge: 'Abigail', tiempoLecturaMinutos: 6 },
                { id: 'eyl-the-last-one', slug: 'el-ultimo-the-last-one', titulo: '58. El último (The Last One / El Sasquatch)', subtitulo: 'Franklin Clinton · Cañón de Raton Canyon (El Cazador del Bigfoot)', categoria: 'extranos-locos', badge: 'Sasquatch', tiempoLecturaMinutos: 7 }
              ]
            },
            {
            id: 'negocios-economia',
            titulo: 'Negocios y Bolsa',
            icono: 'briefcase',
            descripcion: 'Inversiones en bolsa con Lester y compra de propiedades en Los Santos.',
            orden: 3,
            articulos: [
              { id: 'asesinatos-lester-bolsa', slug: 'asesinatos-lester-bolsa', titulo: 'Inversión en Bolsa con las Misiones de Lester', subtitulo: 'Cómo conseguir $2.147 millones con cada personaje', categoria: 'negocios-economia', badge: 'Dinero Infinito', tiempoLecturaMinutos: 8 },
              { id: 'guia-negocios-propiedades', slug: 'guia-negocios-propiedades', titulo: 'Guía de Negocios y Propiedades Comprables', subtitulo: 'Costes, ingresos semanales y misiones de gestión', categoria: 'negocios-economia', badge: 'Inversiones', tiempoLecturaMinutos: 7 }
            ]
          },
          {
            id: 'eventos-aleatorios',
            titulo: 'Eventos Aleatorios',
            icono: 'shuffle',
            descripcion: 'Encuentros fortuitos y eventos dinámicos por todo Los Santos y Blaine County.',
            orden: 4,
            articulos: [
              { id: 'evento-01-vehiculo-abandonado-1', slug: 'vehiculo-abandonado-1', titulo: '01. Vehículo abandonado 1', subtitulo: 'Smoke Tree Road · Gran Desierto de Señora', categoria: 'eventos-aleatorios', badge: 'Emboscada', tiempoLecturaMinutos: 3 },
              { id: 'evento-02-vehiculo-abandonado-2', slug: 'vehiculo-abandonado-2', titulo: '02. Vehículo abandonado 2', subtitulo: 'RON Alternates Wind Farm · Parque Eólico', categoria: 'eventos-aleatorios', badge: 'Encuentro', tiempoLecturaMinutos: 3 },
              { id: 'evento-03-detencion-policial-1', slug: 'detencion-policial-1', titulo: '03. Detención policial 1', subtitulo: 'Granja O\'Neil · Grapeseed', categoria: 'eventos-aleatorios', badge: 'Persecución', tiempoLecturaMinutos: 3 },
              { id: 'evento-04-detencion-policial-2', slug: 'detencion-policial-2', titulo: '04. Detención policial 2', subtitulo: 'Senora Freeway · Parque Eólico', categoria: 'eventos-aleatorios', badge: 'Persecución', tiempoLecturaMinutos: 3 },
              { id: 'evento-05-atraco-cajero-automatico', slug: 'atraco-cajero-automatico', titulo: '05. Atraco en cajero automático', subtitulo: 'Cajeros automáticos · Varios puntos de San Andreas', categoria: 'eventos-aleatorios', badge: 'Atraco', tiempoLecturaMinutos: 4 },
              { id: 'evento-06-ladron-bicicletas-1', slug: 'ladron-bicicletas-1', titulo: '06. Ladrón de bicicletas 1', subtitulo: 'Little Bighorn Avenue · Rancho', categoria: 'eventos-aleatorios', badge: 'Bolsa / Dinero', tiempoLecturaMinutos: 4 },
              { id: 'evento-07-ladron-bicicletas-2', slug: 'ladron-bicicletas-2', titulo: '07. Ladrón de bicicletas 2', subtitulo: 'Bridge Street · Hawick', categoria: 'eventos-aleatorios', badge: 'Habilidad', tiempoLecturaMinutos: 3 },
              { id: 'evento-08-patrulla-fronteriza-1', slug: 'patrulla-fronteriza-1', titulo: '08. Patrulla fronteriza 1', subtitulo: 'Mount Haan Road · Gran Desierto de Señora', categoria: 'eventos-aleatorios', badge: 'Emboscada', tiempoLecturaMinutos: 3 },
              { id: 'evento-09-patrulla-fronteriza-2', slug: 'patrulla-fronteriza-2', titulo: '09. Patrulla fronteriza 2', subtitulo: 'Montañas Tataviam', categoria: 'eventos-aleatorios', badge: 'Emboscada', tiempoLecturaMinutos: 3 },
              { id: 'evento-10-patrulla-fronteriza-3', slug: 'patrulla-fronteriza-3', titulo: '10. Patrulla fronteriza 3', subtitulo: 'Raton Canyon', categoria: 'eventos-aleatorios', badge: 'Emboscada', tiempoLecturaMinutos: 3 },
              { id: 'evento-11-entierro-vivo', slug: 'entierro-vivo', titulo: '11. Entierro en Paleto Bay', subtitulo: 'North Point · Paleto Bay', categoria: 'eventos-aleatorios', badge: 'Rescate / $60k', tiempoLecturaMinutos: 5 },
              { id: 'evento-12-autobus-turistico', slug: 'autobus-turistico', titulo: '12. Autobús turístico', subtitulo: 'Alta Street · Downtown Vinewood', categoria: 'eventos-aleatorios', badge: 'Paseo', tiempoLecturaMinutos: 3 },
              { id: 'evento-13-robo-coche-1', slug: 'robo-coche-1', titulo: '13. Robo de coche 1 (Peyote)', subtitulo: 'Great Ocean Highway · North Chumash', categoria: 'eventos-aleatorios', badge: 'Vehículo Único', tiempoLecturaMinutos: 4 },
              { id: 'evento-14-robo-coche-2', slug: 'robo-coche-2', titulo: '14. Robo de coche 2 (Rocoto)', subtitulo: 'Exceptionalists Way · Aeropuerto LSIA', categoria: 'eventos-aleatorios', badge: 'Recompensa Traje', tiempoLecturaMinutos: 4 },
              { id: 'evento-15-persecucion-ladrones-ciudad-1', slug: 'persecucion-ladrones-ciudad-1', titulo: '15. Ladrones en Hawick (The Lost)', subtitulo: 'Hawick Avenue · Hawick', categoria: 'eventos-aleatorios', badge: 'Tiroteo', tiempoLecturaMinutos: 4 },
              { id: 'evento-16-persecucion-ladrones-ciudad-2', slug: 'persecucion-ladrones-ciudad-2', titulo: '16. Ladrones en Textile City', subtitulo: 'San Andreas Avenue · Textile City', categoria: 'eventos-aleatorios', badge: 'Persecución', tiempoLecturaMinutos: 3 },
              { id: 'evento-17-persecucion-ladrones-campo-1', slug: 'persecucion-ladrones-campo-1', titulo: '17. Ladrones en Grapeseed', subtitulo: 'Grapeseed Main Street · Grapeseed', categoria: 'eventos-aleatorios', badge: 'Rural', tiempoLecturaMinutos: 3 },
              { id: 'evento-18-persecucion-ladrones-campo-2', slug: 'persecucion-ladrones-campo-2', titulo: '18. Ladrones en Ruta 68', subtitulo: 'Route 68 · Gran Desierto de Señora', categoria: 'eventos-aleatorios', badge: 'Desierto', tiempoLecturaMinutos: 3 },
              { id: 'evento-19-accidente-construccion', slug: 'accidente-construccion', titulo: '19. Accidente en la obra', subtitulo: 'Calais Avenue · Little Seoul', categoria: 'eventos-aleatorios', badge: 'Rescate / Tiempo', tiempoLecturaMinutos: 4 },
              { id: 'evento-20-tiroteo-alamo-sea', slug: 'tiroteo-alamo-sea', titulo: '20. Tiroteo en Alamo Sea', subtitulo: 'Marina Drive · Alamo Sea', categoria: 'eventos-aleatorios', badge: 'Michael / Franklin', tiempoLecturaMinutos: 4 },
              { id: 'evento-21-atraco-rural-harmony', slug: 'atraco-rural-harmony', titulo: '21. Robo en Harmony ($10.000)', subtitulo: 'Route 68 · Harmony', categoria: 'eventos-aleatorios', badge: 'Maletines / $10k', tiempoLecturaMinutos: 4 },
              { id: 'evento-22-rescate-accidente-taliana', slug: 'rescate-accidente-taliana', titulo: '22. Rescate de Taliana Martínez', subtitulo: 'Great Ocean Highway · Mount Chiliad', categoria: 'eventos-aleatorios', badge: 'Conductora Élite', tiempoLecturaMinutos: 5 },
              { id: 'evento-23-negocio-fallido-maletin', slug: 'negocio-fallido-maletin', titulo: '23. Negocio Fallido ($25.000)', subtitulo: 'Chiliad Wilderness · Great Ocean Highway', categoria: 'eventos-aleatorios', badge: 'Maletín / $25k', tiempoLecturaMinutos: 5 },
              { id: 'evento-24-discusion-domestica', slug: 'discusion-domestica', titulo: '24. Discusión doméstica (Castro)', subtitulo: 'Didion Drive · Vinewood Hills', categoria: 'eventos-aleatorios', badge: 'Golf / Altruistas', tiempoLecturaMinutos: 4 },
              { id: 'evento-25-granja-marihuana-trevor', slug: 'granja-marihuana-trevor', titulo: '25. Asalto a la Granja ($70.000)', subtitulo: 'Mount Chiliad · Blaine County', categoria: 'eventos-aleatorios', badge: 'Trevor / $70k', tiempoLecturaMinutos: 5 },
              { id: 'evento-26-conductor-ebrio-1', slug: 'conductor-ebrio-1', titulo: '26. Conductor ebrio 1', subtitulo: 'Aguja Street · La Puerta', categoria: 'eventos-aleatorios', badge: 'Altruistas / Baller', tiempoLecturaMinutos: 4 },
              { id: 'evento-27-conductor-ebrio-2', slug: 'conductor-ebrio-2', titulo: '27. Conductor ebrio 2', subtitulo: 'Armadillo Avenue · Sandy Shores', categoria: 'eventos-aleatorios', badge: 'Pareja / Altruistas', tiempoLecturaMinutos: 4 },
              { id: 'evento-28-huida-paparazzi-lacey', slug: 'huida-paparazzi-lacey', titulo: '28. Huida de los Paparazzi (Lacey)', subtitulo: 'Vinewood Boulevard · Downtown Vinewood', categoria: 'eventos-aleatorios', badge: 'Celebridad', tiempoLecturaMinutos: 5 },
              { id: 'evento-29-emboscada-callejon-pandilla', slug: 'emboscada-callejon-pandilla', titulo: '29. Emboscada en el callejón', subtitulo: 'El Rancho Boulevard · El Burro Heights', categoria: 'eventos-aleatorios', badge: 'Trampa Callejera', tiempoLecturaMinutos: 3 },
              { id: 'evento-30-conductor-fuga-packie', slug: 'conductor-fuga-packie', titulo: '30. Conductor de Fuga (Packie McReary)', subtitulo: 'Strawberry Avenue · Forum Drive', categoria: 'eventos-aleatorios', badge: 'Pistolero Élite', tiempoLecturaMinutos: 5 },
              { id: 'evento-31-autoestopista-1-tinkle', slug: 'autoestopista-1-tinkle', titulo: '31. Autoestopista 1 (Bolsa Tinkle)', subtitulo: 'Ineseno Road · Banham Canyon', categoria: 'eventos-aleatorios', badge: 'Bawsaq / +30%', tiempoLecturaMinutos: 4 },
              { id: 'evento-32-autoestopista-2-ursula', slug: 'autoestopista-2-ursula', titulo: '32. Autoestopista 2 (Ursula)', subtitulo: 'North Calafia Way · Monte Chiliad', categoria: 'eventos-aleatorios', badge: 'Contacto Especial', tiempoLecturaMinutos: 5 },
              { id: 'evento-33-autoestopista-3-novio', slug: 'autoestopista-3-novio', titulo: '33. Autoestopista 3 (Novio agresivo)', subtitulo: 'East Joshua Road · San Chianski', categoria: 'eventos-aleatorios', badge: 'Pelea Callejera', tiempoLecturaMinutos: 4 },
              { id: 'evento-34-autoestopista-4-novia-fuga', slug: 'autoestopista-4-novia-fuga', titulo: '34. Autoestopista 4 (Novia a la fuga)', subtitulo: 'Route 68 · Great Chaparral', categoria: 'eventos-aleatorios', badge: 'Huida de Boda', tiempoLecturaMinutos: 4 },
              { id: 'evento-35-chica-cebo-la-mesa', slug: 'chica-cebo-la-mesa', titulo: '35. Emboscada en La Mesa', subtitulo: 'Supply Street · La Mesa', categoria: 'eventos-aleatorios', badge: 'Trampa Callejera', tiempoLecturaMinutos: 3 },
              { id: 'evento-36-robo-transeunte-1', slug: 'robo-transeunte-1', titulo: '36. Robo a transeúnte 1', subtitulo: 'Strawberry Avenue · Chamberlain Hills', categoria: 'eventos-aleatorios', badge: 'Carterista', tiempoLecturaMinutos: 3 },
              { id: 'evento-37-robo-transeunte-2', slug: 'robo-transeunte-2', titulo: '37. Robo a transeúnte 2', subtitulo: 'Meteor Street · Hawick', categoria: 'eventos-aleatorios', badge: 'Rescate Callejero', tiempoLecturaMinutos: 3 },
              { id: 'evento-38-robo-transeunte-3', slug: 'robo-transeunte-3', titulo: '38. Robo a transeúnte 3 ($2.000)', subtitulo: 'Vespucci Boulevard · Pillbox Hill', categoria: 'eventos-aleatorios', badge: 'Maletín / $2k', tiempoLecturaMinutos: 4 },
              { id: 'evento-39-fuga-presidiario-1', slug: 'fuga-presidiario-1', titulo: '39. Fuga del presidiario 1', subtitulo: 'Norte de Bolingbroke · Desierto Señora', categoria: 'eventos-aleatorios', badge: 'Fuga Penitenciaria', tiempoLecturaMinutos: 4 },
              { id: 'evento-40-fuga-presidiario-2', slug: 'fuga-presidiario-2', titulo: '40. Fuga del presidiario 2', subtitulo: 'Sur de Bolingbroke · Desierto Señora', categoria: 'eventos-aleatorios', badge: 'Robo de Coche', tiempoLecturaMinutos: 3 },
              { id: 'evento-41-altruistas-rebeldes', slug: 'altruistas-rebeldes', titulo: '41. Altruistas rebeldes', subtitulo: 'Baytree Canyon Road · Desierto Señora', categoria: 'eventos-aleatorios', badge: 'Secta Altruista', tiempoLecturaMinutos: 4 },
              { id: 'evento-42-furgon-blindado-1', slug: 'furgon-blindado-1', titulo: '42. Furgón blindado 1 (La Puerta)', subtitulo: 'Innocence Boulevard · La Puerta', categoria: 'eventos-aleatorios', badge: 'Gruppe Sechs', tiempoLecturaMinutos: 4 },
              { id: 'evento-43-furgon-blindado-2', slug: 'furgon-blindado-2', titulo: '43. Furgón blindado 2 (Little Seoul)', subtitulo: 'Vespucci Boulevard · Little Seoul', categoria: 'eventos-aleatorios', badge: 'Gruppe Sechs', tiempoLecturaMinutos: 4 },
              { id: 'evento-44-furgon-blindado-3', slug: 'furgon-blindado-3', titulo: '44. Furgón blindado 3 (Paleto Bay)', subtitulo: 'Paleto Boulevard · Paleto Bay', categoria: 'eventos-aleatorios', badge: 'Gruppe Sechs', tiempoLecturaMinutos: 4 },
              { id: 'evento-45-furgon-blindado-4', slug: 'furgon-blindado-4', titulo: '45. Furgón blindado 4 (Adam\'s Apple)', subtitulo: 'Adam\'s Apple Boulevard · Little Seoul', categoria: 'eventos-aleatorios', badge: 'Gruppe Sechs', tiempoLecturaMinutos: 4 },
              { id: 'evento-46-furgon-blindado-5', slug: 'furgon-blindado-5', titulo: '46. Furgón blindado 5 (Vespucci)', subtitulo: 'Prosperity Street · Canales de Vespucci', categoria: 'eventos-aleatorios', badge: 'Gruppe Sechs', tiempoLecturaMinutos: 4 },
              { id: 'evento-47-furgon-blindado-6', slug: 'furgon-blindado-6', titulo: '47. Furgón blindado 6 (Little Seoul)', subtitulo: 'San Andreas Avenue · Little Seoul', categoria: 'eventos-aleatorios', badge: 'Gruppe Sechs', tiempoLecturaMinutos: 4 },
              { id: 'evento-48-furgon-blindado-7', slug: 'furgon-blindado-7', titulo: '48. Furgón blindado 7 (San Chianski)', subtitulo: 'Chianski Passage · San Chianski', categoria: 'eventos-aleatorios', badge: 'Gruppe Sechs', tiempoLecturaMinutos: 4 },
              { id: 'evento-49-furgon-blindado-8', slug: 'furgon-blindado-8', titulo: '49. Furgón blindado 8 (Tongva Hills)', subtitulo: 'Great Ocean Highway · Tongva Hills', categoria: 'eventos-aleatorios', badge: 'Gruppe Sechs', tiempoLecturaMinutos: 4 },
              { id: 'evento-50-furgon-blindado-9', slug: 'furgon-blindado-9', titulo: '50. Furgón blindado 9 (Cypress Flats)', subtitulo: 'El Rancho Boulevard · Cypress Flats', categoria: 'eventos-aleatorios', badge: 'Gruppe Sechs', tiempoLecturaMinutos: 4 },
              { id: 'evento-51-furgon-blindado-10', slug: 'furgon-blindado-10', titulo: '51. Furgón blindado 10 (La Mesa)', subtitulo: 'Supply Street · La Mesa', categoria: 'eventos-aleatorios', badge: 'Gruppe Sechs', tiempoLecturaMinutos: 4 },
              { id: 'evento-52-atraco-tienda-bob-mulet', slug: 'atraco-tienda-bob-mulet', titulo: '52. Atraco en Bob Mulet ($2.000)', subtitulo: 'Eastbourne Way · Rockford Hills', categoria: 'eventos-aleatorios', badge: 'Robo a Comercio', tiempoLecturaMinutos: 4 },
              { id: 'evento-53-atraco-tienda-suburban', slug: 'atraco-tienda-suburban', titulo: '53. Atraco en SubUrban (Del Perro)', subtitulo: 'Prosperity Street Promenade · Del Perro', categoria: 'eventos-aleatorios', badge: 'Descuento 25%', tiempoLecturaMinutos: 4 },
              { id: 'evento-54-encuentro-simeon-yetarian', slug: 'encuentro-simeon-yetarian', titulo: '54. Venganza contra Simeon', subtitulo: 'Power Street · Strawberry', categoria: 'eventos-aleatorios', badge: 'Concesionario', tiempoLecturaMinutos: 4 },
              { id: 'evento-55-secuestro-the-lost-snatched', slug: 'secuestro-the-lost-snatched', titulo: '55. Rehén de The Lost (Snatched)', subtitulo: 'South Mo Milton Drive · Vinewood Hills', categoria: 'eventos-aleatorios', badge: 'Rescate / Altruistas', tiempoLecturaMinutos: 4 },
              { id: 'evento-56-robo-moto-deportiva', slug: 'robo-moto-deportiva', titulo: '56. Robo de moto deportiva (Bati 801)', subtitulo: 'North Rockford Drive · Richman', categoria: 'eventos-aleatorios', badge: 'Bati 801 / +5 Conducción', tiempoLecturaMinutos: 4 },
              { id: 'evento-57-padrino-en-calzoncillos', slug: 'padrino-en-calzoncillos', titulo: '57. Despedida de soltero (Stag Do)', subtitulo: 'Ruta 68 · Great Chaparral', categoria: 'eventos-aleatorios', badge: 'Enus Super Diamond', tiempoLecturaMinutos: 4 },
              { id: 'evento-58-duelo-duke-o-death', slug: 'duelo-duke-o-death', titulo: '58. Duelo: Imponte Duke O\'Death', subtitulo: 'Ruta 68 · Grand Senora Desert', categoria: 'eventos-aleatorios', badge: 'Muscle Blindado', tiempoLecturaMinutos: 4 },
              { id: 'evento-59-hidroavion-dodo', slug: 'hidroavion-dodo', titulo: '59. Hidroavión Dodo (Cueva Marina)', subtitulo: 'Cueva Marina · Costa Este (San Chianski)', categoria: 'eventos-aleatorios', badge: 'Hidroavión Dodo', tiempoLecturaMinutos: 4 },
              { id: 'evento-60-mosaicos-del-mono', slug: 'mosaicos-del-mono', titulo: '60. Mosaicos del Mono (Space Monkey)', subtitulo: 'Los Santos Customs · Burton', categoria: 'eventos-aleatorios', badge: 'Go Go Space Monkey Blista', tiempoLecturaMinutos: 5 }
            ]
          },
          {
            id: 'secretos-misterios',
            titulo: 'Misterios',
            icono: 'eye',
            descripcion: 'El misterio de Mount Chiliad, los 4 OVNIs y el asesino de los 8 infinitos.',
            orden: 5,
            articulos: [
              { id: 'ghost_jolene_cranley', slug: 'ghost-jolene-cranley', titulo: 'El Fantasma de Jolene Cranley-Evans', subtitulo: 'Pico oriental del Monte Gordo · Monte Gordo', categoria: 'secretos-misterios', badge: 'Paranormal', tiempoLecturaMinutos: 5 },
              { id: 'underwater_lost_hatch', slug: 'underwater-lost-hatch', titulo: 'La Escotilla Submarina Secreta (Lost)', subtitulo: 'Lecho marino de la Costa Este · Océano Pacífico', categoria: 'secretos-misterios', badge: 'Easter Egg', tiempoLecturaMinutos: 5 },
              { id: 'tunnel_heartbeat_mystery', slug: 'tunnel-heartbeat-mystery', titulo: 'El Latido de los Túneles Subterráneos', subtitulo: 'Bifurcación de Cloacas bajo Pillbox Hill · Los Santos', categoria: 'secretos-misterios', badge: 'Paranormal', tiempoLecturaMinutos: 5 },
              { id: 'mount_chiliad_mural_ufo', slug: 'mount-chiliad-mural-ufo', titulo: 'El Mural del Monte Chiliad (El OVNI del 100%)', subtitulo: 'Estación Superior del Teleférico · Cumbre del Monte Chiliad', categoria: 'secretos-misterios', badge: 'Conspiración', tiempoLecturaMinutos: 5 },
              { id: 'thelma_and_louise_cliff', slug: 'thelma-and-louise-cliff', titulo: 'Thelma y Louise (El Salto al Vacío)', subtitulo: 'Acantilado de Raton Canyon · Chiliad Wilderness', categoria: 'secretos-misterios', badge: 'Easter Egg', tiempoLecturaMinutos: 5 },
              { id: 'infinity_killer_merle', slug: 'infinity-killer-merle', titulo: 'El Asesino del Infinito 8 (Merle Abrahams)', subtitulo: 'Sandy Shores, Prisión y Cuerpos sumergidos en Paleto', categoria: 'secretos-misterios', badge: 'Crímenes', tiempoLecturaMinutos: 5 },
              { id: 'nothing_here_strawberry', slug: 'nothing-here-strawberry', titulo: '\'Turn Back\' y \'Nothing Here\' (Strawberry)', subtitulo: 'Paso inferior de la Olympic Freeway · Strawberry', categoria: 'secretos-misterios', badge: 'Easter Egg', tiempoLecturaMinutos: 5 },
              { id: 'fridgit_snowman', slug: 'fridgit-snowman', titulo: 'El Muñeco de Nieve de Fridgit (La Mesa)', subtitulo: 'Almacén Fridgit Cold Storage · La Mesa', categoria: 'secretos-misterios', badge: 'Easter Egg', tiempoLecturaMinutos: 5 },
              { id: 'yellow_jack_blood_footprints', slug: 'yellow-jack-blood-footprints', titulo: 'Las Huellas de Sangre del Yellow Jack Inn', subtitulo: 'Route 68 · Grand Senora Desert', categoria: 'secretos-misterios', badge: 'Paranormal', tiempoLecturaMinutos: 5 },
              { id: 'greyfriars_bobby_dog', slug: 'greyfriars-bobby-dog', titulo: 'El Perro de Greyfriars (Homenaje a Bobby)', subtitulo: 'Cementerio de Pacific Bluffs · Los Santos', categoria: 'secretos-misterios', badge: 'Homenaje', tiempoLecturaMinutos: 5 },
              { id: 'ufos_100_percent_story', slug: 'ufos-100-percent-story', titulo: 'Los OVNIs del 100% (La Tríada Secreta)', subtitulo: 'Fort Zancudo, Sandy Shores y Mount Chiliad', categoria: 'secretos-misterios', badge: 'Conspiración', tiempoLecturaMinutos: 5 },
              { id: 'sasquatch_predator_story', slug: 'sasquatch-predator-story', titulo: 'El Bigfoot en \'Depredador\'', subtitulo: 'Raton Canyon / Bosques de Cassidy Creek', categoria: 'secretos-misterios', badge: 'Criptozoología', tiempoLecturaMinutos: 5 }
            ]
          },
          {
            id: 'trofeos',
            titulo: 'Trofeos',
            icono: 'trophy',
            descripcion: 'Listado de trofeos y logros de GTA V: Platino, Oro, Plata y Bronce.',
            orden: 6,
            articulos: []
          }
        ]
      };
    } else {
      return {
        id: 'gta6',
        juego: 'Grand Theft Auto VI',
        titulo: 'Guía GTA VI & Base de Datos',
        descripcion: 'Compendio interactivo de Vice City y el Estado de Leonida: protagonistas, distritos, mecánicas de sigilo e inventario y análisis criminal.',
        bannerUrl: 'assets/home-bg.jpg',
        secciones: [
          {
            id: 'prologo',
            titulo: 'Prólogo',
            icono: 'book-open',
            descripcion: 'Introducción al Estado de Leonida, Vice City y perfiles de los protagonistas.',
            orden: 0,
            articulos: [
              { id: 'prologo-introduccion-gta6', slug: 'introduccion-guia-gta6', titulo: 'Introducción a la Guía & Estado de Leonida', subtitulo: 'Estructura de la enciclopedia, análisis del mapa y primeros pasos en Vice City', categoria: 'prologo', badge: 'Introducción', tiempoLecturaMinutos: 4 },
              { id: 'jason-lucia-dinamica', slug: 'jason-lucia-dinamica', titulo: 'Jason y Lucia: El Dúo Criminal', subtitulo: 'Mecánicas cooperativas, confianza y robos a mano armada en Leonida', categoria: 'prologo', badge: 'Dúo', tiempoLecturaMinutos: 6 },
              { id: 'lucia-caminos-perfil', slug: 'lucia-caminos-perfil', titulo: 'Lucia Caminos: Perfil y Trasfondo', subtitulo: 'El Centro Correccional de Leonida, grillete electrónico y motivaciones', categoria: 'prologo', badge: 'Lucia', tiempoLecturaMinutos: 5 },
              { id: 'jason-duval-perfil', slug: 'jason-duval-perfil', titulo: 'Jason Duval: Perfil y Especialidades', subtitulo: 'Pasado militar, contactos clandestinos y sincronización de combate', categoria: 'prologo', badge: 'Jason', tiempoLecturaMinutos: 5 }
            ]
          },
          /* Secciones retiradas del índice, pendientes de moverse a Noticias:

            //
            //
            //
            //
            //
              // empty
// 2
// 3
            //
          //
          {
            id: 'mundo-leonida',
            titulo: 'Vice City & Regiones de Leonida',
            icono: 'map-pin',
            descripcion: 'Guía geográfica de Vice City, Port Gellhorn, Ambrosia y los Cayos de Gellhorn.',
            orden: 1,
            articulos: [
              { id: 'mapa-leonida-zonas', slug: 'mapa-leonida-zonas', titulo: 'Las Regiones del Estado de Leonida', subtitulo: 'Vice City, Port Gellhorn, Ambrosia, Leonard County y los Cayos', categoria: 'mundo-leonida', badge: 'Geografía', tiempoLecturaMinutos: 8 },
              { id: 'vice-city-distritos', slug: 'vice-city-distritos', titulo: 'Distritos Urbanos de Vice City', subtitulo: 'Vice Beaches, Ocean Drive, Downtown, Little Haiti y Starfish Island', categoria: 'mundo-leonida', badge: 'Distritos', tiempoLecturaMinutos: 6 },
              { id: 'humedales-pantanos-fauna', slug: 'humedales-pantanos-fauna', titulo: 'Grassrivers y Fauna Salvaje', subtitulo: 'Los pantanos de Leonida, caimanes agresivos, caza y lanchas hidrodeslizadoras', categoria: 'mundo-leonida', badge: 'Ecosistema', tiempoLecturaMinutos: 5 }
            ]
          },
          {
            id: 'mecanicas-jugabilidad',
            titulo: 'Mecánicas & Físicas de Juego',
            icono: 'cpu',
            descripcion: 'Inventario físico limitado, maleteros de vehículos y balística de última generación.',
            orden: 2,
            articulos: [
              { id: 'inventario-maletero-armas', slug: 'inventario-maletero-armas', titulo: 'Sistema de Inventario Realista y Maleteros', subtitulo: 'Límite de armas portables y equipamiento vehicular estilo RDR2', categoria: 'mecanicas-jugabilidad', badge: 'Mecánicas', tiempoLecturaMinutos: 6 },
              { id: 'fisicas-vehiculos-personalizacion', slug: 'fisicas-vehiculos-personalizacion', titulo: 'Física de Vehículos, Tracción e Interiores', subtitulo: 'Ajuste de espejos retrovisores, pedales y comportamiento todoterreno', categoria: 'mecanicas-jugabilidad', badge: 'Vehículos', tiempoLecturaMinutos: 5 }
            ]
          },
          {
            id: 'ia-sistema-policial',
            titulo: 'Fuerzas del Orden & Redes Sociales',
            icono: 'shield',
            descripcion: 'Comportamiento policial avanzado, reconocimiento facial y viralidad digital.',
            orden: 3,
            articulos: [
              { id: 'redes-sociales-policia', slug: 'redes-sociales-policia', titulo: 'Redes Sociales y Sistema Policial Inteligente', subtitulo: 'Grabaciones de testigos, reconocimiento facial y cámaras de tráfico', categoria: 'ia-sistema-policial', badge: 'IA Policial', tiempoLecturaMinutos: 6 },
              { id: 'patrullas-persecucion-tactica', slug: 'patrullas-persecucion-tactica', titulo: 'Tácticas de Contención y Persecución', subtitulo: 'Bandas de clavos, helicópteros nocturnos con focos y cercos perimetrales', categoria: 'ia-sistema-policial', badge: 'Tácticas', tiempoLecturaMinutos: 5 }
            ]
          */
        ]
      };
    }
  }

  private getFallbackArticulo(juegoId: 'gta5' | 'gta6', articuloId: string): GuiaArticulo {
    const manifest = this.getFallbackManifest(juegoId);
    for (const sec of manifest.secciones) {
      const found = sec.articulos.find(a => a.id === articuloId || a.slug === articuloId);
      if (found) {
        const siblings = sec.articulos.filter(a => a.id !== found.id);
        const related = siblings.length >= 2
          ? siblings.slice(0, 2)
          : manifest.secciones.flatMap(s => s.articulos).filter(a => a.id !== found.id).slice(0, 2);

        return {
          ...found,
          tags: ['Guía', sec.titulo, juegoId === 'gta5' ? 'Los Santos' : 'Vice City'],
          relacionados: related,
          ultimaActualizacion: new Date().toISOString(),
          contenidoMarkdown: this.getArticuloMarkdown(articuloId)
        };
      }
    }

    // Default fallback
    return {
      id: 'requisitos-100',
      slug: 'requisitos-100',
      titulo: 'Requisitos para el 100% en GTA V',
      subtitulo: 'Todo lo estrictamente necesario para desbloquear la estadística del 100% y el logro Carrera Delictiva',
      categoria: 'historia-100',
      badge: 'Imprescindible',
      tiempoLecturaMinutos: 6,
      tags: ['100%', 'Logros', 'Misiones', 'Coleccionables', 'Trofeos'],
      ultimaActualizacion: new Date().toISOString(),
      relacionados: [],
      contenidoMarkdown: this.getArticuloMarkdown('requisitos-100')
    };
  }

  private getArticuloMarkdown(articuloId: string): string {
    switch (articuloId) {
      // duplicate case removed
      // Bienvenido a la Guía de GTA VI y Estado de Leonida\n\nBienvenido a la enciclopedia interactiva y base de datos oficial de Grand Theft Auto VI. Esta guía recopila toda la información documentada, análisis geográfico de Vice City y el Estado de Leonida, mecánicas de inventario realista y dinámicas de los protagonistas Jason y Lucia.\n\n---\n\n### 🗺️ Estructura de la Base de Datos\nLa enciclopedia se organiza en módulos de análisis especializado:\n\n* **Prólogo**: Introducción general y primeros pasos en Leonida.\n* **Protagonistas & Trama Criminal**: Análisis táctico de Jason y Lucia, mecánicas de cooperación y antecedentes penitenciarios.\n* **Vice City & Regiones de Leonida**: Distritos urbanos, zonas pantanosas de Grassrivers, playas de Vice Beaches y flora/fauna autóctona.\n* **Mecánicas & Físicas de Juego**: Sistema de inventario físico en maleteros, interacción ambiental y balística de última generación.\n* **Fuerzas del Orden & Redes Sociales**: IA policial inteligente, viralidad in-game y tácticas de persecución.
      default:
        return `Información detallada del capítulo en preparación.`;
    }
  }
}




