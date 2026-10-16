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
      // Logic to determine which JSON to load
      const isExtranos = articuloId.startsWith('eyl-');
      const isMisterio = ['ghost_jolene', 'underwater_', 'tunnel_', 'mount_chiliad', 'thelma_', 'infinity_', 'nothing_here', 'fridgit_', 'yellow_jack', 'greyfriars_', 'ufos_', 'sasquatch_'].some(prefix => articuloId.startsWith(prefix)) || articuloId.includes('misterio') || articuloId.includes('chiliad') || articuloId.includes('cranley');
      const jsonUrl = isExtranos 
          ? 'assets/data/gta5/guia/extranos-locos.json?t=' + new Date().getTime()
          : isMisterio
          ? 'assets/data/gta5/guia/secretos-misterios.json?t=' + new Date().getTime()
          : 'assets/data/gta5/guia/guia-misiones-historia.json?t=' + new Date().getTime();
          
      return this.http.get<GuiaArticulo[]>(jsonUrl).pipe(
        map(misiones => {
          const found = misiones.find(m => m.id === articuloId || m.slug === articuloId);
          if (found) {
            const siblings = misiones.filter(m => m.id !== found.id);
            return {
              ...found,
              tags: ['Misión', 'Historia', 'GTA V', found.badge || 'Los Santos'],
              relacionados: siblings.slice(0, 2).map(m => ({ id: m.id, titulo: m.titulo, slug: m.slug })),
              ultimaActualizacion: new Date().toISOString()
            } as GuiaArticulo;
          }
          return this.getFallbackArticulo(juegoId, articuloId);
        }),
        catchError(() => of(this.getFallbackArticulo(juegoId, articuloId)))
      );
    }
    
    return of(this.getFallbackArticulo(juegoId, articuloId));
  }

  /**
   * Obtiene los artículos narrativos del prólogo de la guía de GTA Online.
   */
  getOnlinePrologoArticulos(): Observable<GuiaArticulo[]> {
    const jsonUrl = 'assets/data/gta5/guia/guia-online-prologo.json?t=' + new Date().getTime();
    return this.http.get<GuiaArticulo[]>(jsonUrl).pipe(
      catchError(() => of([]))
    );
  }

  /**
   * Obtiene el catálogo de trofeos de GTA V (listado real en español).
   */
  getTrofeos(juegoId: 'gta5' | 'gta6'): Observable<TrofeosCatalogo> {
    if (juegoId === 'gta5') {
      const jsonUrl = 'assets/data/gta5/guia/trofeos.json?t=' + new Date().getTime();
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
              { id: 'evento-25-granja-marihuana-trevor', slug: 'granja-marihuana-trevor', titulo: '25. Asalto a la Granja ($70.000)', subtitulo: 'Mount Chiliad · Blaine County', categoria: 'eventos-aleatorios', badge: 'Trevor / $70k', tiempoLecturaMinutos: 5 }
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
      case 'prologo-introduccion-guia':
        return `## 📖 Bienvenido a Los Santos, donde las promesas mueren rápido.\n\nLos Santos no es un lugar para gente honrada; es una ciudad levantada sobre promesas vacías, créditos imposibles y aspiraciones desmedidas. Esta guía es tu hoja de ruta para moverte por San Andreas, donde la diferencia entre triunfar y acabar en el depósito de cadáveres suele depender de quién conduce más rápido y quién dispara primero.\n\n### 👥 Tres Protagonistas: Tres Formas de Meterse en Problemas\n\n**Franklin Clinton** quiere algo más. Acostumbrado a moverse por las calles de Los Santos, aspira a dejar atrás una vida que parece tener preparado para él un futuro demasiado pequeño. Tiene ambición, instinto y ganas de progresar, aunque las oportunidades que se le presentan no siempre vienen de la mano de las personas más recomendables.\n\n---\n\n**Michael De Santa** parece haber conseguido lo que muchos persiguen: una buena casa, dinero y una vida acomodada en las colinas de Los Santos. Sin embargo, detrás de esa aparente tranquilidad se esconde una familia disfuncional, un pasado que no termina de desaparecer y una insatisfacción que ni el mejor vecindario puede disimular. Hay quien sueña con retirarse. Michael es la prueba de que retirarse y encontrar la paz son dos cosas muy distintas.\n\n---\n\n**Trevor Philips**, por su parte, vive según unas normas que probablemente no sobrevivirían a una reunión de vecinos. Impulsivo, violento e imprevisible, es capaz de convertir una situación corriente en un problema de dimensiones considerables. Pero reducirlo a su temperamento sería quedarse en la superficie: Trevor tiene su propia idea de la lealtad, de la amistad y de cómo deben hacerse las cosas. Que esas ideas resulten tranquilizadoras para el resto de la humanidad es otro asunto.\n\n---\n\nTres hombres, tres circunstancias y tres maneras de entender el mundo. Sus caminos se cruzarán en una historia marcada por las ambiciones, los viejos asuntos pendientes, las lealtades puestas a prueba y unas decisiones cuyas consecuencias rara vez se quedan donde deberían.\n\n---\n\n### 🎬 La Historia Comienza Aquí\n\nEl modo historia de GTA V te invita a recorrer San Andreas a través de estos tres protagonistas, cada uno con su personalidad, sus relaciones y sus propios problemas. A medida que avances, descubrirás sus historias, conocerás a quienes forman parte de sus vidas y te verás envuelto en situaciones que irán mucho más allá de un simple encargo.\n\n---\n\nY cuando no estés siguiendo el hilo principal, la ciudad seguirá ahí. Sus carreteras, sus barrios, sus paisajes y sus secretos no desaparecen porque tengas una misión pendiente. Siempre habrá algo que descubrir, un lugar al que regresar o una decisión que quizá habría sido mejor pensar dos veces.\n\n---\n\nEsta guía te acompañará durante ese recorrido: desde los primeros pasos de la historia hasta sus momentos más importantes, con información sobre los protagonistas, las misiones y los lugares que hacen de San Andreas mucho más que un escenario.`;
      case 'requisitos-100':
        return `## 🏆 Resumen de Requisitos para el 100%

Para alcanzar el 100% en la pestaña de Estadísticas de GTA V no necesitas hacer absolutamente todas las misiones secundarias del juego, sino cumplir la siguiente lista de verificación de Rockstar Games:

---

### 1. Misiones Principales de Campaña (69 misiones)
* Superar las **69 misiones de la historia principal**, incluyendo todos los golpes planificados desde el Prólogo en North Yankton hasta el desenlace de la trama.
* La elección del plan táctico (Sigilo o Fuerza bruta) o el final escogido no impiden alcanzar el 100%.

---

### 2. Extraños y Locos (20 de 58 misiones)
Solamente cuentan las misiones de **Franklin Clinton**, ya que Michael y Trevor tienen misiones opcionales que no bloquean el trofeo:
* **Tonya**: Las 5 misiones de remolque de grúa en Los Santos.
* **Beverly**: Todas las misiones de paparazzi y persecución de celebridades.
* **Hao**: La carrera urbana inicial que desbloquea las competiciones nocturnas.
* **Barry**: Las misiones de legalización exclusivas de Franklin.
* **Mary-Ann**: La carrera de triatlón y persecución a pie con Franklin.
* **Dom**: Los 4 desafíos de salto en paracaídas extremo.
* **Omega**: Reunir las 50 piezas de la nave espacial (desbloquea el vehículo Space Docker).
* **Dreyfuss**: Reunir los 50 fragmentos de carta y resolver el asesinato de Leonora Johnson.

---

### 3. Pasatiempos y Aficiones (42 actividades)
* **Golf**: Ganar un partido de 9 hoyos quedando al par o bajo par.
* **Tenis**: Ganar un set completo contra la IA o un amigo.
* **Dardos**: Ganar una partida completa en el bar de Yellow Jack Inn o Los Santos.
* **Triatlones**: Completar los 3 triatlones (incluyendo el gran Triatlón del Lago Zancudo).
* **Galería de Tiro**: Superar todos los desafíos de tiro con al menos medalla de bronce en cada tipo de arma.
* **Escuela de Vuelo**: Superar las 12 pruebas de la Escuela de Vuelo de Los Santos International.
* **Carreras Urbanas**: Ganar las 5 carreras nocturnas en coche.
* **Carreras Todoterreno**: Ganar las 6 carreras todoterreno por el desierto y las montañas.
* **Carreras Marítimas**: Ganar las 4 carreras de lanchas.
* **Club de Striptease**: Conseguir un baile privado con una bailarina.
* **Paracaidismo**: Superar todos los saltos base y desde helicóptero de la ciudad.

---

### 4. Eventos Aleatorios (14 eventos)
* Presenciar y resolver con éxito al menos **14 de los 57 eventos aleatorios** repartidos por Los Santos y el Condado de Blaine (como robos a transeúntes, ladrones de cajeros automáticos o autostopistas).

---

### 5. Varios y Exploración (16 actividades)
* Comprar al menos **5 propiedades** que generen ingresos semanales.
* Comprar un vehículo a través de Internet en el teléfono móvil (Eyefind).
* Recoger las **50 partes de la nave espacial**.
* Recoger las **50 cartas del misterio de Leonora Johnson**.
* Realizar **25 de los 50 Saltos Acrobáticos únicos**.
* Realizar **8 de los 15 Vuelos Bajo el Puente**.
* Realizar **8 de los 15 Vuelos a Cuchillo** entre los rascacielos del centro.
* Ir al cine a ver una película completa.
* Salir a pasear y lanzar la pelota con **Chop** usando a Franklin.`;

      case 'golpes-principales':
        return `## 💰 Guía Táctica de los 6 Grandes Golpes

Los Golpes son el núcleo de la historia de GTA V. Cada uno te permite elegir entre dos enfoques tácticos y contratar a miembros de apoyo (Pistoleros, Conductores y Hackers).

> **Consejo Clave de Tripulación**: Los miembros novatos ganan habilidad en cada golpe sin pedir más porcentaje. Contratar novatos con bajo porcentaje inicial maximiza tus ganancias en los golpes finales.

---

### 1. El Golpe a la Joyería Vangelico
* **Enfoque Recomendado**: **Plan A (Sigilo)**. Usar gas BZ a través de los conductos de ventilación te da más tiempo en la tienda sin enfrentarte de inmediato a la policía.
* **Hacker**: **Rickie Lukens** (4% de comisión tras ayudarle en Lifeinvader). Te da 3 minutos y 30 segundos, suficiente para vaciar todas las vitrinas.
* **Conductor**: **Karim Denz** (8%). Elige las motos Bagger; aunque se equivoque en los túneles del río Los Santos, no perderás botín.
* **Pistolero**: **Packie McReary** (12%, desbloqueable en evento aleatorio en Strawberry) o **Norm Richards** (7%).

---

### 2. El Golpe a Merryweather
* **Enfoque**: **Plan A (Cargobob / Alta mar)** o **Plan B (Submarino / Carguero)**.
* **Botín Neto**: **$0** (Lester descubre que el superarma es propiedad del gobierno de EE.UU. y debe ser devuelta para evitar la persecución federal).

---

### 3. El Golpe de Paleto Bay
* **Enfoque**: Ataque frontal con trajes blindados de Juggernaut y ametralladoras rotatorias Minigun.
* **Pistolero**: **Chef** (12%) o **Packie McReary** (12%). Mantendrán a raya a los SWAT sin morir ni perder dinero de la bolsa.
* **Botín Bruto**: ~$8.000.000 (disminuye cada vez que la policía dispara a tu espalda).

---

### 4. El Asalto a los Laboratorios Humane
* **Objetivo**: Recuperar la toxina neuroparalizante para Steve Haines y Dave Norton.
* **Preparación**: Conseguir el gas neurotóxico y escapar a través de los respiraderos subacuáticos con escafandras.

---

### 5. El Asalto al Edificio del FIB
* **Enfoque Recomendado**: **Plan B (Entrada por el techo / Paracaidismo)**. Evitas disfrazarte de bomberos y el tiroteo es mucho más directo y limpio.
* **Hacker**: **Rickie Lukens** (4%) para apagar los cortafuegos rápidamente.

---

### 6. El Gran Golpe (Union Depository)
* **Enfoque Recomendado**: **Plan A (Sutil / Tráfico)** o **Plan B (Perforadora frontal)**.
* **Conductor 1**: **Karim Denz** (8%) si ya ha participado en golpes anteriores y tiene su habilidad al máximo.
* **Conductor 2**: **Taliana Martinez** (5%, rescatable en la autovía del norte de Sandy Shores). Es la mejor conductora del juego y solo pide un 5%.
* **Botín Máximo**: Alrededor de **$201.600.000 en lingotes de oro** (~$35.000.000 netos para cada protagonista).`;

      case 'finales-opcion-abc':
        return `## 🎭 Los Tres Finales: Opción A, B o C

Al finalizar la misión del Gran Golpe, Franklin Clinton recibe la visita de Devin Weston y Steve Haines, obligándole a tomar una decisión irrevocable sobre su lealtad:

---

### Opción A: Matar a Trevor (Sensatez)
* Franklin persigue a Trevor hasta los tanques de petróleo de El Burro Heights. Michael interviene embistiendo la furgoneta de Trevor contra un tanque de combustible.
* Trevor muere envuelto en llamas. Franklin y Michael se distancian para siempre. Pierdes a Trevor y todo su dinero.

---

### Opción B: Matar a Michael (El Momento Ha Llegado)
* Franklin cita a Michael en los límites de la ciudad. Tras una persecución por una central eléctrica, Michael cuelga de una torre metálica.
* Michael muere tras caer al vacío. Trevor corta cualquier relación con Franklin repudiándolo como un traidor. Pierdes a Michael y su fortuna.

---

### Opción C: La Tercera Vía (El Final Canónico)
* Franklin busca a Lester para idear un plan: unir a los tres protagonistas en una fundición abandonada para tender una emboscada tanto a los agentes de Merryweather como a los del FIB.
* **Las Ejecuciones Coordinadas**:
  * Trevor viaja a Del Perro Pier y asesina a **Steve Haines** mientras rueda su programa en la noria.
  * Michael se infiltra en Chumash y elimina a **Stretch**.
  * Franklin embosca a la tríada china y elimina a **Wei Cheng** en Pacific Bluffs.
  * Los tres capturan a **Devin Weston** en su mansión, lo encierran en el maletero de su propio coche y lo empujan por el acantilado hacia el Océano Pacífico.
* **Consecuencias**: Los tres protagonistas sobreviven, conservan sus botines del Gran Golpe y siguen disponibles para jugar en Los Santos.`;

      case 'michael-de-santa':
        return `## 🕶️ Michael De Santa

### 🌆 El sueño americano, con antecedentes penales

Hay personas que pasan media vida intentando escapar de su pasado. **Michael De Santa** consiguió cambiarse el apellido, mudarse a una de las zonas más exclusivas de Los Santos y comprarse una mansión con piscina. Sobre el papel, parece que la operación fue todo un éxito. El pequeño inconveniente es que cambiar de identidad resulta bastante más sencillo que cambiar de persona.

Antes de convertirse en el acomodado residente de Rockford Hills que conocemos al comienzo de GTA V, Michael era Michael Townley: un delincuente profesional con experiencia en atracos, un temperamento complicado y una trayectoria que no figuraba precisamente entre los modelos de conducta recomendados para los jóvenes.

Su vida actual es el resultado de una decisión radical: abandonar el mundo criminal y empezar de nuevo. O, al menos, intentar convencer a todo el mundo —incluido él mismo— de que eso es lo que ha hecho.

---

### 🏈 De los campos de fútbol a los atracos

La infancia de Michael estuvo lejos de los privilegios que más tarde ofrecería a sus propios hijos. Creció en un entorno humilde, marcado por los problemas familiares y por una relación difícil con su padre, al que las referencias del juego describen como alcohólico y abusivo. No tuvo una vida especialmente fácil y, desde joven, pareció encontrar más dificultades para construir un futuro estable que para meterse en problemas.

Durante su adolescencia destacó jugando al fútbol americano. Llegó a ser quarterback de un equipo de nivel estatal y tuvo posibilidades de imaginarse un futuro lejos de los márgenes de la sociedad. Sin embargo, las lesiones y sus problemas de temperamento acabaron frustrando esas aspiraciones.

El deporte no terminó convirtiéndose en la carrera que había imaginado. La delincuencia, en cambio, sí le ofreció una trayectoria profesional bastante más duradera.

Michael comenzó a acumular experiencia en el mundo criminal y terminó convirtiéndose en un ladrón de bancos competente, con buena puntería y capacidad para organizar operaciones complejas. No era simplemente alguien dispuesto a empuñar un arma: también sabía planificar, evaluar riesgos y trabajar con otros delincuentes.

Entre esas relaciones destacó la que mantuvo con Trevor Philips. Juntos participaron en distintos golpes y desarrollaron una asociación que iba mucho más allá de compartir un trabajo. Había confianza, historia y una familiaridad peligrosa, de esas que solo se construyen cuando varias personas han tenido que depender unas de otras en situaciones en las que equivocarse puede costarles la vida.

Pero Michael empezó a contemplar una posibilidad que no encajaba demasiado bien con aquella existencia: dejarlo todo atrás.

---

### 🎬 Amanda, Jimmy y Tracey: una familia de película

En algún momento de su trayectoria criminal, Michael conoció a Amanda, que trabajaba como bailarina en un club. La relación evolucionó hasta convertirse en matrimonio y ambos formaron una familia con sus dos hijos, Jimmy y Tracey.

Michael quería algo distinto para ellos. No deseaba que crecieran en las mismas circunstancias que él, entre precariedad, delincuencia y la incertidumbre de no saber qué vendría después. Quería ofrecerles seguridad, estabilidad y oportunidades. En otras palabras, quería darles aquello que sentía que le había faltado durante su propia infancia.

La ironía es que, años después, terminaría viviendo en una mansión de lujo mientras contemplaba cómo su familia parecía empeñada en convertir aquella aspiración en un experimento social bastante cuestionable.

Amanda tiene sus propios intereses, sus frustraciones y una relación cada vez más complicada con su marido. El dinero, las compras, las infidelidades y las discusiones forman parte de una convivencia en la que las apariencias importan casi tanto como los problemas que intentan ocultar.

Jimmy, su hijo, pasa buena parte de su tiempo entre los videojuegos y una actitud que no ayuda precisamente a mejorar la relación con su padre. Michael considera que el muchacho desperdicia sus oportunidades; Jimmy, por su parte, no parece especialmente interesado en aceptar lecciones de vida de un hombre cuyo currículum incluye atracos y delitos violentos.

Tracey, su hija, persigue la fama y sueña con abrirse camino en el mundo del espectáculo. Sus aspiraciones la llevan a situaciones que preocupan a Michael, aunque sus intentos por protegerla no siempre resultan especialmente eficaces.

La familia De Santa es, en definitiva, un retrato exagerado pero reconocible de una sociedad obsesionada con el dinero, el éxito y la imagen pública. Todos quieren algo, todos tienen sus defectos y casi todos parecen convencidos de que el principal problema de la casa es otra persona.

Michael tampoco queda fuera de esa ecuación. Su carácter, su egocentrismo, sus infidelidades y su tendencia a imponer sus propias expectativas contribuyen al deterioro de la convivencia. No basta con pagar una buena casa y llenar la nevera para convertirse en el padre del año. Aunque, viendo algunas de sus discusiones familiares, quizá tampoco baste con tener razón.

---

### 🍸 Rockford Hills: la recompensa que no termina de funcionar

Cuando comienza GTA V, Michael vive en una mansión de Rockford Hills, rodeado de comodidades y con una situación económica que muchos considerarían envidiable.

Ha conseguido escapar de su antigua vida, al menos en apariencia. Tiene una casa espectacular, una piscina, coches y tiempo libre. No necesita levantarse cada mañana para fichar en una oficina ni preocuparse por llegar a fin de mes.

Y, sin embargo, está profundamente insatisfecho.

Michael pasa buena parte de sus días entre el alcohol, la televisión, las películas de acción y las discusiones domésticas. La vida que imaginaba como recompensa por abandonar la delincuencia se ha convertido en una rutina que le resulta asfixiante.

Aquí aparece una de las contradicciones más interesantes del personaje. Michael quería dejar atrás el peligro, pero también echa de menos la intensidad de su antigua vida. Quería estar presente para su familia, pero no siempre sabe cómo relacionarse con ella. Quería tranquilidad, aunque parece incapaz de disfrutarla cuando finalmente la tiene.

Es como si hubiera pasado tantos años preparándose para escapar que nunca se hubiera detenido a pensar qué iba a hacer una vez que lo consiguiera.

Y Los Santos, una ciudad que vende el éxito como si fuera un producto de lujo, resulta el escenario perfecto para esa crisis. Michael vive rodeado de los símbolos de una vida triunfadora, pero ninguno parece proporcionarle la satisfacción que esperaba.

---

### 🛋️ El hombre que va al psicólogo

Una de las características más singulares de Michael es su relación con el doctor Isiah Friedlander, el psicólogo al que acude para tratar sus problemas personales.

Las sesiones ofrecen algunos de los momentos más reveladores del personaje. Michael habla de su familia, de su frustración y de su incapacidad para encontrar sentido a la vida que ha construido. Tiene facilidad para identificar los defectos de los demás, pero bastante menos para examinar los suyos sin recurrir a una justificación.

Friedlander, por su parte, tampoco queda retratado como un profesional infalible. Su consulta y la relación que mantiene con Michael sirven para introducir una sátira sobre la terapia, el dinero y la industria que convierte las dificultades personales en un servicio de pago.

Michael puede pasar una sesión entera hablando de lo miserable que se siente y salir de allí sin haber resuelto gran cosa. Eso sí, la factura de la consulta probablemente llegará a tiempo.

Bajo el humor hay algo más importante: Michael sabe que su vida no funciona, pero reconocerlo no significa que esté dispuesto a cambiar las decisiones que lo han llevado hasta allí. Tiene explicaciones para casi todo y una notable capacidad para encontrar culpables. Lo que no tiene tan claro es qué hacer consigo mismo.

---

### 🤝 Trevor Philips: el pasado que no se quedó atrás

La relación entre Michael y Trevor es una de las piezas fundamentales de GTA V.

Ambos compartieron una larga trayectoria criminal y participaron en atracos que consolidaron su reputación. Trevor es impulsivo, imprevisible y mucho más difícil de contener; Michael es calculador, manipulador y, al menos en apariencia, más consciente de las consecuencias.

Sin embargo, esa diferencia de carácter nunca impidió que trabajaran juntos. Entre ellos existía una relación construida a base de experiencias compartidas, lealtades y una familiaridad que podía resultar tan valiosa como peligrosa.

El problema es que Michael empezó a desear una vida diferente. Formar una familia y buscar una salida al mundo criminal cambió sus prioridades, pero también lo llevó a tomar decisiones que tendrían consecuencias duraderas.

El pasado de ambos quedó marcado por los acontecimientos de Ludendorff, en North Yankton. Lo ocurrido allí es una pieza esencial para entender la historia de Michael, sus secretos y la relación que mantiene con Trevor.

No se trata únicamente de dos antiguos compañeros que vuelven a encontrarse. Se trata de dos hombres que recuerdan de manera muy distinta una historia que compartieron y que todavía no han terminado de resolver.

Para Michael, empezar de nuevo significaba dejar atrás una parte de su vida. Para Trevor, algunas cosas no se olvidan tan fácilmente. Y cuando sus caminos vuelven a cruzarse, queda claro que cambiar de ciudad y de apellido no garantiza que las cuentas pendientes desaparezcan.

---

### 🎭 Michael Townley frente a Michael De Santa

En el fondo, Michael vive dividido entre dos identidades.

Michael Townley representa el pasado: el delincuente que encontró en los atracos una forma de ganarse la vida y que terminó tomando una decisión que alteró su relación con las personas más cercanas.

Michael De Santa representa el intento de empezar de nuevo: el marido, el padre y el propietario de una mansión que debería simbolizar que todo ha salido bien.

El problema es que ambas versiones pertenecen al mismo hombre.

Michael no puede borrar sus decisiones anteriores simplemente porque ahora tenga una piscina. Tampoco puede resolver sus problemas familiares tratándolos como si fueran una molestia que interrumpe la película que había imaginado para su vida.

A medida que avanza la historia, las circunstancias lo obligan a enfrentarse a las consecuencias de su pasado y a reconsiderar qué significa realmente haber conseguido una segunda oportunidad.

Porque Michael puede ser inteligente, tener experiencia y saber desenvolverse en situaciones peligrosas. Lo que no siempre sabe es cómo dejar de complicarse la vida cuando, por una vez, nadie le está apuntando con un arma.

Y esa es quizá la gran paradoja de Michael De Santa: sobrevivió a una carrera criminal, consiguió escapar de ella y alcanzó el sueño de vivir rodeado de comodidades. Ahora tiene que descubrir por qué, después de todo eso, sigue sin sentirse en paz.

En Los Santos, incluso el sueño americano puede convertirse en una pesadilla. Sobre todo cuando el hombre que intenta disfrutarlo es incapaz de dejar de ser quien era.`;

      case 'franklin-clinton':
        return `## 🚗 Franklin Clinton

### Un tipo que quiere llegar a alguna parte

**Franklin Clinton** nació en 1988 en South Los Santos, una ciudad que vende oportunidades en sus anuncios y ofrece una interpretación bastante más complicada de ellas cuando uno se cría lejos de las mansiones de Vinewood Hills.

Su infancia estuvo marcada por la ausencia de su padre y la pérdida temprana de su madre. Después de vivir con sus abuelos, acabó en la casa de su tía Denise, en Strawberry. Allí creció rodeado de un entorno en el que las bandas, los pequeños delitos y la búsqueda de dinero rápido formaban parte del paisaje cotidiano.

Franklin no nació con un plan maestro para convertirse en un delincuente profesional. Su trayectoria fue tomando forma entre malas decisiones, malas influencias y un entorno en el que salir adelante podía significar muchas cosas, aunque no todas condujeran al mismo sitio. La ciudad estaba llena de gente que aspiraba a mejorar su vida; algunos querían triunfar en los negocios, otros hacerse famosos y otros simplemente conseguir dinero suficiente para dejar de preocuparse por el siguiente recibo. Franklin quería algo más que sobrevivir, aunque todavía no tuviera muy claro cómo conseguirlo.

---

### 🤝 Lamar Davis: la amistad y otros obstáculos para progresar

En su juventud, Franklin se hizo amigo de Lamar Davis. Ambos compartieron barrio, experiencias y una trayectoria ligada a las bandas callejeras. También compartieron esa clase de confianza que permite decirle a un amigo exactamente lo que uno piensa de él, incluso cuando nadie ha preguntado.

Franklin y Lamar no son tan distintos como a veces parece, pero existe una diferencia importante entre ellos. Lamar se siente cómodo dentro de su mundo y conserva un entusiasmo considerable por sus códigos, sus rivalidades y sus posibilidades. Franklin, en cambio, empieza a mirar alrededor y a preguntarse si aquello es realmente todo lo que le espera.

No es que Franklin se haya convertido de pronto en un ejemplo de prudencia. Sigue metido en asuntos turbios, tiene paciencia limitada para las tonterías y no parece especialmente interesado en ganarse el reconocimiento de un comité de buenas costumbres. Pero comienza a distinguir entre ganarse la vida y pasarse la vida repitiendo los mismos errores.

Lamar, por su parte, tiene una habilidad extraordinaria para convertir cualquier conversación en una demostración de confianza personal. A veces esa seguridad resulta útil; otras, uno empieza a sospechar que la diferencia entre ambos no está en quién tiene mejores ideas, sino en quién se da cuenta antes de que una idea es terrible.

Su amistad será una de las relaciones más importantes de Franklin. También una de las pruebas más constantes de que cambiar de vida puede ser difícil cuando tus viejos amigos consideran que cualquier decisión sensata es una oportunidad para recordarte que te estás volviendo aburrido.

---

### 🚦 La calle no es una salida profesional

Antes de que comience la historia de *Grand Theft Auto V*, Franklin ya ha acumulado suficientes problemas como para comprender que la vida criminal tiene sus inconvenientes. Su paso por el instituto termina con su expulsión tras agredir a un profesor. Más adelante se implica en delitos y actividades relacionadas con las bandas de Los Santos.

No hace falta adornar demasiado su historial: Franklin no es un santo incomprendido. Ha tomado decisiones que lo han metido en problemas y ha participado voluntariamente en un entorno peligroso. Pero tampoco es alguien que encuentre una satisfacción especial en quedarse atrapado para siempre en la misma posición.

La calle le ha enseñado a conducir, a desenvolverse en situaciones complicadas y a reconocer cuándo alguien está intentando aprovecharse de él. Son habilidades que, en otro contexto, podrían haberle abierto puertas bastante más respetables. En Los Santos, sin embargo, la orientación profesional parece consistir en conocer a la persona adecuada y esperar que no termine debiéndote dinero.

Franklin empieza a cansarse de esa dinámica. Quiere progresar, ganar dinero y acceder a una vida que no dependa constantemente de quién controla una esquina o de quién tiene un problema con quién. El inconveniente es que abandonar una forma de vida no resulta tan sencillo como anunciarlo. Especialmente cuando las alternativas disponibles tampoco destacan por su estabilidad.

---

### 💔 Tanisha: querer cambiar no siempre llega a tiempo

Tanisha Jackson fue una persona importante en la vida de Franklin. Su relación se deterioró por la vinculación de él con el mundo criminal y por las consecuencias que esa vida podía tener para quienes permanecían cerca. La muerte del hermano de Tanisha, relacionada con la violencia de las bandas, contribuyó a distanciarlos.

Tanisha representa una posibilidad que Franklin no consiguió conservar: la de construir una vida alejada de la calle. No significa que ella tenga todas las respuestas ni que Franklin pueda resolver sus problemas simplemente siguiendo sus consejos. Significa que alguien que lo conoce de verdad ve los riesgos de su camino y no está dispuesta a fingir que todo saldrá bien.

Franklin quiere avanzar, pero todavía está aprendiendo que las buenas intenciones no borran las decisiones anteriores. Tampoco obligan a los demás a esperar indefinidamente mientras uno decide qué quiere hacer con su vida.

En una ciudad donde todo el mundo promete reinventarse, Franklin empieza a descubrir que cambiar de rumbo exige algo más que desear un destino distinto.

---

### 🚘 Simeon Yetarian: un empleo honrado, más o menos

Cuando comienza *Grand Theft Auto V*, Franklin trabaja junto a Lamar para Simeon Yetarian, propietario de Premium Deluxe Motorsport. Su cometido consiste en recuperar vehículos de clientes que no han cumplido con los pagos acordados.

Sobre el papel, parece un empleo bastante convencional. Hay un jefe, un horario más o menos reconocible y una tarea concreta. Incluso podría dar la impresión de que Franklin ha encontrado una manera de encauzar su experiencia hacia algo parecido a un trabajo estable.

Luego uno recuerda que el negocio de Simeon consiste en vender coches mediante acuerdos financieros abusivos y que sus empleados tienen que ir a buscarlos cuando las cosas salen como cabía esperar. La actividad comercial tiene su encanto: primero se convence a alguien de que puede permitirse un vehículo y después se envía a Franklin a comprobar personalmente hasta qué punto era cierta esa afirmación.

Simeon es un empresario de Los Santos en estado puro. Su talento consiste en presentar una operación dudosa como una oportunidad comercial y conseguir que los demás asuman los riesgos. Franklin y Lamar ponen el esfuerzo físico; Simeon pone el discurso de ventas. Cada uno aporta lo suyo.

Aun así, este trabajo deja claro que Franklin tiene capacidades que van más allá de la vida de pandillero. Es un conductor habilidoso, sabe reaccionar bajo presión y suele conservar más sentido común que buena parte de las personas que lo rodean. El problema es que, por ahora, esas cualidades están al servicio de un negocio que difícilmente aparecería en una feria de empleo.

---

### 💼 Michael De Santa: una oportunidad con antecedentes

El encuentro con Michael De Santa cambia la trayectoria de Franklin. Michael es mayor, tiene experiencia en grandes golpes y conoce un mundo criminal distinto al de los pequeños delitos callejeros. También tiene problemas personales, familiares y económicos que parecen haber sobrevivido a varias mudanzas y a una casa con piscina.

Franklin ve en él algo que no encuentra en Lamar ni en Simeon: una posible puerta de entrada a operaciones de mayor escala. Michael, por su parte, reconoce en Franklin a un joven capaz de conducir, aprender y mantener la cabeza relativamente fría cuando todo empieza a torcerse.

La relación entre ambos no se limita a la de un delincuente experimentado que enseña trucos a un principiante. Michael se convierte en una especie de mentor para Franklin, aunque el programa formativo incluya atracos, persecuciones y una alarmante ausencia de prácticas remuneradas en una oficina.

Franklin consigue acercarse a la vida que imaginaba, pero el camino que se abre ante él está lejos de ser limpio. La oportunidad llega de la mano de alguien que sabe ganar dinero con el crimen y que, pese a su experiencia, tampoco ha encontrado la fórmula para vivir tranquilo.

En Los Santos, subir de categoría no significa necesariamente abandonar los problemas. A veces solo significa que los problemas empiezan a conducir coches más caros.

---

### 🌅 Un futuro por decidir

Franklin Clinton es el protagonista que mira hacia delante. Michael está atrapado entre lo que consiguió y lo que perdió; Trevor parece decidido a convertir cualquier situación en una catástrofe memorable. Franklin, en cambio, todavía busca su lugar.

Tiene ambición, habilidad y una idea bastante clara de que la vida que lleva no puede ser el destino definitivo. Pero no es un héroe ejemplar que avanza sin mirar atrás. Arrastra su pasado, mantiene vínculos con personas que tiran de él en direcciones distintas y se mueve en una ciudad que vende el éxito como si bastara con desearlo lo suficiente.

Su historia plantea una pregunta sencilla: ¿puede alguien escapar de su entorno sin renegar por completo de quienes forman parte de él?

Franklin no necesita convertirse en otra persona para progresar, pero sí tendrá que decidir qué está dispuesto a dejar atrás y qué clase de hombre quiere ser cuando por fin tenga la oportunidad de elegir.

Porque en Los Santos todo el mundo quiere llegar a alguna parte. La diferencia está en que algunos tienen un plan, otros tienen un coche y unos cuantos creen que gritar más fuerte que los demás cuenta como estrategia.`;

      case 'trevor-philips':
        return `## Trevor Philips

### El sueño americano, pero con orden de alejamiento

Exmilitar. Atracador de bancos. Narcotraficante. Empresario. Amenaza para la convivencia. Y, contra todo pronóstico, uno de los pocos hombres de San Andreas que todavía se toma la palabra «lealtad» en serio.

Hay personas que necesitan tocar fondo para cambiar de vida. Trevor Philips necesita que alguien le indique dónde está el fondo, porque probablemente ya lo ha atravesado, ha robado algo durante el descenso y ha dejado un cadáver de recuerdo.

Trevor es de origen Canadiense, antiguo piloto militar y delincuente profesional, es un hombre capaz de convertir una conversación cotidiana en una amenaza de muerte y una discusión de bar en un incidente que requiera tres ambulancias, dos helicópteros y una rueda de prensa de la policía.

Vive en Sandy Shores, una localidad polvorienta del condado de Blaine donde el sol castiga, las oportunidades escasean y la distinción entre un vecino problemático y una amenaza para la seguridad nacional es, en el mejor de los casos, académica.

Trevor no es simplemente un loco con una pistola. Es un hombre inteligente, extraordinariamente peligroso, con talento para la improvisación, una capacidad aérea excepcional y un concepto de la diplomacia que consiste en comprobar cuánto tarda la otra persona en dejar de discutir.

Y, sin embargo, detrás de ese espectáculo de violencia, suciedad y decisiones espantosas, hay una historia bastante más humana de lo que él estaría dispuesto a admitir.

---

### 🧸 Una infancia que no venía con garantía

Trevor nació en Canadá, cerca de la frontera con Estados Unidos. Creció en un entorno familiar profundamente disfuncional, marcado por la violencia de su padre y el control emocional de su madre.

Su infancia fue una sucesión de hogares, desplazamientos, conflictos y experiencias que no aparecen en los folletos de turismo familiar. Según sus propios relatos, pasó por numerosas casas y centros de acogida, y tuvo una relación desastrosa con prácticamente cualquier figura de autoridad que se cruzó en su camino y desde muy joven mostró impulsos violentos y una dificultad monumental para controlar la ira.

¿Fue aquella infancia la causa de todo lo que vendría después? Sería tentador ofrecer una explicación psicológica elegante. Pero estamos hablando de Trevor, no de un caso práctico de una facultad de psicología.

También tuvo un hermano, Ryan, cuya muerte se menciona en el juego, aunque no se explica con claridad en qué circunstancias ocurrió.

---

### ✈️ El piloto que pudo ser… y que el ejército prefirió no tener

Antes de convertirse en un delincuente de carrera, Trevor tuvo una aspiración sorprendentemente convencional: quería volar.

Poseía un talento natural para pilotar aeronaves y llegó a ingresar en la Fuerza Aérea con la intención de convertirse en piloto militar. Por una vez, parecía haber encontrado una profesión en la que sus habilidades podían servir para algo legal.

El problema era Trevor.

Su comportamiento y su inestabilidad durante la evaluación psicológica acabaron con su carrera militar antes de que pudiera completar su formación como piloto de combate. El ejército examinó su perfil y llegó a una conclusión que, visto lo visto, cuesta discutir: poner a Trevor al mando de un avión militar no era la mejor de las ideas.

La aviación, eso sí, nunca desapareció de su vida. Trevor acabaría convirtiéndose en el piloto de confianza de su propia organización criminal. Porque si algo demuestra su trayectoria es que las habilidades profesionales siempre encuentran salida en el “mercado laboral”. 

Para Michael, el engaño era una operación calculada para proteger su futuro. Para Trevor, era una traición monumental.

Y si hay algo que Trevor no lleva bien, además de las normas, los insultos y que alguien le toque sus cosas, es descubrir que la persona a la que consideraba su hermano lo ha mantenido alejado de la verdad durante años.

La bomba estaba preparada. Solo faltaba que alguien encendiera la mecha.

---

### 🌵 Sandy Shores: un imperio construido sobre arena, metanfetamina y pésimas decisiones

Nueve años después del atraco de North Yankton, Trevor vive en Sandy Shores, en el condado de Blaine. Su residencia es una caravana destartalada que parece haber perdido una discusión contra el desierto y, posteriormente, contra su propio propietario.

Allí dirige Trevor Philips Enterprises, una empresa dedicada al tráfico de drogas y armas. El nombre tiene cierta elegancia corporativa: suena a multinacional respetable, aunque sus reuniones de negocios probablemente no superarían una inspección de Hacienda, una auditoría ética ni una visita sorpresa de absolutamente nadie.

Su equipo incluye a:

* **Ron Jakowski**: un hombre nervioso y paranoico que parece vivir permanentemente a tres segundos de sufrir un colapso.
* **Wade Hebert**: cuya inocencia y limitada capacidad para comprender lo que sucede a su alrededor lo convierten en un compañero especialmente vulnerable.
* **Chef**: que colabora en las actividades criminales de Trevor.

Trevor dirige este pequeño ecosistema con la sutileza de un huracán. Su modelo de negocio es sencillo: conseguir mercancía, intimidar a la competencia, resolver los conflictos y expandirse. El detalle, es que buena parte de esas operaciones, termina en tiroteos, incendios o destrucción de bienes ajenos.

---

### 💥 La ira de Trevor: cuando el autocontrol se declara en huelga

La ira de Trevor no es un simple rasgo de carácter. Es prácticamente su sistema operativo. Puede estar tranquilo, bromear o conversar con aparente normalidad, y pasar en cuestión de segundos a una violencia desproporcionada. También es extremadamente sensible a las burlas sobre su origen canadiense. Una característica que, en otra persona, podría producir una discusión sobre geografía, en Trevor puede convertirse en un incidente.`;

      case 'michael-trevor-franklin-intrahistoria':
        return `## Michael, Trevor y Franklin: tres caminos hacia el desastre

### Los Santos, 2013: el pasado vuelve a llamar a la puerta

Franklin Clinton es un joven de Los Santos que aspira a salir de una vida marcada por los trabajos de poca monta y las oportunidades que nunca terminan de llegar. Trabaja junto a Lamar Davis para Simeon Yetarian, un vendedor de coches cuya interpretación de la ética comercial deja bastante margen para la imaginación. Ambos se dedican a recuperar vehículos de clientes que no han pagado, un trabajo que les permite sobrevivir, pero que difícilmente va a llevarlos demasiado lejos.

Uno de esos encargos los conduce hasta el vehículo de Jimmy De Santa, el hijo de Michael. Lo que parecía otra recuperación rutinaria termina con Franklin descubriendo que Michael está escondido en el coche y apuntándole con un arma para obligarlo a conducir hasta el concesionario.

El encuentro no empieza precisamente con un apretón de manos, pero despierta el interés de Michael. Franklin demuestra que sabe desenvolverse bajo presión y que tiene más ambición que ganas de pasarse la vida haciendo recados para Simeon. Michael ve en él a alguien con potencial, un joven que todavía no ha encontrado una oportunidad a la altura de sus aspiraciones.

La relación entre ambos se afianza cuando Michael, tras un conflicto familiar, recurre a Franklin para resolver sus problemas. Más adelante, ambos terminan participando en el robo a una joyería que Michael organiza con ayuda de Lester Crest. El golpe sale adelante, aunque atrae una atención policial que difícilmente puede considerarse un beneficio añadido.

Y entonces sucede algo que Michael llevaba casi una década intentando evitar.

Trevor Philips ve las noticias sobre el atraco y reconoce a su antiguo compañero. Michael está vivo.

Desde el atraco de North Yankton, en 2004, Trevor había creído que Michael había muerto y que Brad Snider seguía en prisión. Ahora descubre que su amigo no solo sobrevivió, sino que ha construido una nueva vida en Los Santos, con una familia y una identidad que le han permitido mantener enterrado su pasado.

Para Trevor, el descubrimiento cambia las reglas del juego. No necesita una invitación formal ni una explicación por adelantado. Si Michael está vivo, ha llegado el momento de reencontrarse con él y averiguar qué ocurrió realmente aquella noche.

---

### Tres protagonistas, una cantidad preocupante de problemas

Con Trevor de vuelta en Los Santos, las vidas de los tres protagonistas comienzan a entrelazarse. Michael y Trevor vuelven a encontrarse después de años de separación, mientras Franklin pasa de ser un joven que busca oportunidades a convertirse en parte de operaciones mucho mayores.

Michael conoce el mundo de los grandes atracos y quiere mantener el control de su nueva vida, aunque sus propias decisiones lo empujan una y otra vez hacia el pasado del que pretende escapar. Trevor aporta experiencia, contactos y una capacidad extraordinaria para convertir cualquier contratiempo en una emergencia de proporciones estatales. Franklin, por su parte, aporta habilidad al volante, pragmatismo y una ambición que todavía le permite imaginar un futuro distinto.

La posibilidad de volver a participar juntos en grandes golpes representa para Trevor la oportunidad de recuperar al compañero con el que compartió su vida criminal. Para Michael, supone acercarse de nuevo a una vida que juró dejar atrás. Franklin, mientras tanto, ve la posibilidad de dar un salto económico que no se consigue rellenando solicitudes de empleo.

Sin embargo, volver a trabajar juntos no significa recuperar la confianza perdida. Entre Michael y Trevor existe una historia que ninguno de los dos puede borrar, y el reencuentro amenaza con sacar a la luz todo aquello que Michael lleva años intentando ocultar.

---

### La tumba de North Yankton: la verdad que nadie quería encontrar

El reencuentro con Michael no basta para cerrar las heridas del pasado. A medida que Trevor empieza a cuestionar lo ocurrido en North Yankton, la versión que ha aceptado durante casi una década se desmorona. Brad supuestamente sigue en prisión, pero Michael está vivo. Si las piezas no encajan, queda una pregunta inevitable: ¿qué ocurrió realmente durante aquel atraco?

Las dudas llevan a Trevor de vuelta a Ludendorff, donde se dirige al cementerio para abrir la tumba de Michael. Su antiguo compañero intenta disuadirlo, pero Trevor sigue adelante. Cuando el ataúd queda abierto, encuentra los restos de Brad en lugar de los de Michael.

La mentira queda al descubierto. Michael había llegado a un acuerdo secreto con Dave Norton para fingir su muerte y escapar de su antigua vida. Durante la emboscada de 2004, Brad murió al interponerse en la trayectoria de un disparo dirigido a Trevor. Después, su cuerpo fue enterrado bajo el nombre de Michael, mientras Trevor escapaba creyendo que su compañero había muerto y que Brad seguía en prisión.

Para Trevor, aquello no es un simple engaño. Es la confirmación de que el hombre al que consideraba su amigo y compañero lo abandonó mientras él vivía durante años con una versión falsa de los hechos. Su rabia no nace únicamente de la pérdida de Brad, sino también de descubrir que la lealtad que había depositado en Michael fue correspondida con una mentira cuidadosamente mantenida.

La verdad ha salido a la luz, pero eso no significa que las cosas vayan a arreglarse. Michael y Trevor siguen vivos, aunque su amistad atraviesa uno de sus momentos más frágiles. Franklin, que no participó en el engaño original, se encuentra ahora vinculado a las consecuencias de una traición que comenzó mucho antes de que conociera a Michael.

Lo que une a estos tres hombres no es una amistad perfecta, sino una historia compartida de ambición, engaños, lealtades y decisiones de las que resulta difícil salir indemne. En Los Santos, donde todo el mundo persigue el dinero, el poder o una segunda oportunidad, sobrevivir a los propios errores puede ser bastante más complicado que cometerlos.`;

      case 'asesinatos-lester-bolsa':
        return `## 📈 Inversión en Bolsa con las Misiones de Lester

Este es el método más lucrativo de todo el juego. Permite multiplicar el botín del último golpe y conseguir el máximo de dinero permitido por el motor del juego (**$2.147.483.647** por protagonista).

> **Regla de Oro**: Completa únicamente la primera misión de Lester (*El Asesinato en el Hotel*) porque es obligatoria para avanzar la historia. **Guarda las otras 4 misiones para DESPUÉS de completar el Gran Golpe final**, cuando cada personaje tenga ~$35.000.000 para invertir.

---

### 1. Misión: El Asesinato en el Hotel
* **Antes de la misión**: Invierte todo el dinero de los 3 personajes en **Betta Pharmaceuticals** (mercado BAWSAQ).
* **Después de la misión**: Espera unas 48 horas en el juego durmiendo sin guardar hasta que las acciones suban un **~50%**. Vende todo.
* **Paso siguiente**: Invierte de inmediato en **Bilkington** (LCN). Espera a que se recupere para ganar otro **~80%**.

---

### 2. Misión: El Asesinato Múltiple
* **Antes de la misión**: Invierte todo el dinero en **Debonaire** (LCN).
* **Después de la misión**: Espera a que Debonaire alcance un beneficio del **~80%**. Vende todo.
* **Paso siguiente**: Invierte inmediatamente todo el dinero en su competidora **Redwood** (LCN). Espera unas 72 horas en el juego hasta que Redwood rebote un espectacular **~300%**.

---

### 3. Misión: El Asesinato del Vicio
* **Antes de la misión**: Invierte todo el dinero en **Fruit** (BAWSAQ).
* **Después de la misión**: Vende cuando Fruit alcance un **~50%** de beneficio.
* **Paso siguiente**: Compra acciones de **Facade** (BAWSAQ) y vende al recuperarse un **~30%**.

---

### 4. Misión: El Asesinato del Autobús
* **Antes de la misión**: NO inviertas nada.
* **Después de la misión**: Espera a que **Vapid** (BAWSAQ) caiga en picado tras el asesinato. Compra todas las acciones posibles de Vapid y espera al rebote del **~100%**.

---

### 5. Misión: El Asesinato de la Obra
* **Antes de la misión**: Invierte todo en **GoldCoast** (LCN).
* **Después de la misión**: Vende cuando GoldCoast suba un **~80%**.`;

      case 'guia-negocios-propiedades':
        return `## 🏢 Guía de Negocios y Propiedades Comprables

Comprar propiedades en Los Santos te otorga fuentes regulares de ingresos semanales y beneficios pasivos indispensables.

---

### 1. Los Santos Customs (Desierto de Grand Senora)
* **Comprador Exclusivo**: **Franklin Clinton**.
* **Precio**: $349.000.
* **Beneficio Especial**: **Todas las modificaciones de vehículos son 100% GRATUITAS para Franklin de por vida** (blindaje, motores turbo, pintura, ruedas personalizadas).

---

### 2. Sonar Collections Dock (Paleto Cove)
* **Precio**: $250.000.
* **Beneficio**: Desbloquea la lancha Dinghy con equipo de buceo autónomo y el minisubmarino para recoger los 30 barriles de residuos nucleares en el fondo oceánico ($23.000 por barril + bonus de $250.000 al reunirlos todos).

---

### 3. Los Santos Golf Club (Richman)
* **Precio**: $150.000.000 (la propiedad más cara del juego).
* **Ingresos**: $264.500 semanales.
* **Beneficio**: Jugar gratis y jugar vestido con cualquier atuendo sin restricciones.`;

      case 'misterio-chiliad':
        return `## 🛸 El Gran Misterio de Mount Chiliad

En la estación superior del teleférico de Mount Chiliad se encuentra grabado en la pared el famoso **Mural de Chiliad**, mostrando una montaña piramidal con símbolos interconectados: un OVNI, un Huevo agrietado y un Humanoide volando con un Jetpack.

---

### 1. El OVNI de Mount Chiliad
* **Condiciones Exactas de Aparición**:
  1. Tener el **100% completado** en las estadísticas del juego.
  2. Subir al mirador de madera en la cima de Mount Chiliad.
  3. Debe ser exactamente las **03:00 AM**.
  4. El clima debe ser de **lluvia o tormenta con relámpagos** (puedes forzarlo con trucos de clima).
* Al cumplirse las 4 condiciones, un gigantesco OVNI holográfico con las siglas del FIB flota silenciosamente sobre la cima.

---

### 2. Los Otros 3 OVNIs del Mapa
* **OVNI de Fort Zancudo**: Flotando a altitud máxima sobre la base militar (muestra tecnología furtiva militar y emite un ensordecedor pulso electromagnético).
* **OVNI de Sandy Shores**: Flotando sobre el monumento hippie en el desierto con las letras 'FIB' rotuladas en el fuselaje.
* **OVNI Sumergido**: Un platillo volante estrellado en el lecho marino al norte de Procopio Beach, cubierto de algas y corales.`;

      case 'fantasma-monte-gordo':
        return `## 👻 El Fantasma de Jolene Cranley-Evans

Uno de los mitos paranormales más famosos de San Andreas se encuentra en la cima rocosa de **Mount Gordo**, al noreste del mapa.

---

### 1. Hora y Condiciones de Aparición
* Si acudes a la cima de Mount Gordo entre las **23:00 y las 00:00 de la medianoche en el juego**, verás flotando sobre una roca plana la figura etérea y pálida de una mujer con vestido blanco.
* Si te acercas demasiado, el espectro se desvanece en el aire, revelando sobre la roca un mensaje escrito con sangre fresca: **'JOCK'**.

---

### 2. La Verdad del Asesinato
* Jolene Cranley-Evans era la esposa de **Jock Cranley** (el famoso doble de acción y candidato a gobernador de San Andreas que aparece en los anuncios de televisión y radio).
* En 1978, Jock empujó a su esposa Jolene por el acantilado rocoso de Mount Gordo durante un paseo nocturno para evitar que interfiriera en sus aspiraciones de mudarse a Los Santos y triunfar como actor.`;

      case 'asesino-ocho-infinitos':
        return `## ♾️ El Asesino de los 8 Infinitos (Merle Abrahams)

El misterio del asesino en serie de Blaine County sigue el rastro de **Merle Abrahams**, conocido como el 'Asesino de los Infinitos', quien asesinó a 8 personas en 1999 motivado por su obsesión enfermiza con el número 8 y el símbolo del infinito.

---

### 1. Las Pistas en Paleto Bay
* En una casa abandonada y quemada en Paleto Bay se encuentra una pintada en la pared con un poema macabro:
> *'One is done, Two was fun, Three tried to run, Four called mom, Five's not alive, Six is nixes, Seven's in heaven, 8 won't wait.'*

---

### 2. La Celda en la Prisión de Bolingbroke
* En el patio de la penitenciaría de Bolingbroke, sobre una de las paredes de hormigón, Merle dejó grabada su última pista antes de morir en prisión:
> *'Where water meets land and jumping over the rocks, refuse will bring you to the 8.'*

---

### 3. Las Coordenadas de los 8 Cadáveres
* En el océano al norte de Paleto Bay, sumergidos a gran profundidad entre formaciones rocosas submarinas, se encuentran los **8 cuerpos envueltos en sábanas blancas y atados con cuerdas**.
* Para encontrarlos necesitas un submarino Kraken o el traje de buceo de la lancha Dinghy. Al descender a las fosas marinas, los restos de las 8 víctimas descansan en fila en el lecho oceánico.`;

      case 'lista-trucos-gta5':
        return `## ⚡ Todos los Trucos y Códigos de GTA 5

> **Aviso**: Activar trucos desactiva los Logros y Trofeos durante la sesión de juego actual.

---

### 1. Trucos de Supervivencia y Combate
* **Invencibilidad (5 minutos)**:
  * *Teléfono*: \`1-999-724-654-5537\` (\`PAINKILLER\`)
  * *PC*: \`PAINKILLER\`
  * *PlayStation*: \`Derecha, X, Derecha, Izquierda, Derecha, R1, Derecha, Izquierda, X, Triángulo\`
  * *Xbox*: \`Derecha, A, Derecha, Izquierda, Derecha, RB, Derecha, Izquierda, A, Y\`
* **Salud y Blindaje al Máximo**:
  * *Teléfono*: \`1-999-887-853\` (\`TURTLE\`)
  * *PC*: \`TURTLE\`
* **Todas las Armas y Munición**:
  * *Teléfono*: \`1-999-8665-87\` (\`TOOLUP\`)
  * *PC*: \`TOOLUP\`
* **Súper Salto**:
  * *Teléfono*: \`1-999-467-86-48\` (\`HOPTOIT\`)
  * *PC*: \`HOPTOIT\`
* **Caída Libre (Skyfall)**:
  * *Teléfono*: \`1-999-759-3255\` (\`SKYFALL\`)
  * *PC*: \`SKYFALL\`

---

### 2. Trucos de Vehículos
* **Helicóptero de Combate Buzzard**:
  * *Teléfono*: \`1-999-289-9633\` (\`BUZZOFF\`)
  * *PC*: \`BUZZOFF\`
* **Coche Deportivo Comet**:
  * *Teléfono*: \`1-999-266-38\` (\`COMET\`)
  * *PC*: \`COMET\`
* **Moto Sánchez (Motocross)**:
  * *Teléfono*: \`1-999-633-7623\` (\`OFFROAD\`)
  * *PC*: \`OFFROAD\``;

      /* ======================================================================
         CAPÍTULOS GTA VI (VICE CITY & ESTADO DE LEONIDA)
         ====================================================================== */
      case 'prologo-introduccion-gta6':
      case 'introduccion-guia-gta6':
        return `## 🌴 Introducción a la Guía & Estado de Leonida

Bienvenido a la enciclopedia interactiva y base de datos oficial de Grand Theft Auto VI. Esta guía compendia toda la información documentada sobre el Estado de Leonida, la metrópolis de Vice City y la trayectoria criminal de Lucia y Jason.

---

### 1. El Estado de Leonida
* **Vice City**: El corazón económico y turístico del estado costero. Rascacielos vanguardistas en Downtown, arena blanca en Vice Beaches y barrios marginales controlados por bandas locales.
* **Zonas Rurales y Humedales**: Leonard County, los extensos pantanos de Grassrivers y Port Gellhorn forman una red geográfica diversa con peligros naturales y oportunidades ilegales.

---

### 2. Estructura de la Enciclopedia
* **Prólogo**: Introducción geográfica, estado de Leonida y perfiles de los protagonistas Jason y Lucia.
* **Vice City & Regiones**: Guía distrito a distrito, ecosistemas y puntos de interés.
* **Mecánicas & Físicas**: Sistema de inventario realista en maleteros y físicas vehiculares.
* **Fuerzas del Orden**: Inteligencia policial, redes sociales y protocolos de contención.`;

      case 'jason-lucia-dinamica':
        return `## 👥 Jason y Lucia: El Dúo Criminal de Leonida

Inspirados en la mítica pareja criminal de Bonnie y Clyde, **Jason** y **Lucia** representan la primera dualidad romántica y delictiva coprotagonista en la historia de la saga Grand Theft Auto.

---

### 1. Sistema Dinámico de Pareja y Confianza
* **Mecánica de Sincronización**: A diferencia de GTA V donde los protagonistas operaban de forma independiente salvo en golpes planificados, Jason y Lucia operan habitualmente en equipo durante asaltos, huidas y exploración.
* **Comandos Tácticos en Asaltos**: Puedes indicar al compañero que intimide a los rehenes, vigile la puerta trasera, fuerce una caja fuerte o prepare el vehículo de escape mientras el otro recoge el botín en mostradores.
* **Sistema de Confianza Mutable**: La toma de decisiones en momentos críticos (como salvar al compañero de fuego policial o priorizar el dinero) altera diálogos, apoyo mutuo en tiroteos y dinámicas de refugio.

---

### 2. Transición y Cambio de Personaje
* **Cambio Instantáneo**: Durante situaciones conjuntas, el cambio de control entre Jason y Lucia es inmediato con un solo botón, permitiendo alternar entre el tirador que ofrece cobertura y el asaltante que avanza entre coberturas.
* **Habilidades Complementarias**: Mientras Lucia destaca en agilidad, infiltración a corta distancia y técnicas de desarme rápido, Jason aporta estabilidad en armas de fuego pesadas y destreza en conducción bajo persecución extrema.`;

      case 'lucia-caminos-perfil':
        return `## ⛓️ Lucia: Trasfondo Penitenciario y Habilidades

Lucia se presenta al inicio de la trama cumpliendo condena en el **Centro Correccional de Leonida (Leonida Department of Corrections)**, vistiendo el mono naranja de reclusa durante una sesión de libertad condicional con su supervisora.

---

### 1. El Grillete Electrónico y Progresión
* **Restricción Geográfica Inicial**: Los primeros compases de la historia presentan a Lucia con un grillete de geolocalización en el tobillo, limitando su área de movimiento a distritos específicos de Vice City antes de liberarse del control judicial.
* **Motivación y Deseo de Supervivencia**: Su lema ante la adversidad es contundente: *"La única forma de salir adelante es permaneciendo juntos"*, impulsando a Jason a asumir golpes de mayor escala en busca de una salida definitiva.

---

### 2. Atributos Tácticos de Lucia
* **Desarme y CQC (Close Quarters Combat)**: Capacidad para inmovilizar rápidamente a dependientes y guardias sin necesidad de abrir fuego letal, evitando alertar a las patrullas perimetrales.
* **Infiltración y Sigilo**: Pasos más silenciosos en superficies interiores, mayor velocidad al desplazarse agachada y capacidad para ocultarse en zonas de sombras y probadores durante registros policiales.`;

      case 'jason-duval-perfil':
        return `## 🎯 Jason: Especialista en Armas y Conducción

Jason es un hombre pragmático y reservado que busca abrirse camino en el submundo de Leonida tras años en entornos clandestinos y militares.

---

### 1. Trasfondo y Conexiones Clandestinas
* **Red de Contactos en Port Gellhorn**: Jason cuenta con contactos en talleres clandestinos, traficantes de armas y círculos de apuestas en el condado de Leonard, lo que le permite conseguir equipamiento y vehículos no registrados.
* **Relación con Lucia**: Actúa como el contrapeso reflexivo y táctico ante la impulsividad de Lucia, planificando vías de escape y evaluando el tiempo de respuesta de los coches patrulla de Vice Dale.

---

### 2. Especialidades en Combate y Volante
* **Control de Retroceso y Precisión**: Capacidad para estabilizar miras telescópicas de fusiles de precisión y ametralladoras ligeras con menor oscilación respiratoria.
* **Destreza Vehicular Todo Terreno**: Mayor tracción y recuperación de derrapes al maniobrar sobre arena de playa, fango pantanoso en Grassrivers y autopistas mojadas por tormentas tropicales.`;

      case 'mapa-leonida-zonas':
        return `## 🗺️ Las Regiones del Estado de Leonida

El estado de Leonida es la recreación más masiva y diversa jamás concebida para la franquicia, combinando la metrópolis neon de Vice City con extensas zonas rurales y pantanosas.

---

### 1. Vice City (Metrópolis Central)
* El epicentro económico, turístico y nocturno del estado. Dividido en grandes avenidas costeras, rascacielos financieros en Downtown, zonas residenciales de lujo en Starfish Island y barrios multiculturales como Little Haiti.

---

### 2. Port Gellhorn y Zonas Industriales
* Una ciudad portuaria e industrial en declive al oeste de Leonida. Caracterizada por gasolineras de carretera, naves de desguace, moteles de mala muerte y clubes de billar donde operan bandas locales de narcotráfico y contrabando.

---

### 3. Leonard County y Ambrosia
* Regiones rurales dominadas por plantaciones agrícolas, fábricas procesadoras de azúcar y pequeñas comunidades rurales donde la presencia policial es escasa y las leyes locales son dictadas por caciques locales.

---

### 4. Los Cayos (Gellhorn & Vice Keys)
* Cadena de islas paradisíacas unidas por puentes kilométricos sobre aguas turquesas. Zona ideal para yates de lujo, actividades de pesca deportiva y pistas de aterrizaje clandestinas para avionetas.`;

      case 'vice-city-distritos':
        return `## 🌴 Distritos Urbanos de Vice City

La legendaria ciudad del sol regresa con una densidad urbana sin precedentes, donde la arquitectura art déco coexiste con modernos complejos turísticos y rascacielos vanguardistas.

---

### 1. Vice Beaches & Ocean Drive
* El frente marítimo más icónico del mundo. Kilómetros de arena blanca, palmeras tropicales, bañistas, deportistas y hoteles de fachada pastel iluminados por tubos de neón rosa y azul al caer la noche.
* Zona de alto interés para robo de superdeportivos aparcados frente a locales de moda.

---

### 2. Downtown Vice City
* El centro corporativo y financiero. Hogar de entidades bancarias, bufetes de abogados y sedes de medios de comunicación. Cuenta con aparcamientos subterráneos de varias plantas ideales para despistar helicópteros policiales.

---

### 3. Little Haiti y Barrios Residenciales
* Calles estrechas, mercados callejeros y viviendas unifamiliares con patios traseros. Alta actividad de bandas locales que defienden su territorio frente a intrusos y patrullas de policía.`;

      case 'humedales-pantanos-fauna':
        return `## 🐊 Grassrivers y Fauna Salvaje

Los humedales de **Grassrivers** representan el corazón salvaje de Leonida, inspirados en los Everglades de Florida.

---

### 1. Navegación en Hidrodeslizadores (Airboats)
* Las aguas poco profundas y la densa vegetación de manglares impiden el paso de lanchas convencionales. Los hidrodeslizadores con motor de hélice gigante son el medio de transporte óptimo para surcar los canales pantanosos sin encallar.

---

### 2. Ecosistema Vivo y Caimanes Peligrosos
* **Fauna Hostil**: Caimanes de gran envergadura habitan las orillas de los manglares y atacarán tanto al jugador como a presas naturales si caes al agua o te aproximas en exceso.
* **Caza y Recursos**: Aves zancudas exóticas, jabalíes salvajes, serpientes venenosas y ciervos de cola blanca ofrecen oportunidades de caza y obtención de pieles valiosas en mercados locales.`;

      case 'inventario-maletero-armas':
        return `## 🎒 Sistema de Inventario Realista y Maleteros

GTA VI evoluciona el clásico 'arsenal infinito en el bolsillo' hacia un modelo físico verosímil y estratégico, similar a la gestión de armas a caballo vista en *Red Dead Redemption 2*.

---

### 1. Límite de Armamento Portable
* **Ranuras Limitadas**: El jugador solo puede portar visiblemente dos armas cortas (pistolas o revólveres en fundas) y hasta dos armas largas (un fusil de asalto o escopeta colgada a la espalda mediante correa táctica).
* **Bolsa de Lona para Botines**: Durante los atracos, llevar una bolsa de deporte colgada ocupa espacio de carga, limitando la agilidad para trepar muros o esprintar a velocidad máxima.

---

### 2. El Maletero Vehicular como Armero Móvil
* **Tu Coche como Base de Operaciones**: El maletero de tu coche personal almacena el arsenal completo (lanzacohetes, fusiles de francotirador, chalecos antibalas de repuesto y munición pesada).
* **Interacción Física**: Debes acercarte al maletero del vehículo, abrirlo manualmente y seleccionar qué armamento equipar antes de asaltar un objetivo o preparar una emboscada.`;

      case 'fisicas-vehiculos-personalizacion':
        return `## 🚗 Física de Vehículos, Tracción e Interiores

El motor físico de conducción ha sido rediseñado para reflejar con precisión la masa de cada vehículo, el estado de la suspensión y el tipo de terreno transitado.

---

### 1. Deformación Realista y Superficies Dinámicas
* **Efecto de la Lluvia y Clima Tropical**: Las tormentas repentinas de Leonida inundan badenes y crean capas de aquaplaning en el asfalto caliente, reduciendo drásticamente la capacidad de frenado de deportivos potentes.
* **Arena y Fango**: Neumáticos de asfalto patinarán al internarse en playas o humedales; equipar suspensión elevada y neumáticos todoterreno es imprescindible para internarse en Leonard County.

---

### 2. Cabinas e Interiores Interactivos
* **Ajuste y Visión Interior**: Cada panel de instrumentos es funcional, con velocímetros digitales interactivos, espejos retrovisores con reflejo en tiempo real y ajuste ergonómico de parasoles y guantera.`;

      case 'redes-sociales-policia':
        return `## 📱 Redes Sociales y Sistema Policial Inteligente

En el estado de Leonida, la presencia constante de teléfonos inteligentes y redes sociales cambia radicalmente las reglas de la persecución policial.

---

### 1. Ciudadanos Grabando en Redes Sociales
* **Testigos con Teléfonos Móviles**: Al cometer un delito menor o conducir a contramano, los transeúntes sacarán sus teléfonos para retransmitir en directo en redes sociales. Si no huyes rápidamente o confiscas el dispositivo, la policía recibirá alertas geolocalizadas con tu descripción física.
* **Viralidad Digital**: Actos de caos o persecuciones espectaculares aparecen en las pantallas publicitarias y plataformas de vídeo en streaming de la ciudad en cuestión de minutos.

---

### 2. Reconocimiento Facial y Cámaras de Tráfico
* Cometer atracos con el rostro descubierto facilita que los sistemas automáticos de seguridad reconozcan a Jason o Lucia al pasar frente a semáforos inteligentes, activando patrullas cercanas sin necesidad de una llamada al 911.`;

      case 'patrullas-persecucion-tactica':
        return `## 🚓 Tácticas de Contención y Persecución Policial

Las fuerzas del orden de Vice Dale, el Sheriff de Leonard County y la Policía Estatal de Leonida despliegan protocolos tácticos avanzados frente a amenazas armadas.

---

### 1. Despliegue Escalonado y Bloqueos Estratégicos
* **Cercos Perimetrales**: En lugar de aparecer mágicamente frente a ti, las unidades policiales coordinan cortes de carretera en puentes y avenidas principales, cerrando vías de escape con furgones pesados.
* **Bandas de Clavos (Spike Strips)**: Los agentes colocan bandas de pinchos ocultas tras curvas cerradas para reventar los neumáticos de vehículos fugitivos.

---

### 2. Rastreo Nocturno con Helicópteros
* Los helicópteros de la policía cuentan con potentes focos de iluminación infrarroja y megáfonos de aviso. Ocultarse bajo túneles, aparcamientos subterráneos o follaje denso en los pantanos es indispensable para romper la línea de visión del radar.`;

      case 'evento-01-vehiculo-abandonado-1':
        return `## 🚗 Vehículo Abandonado 1
Smoke Tree Road · Gran Desierto de Señora

---

### La Trampa del Táser en el Desierto

* **Ubicación:** Smoke Tree Road, en pleno Gran Desierto de Señora (cerca del aeródromo de Sandy Shores).
* **Desarrollo del Encuentro:** Divisarás una furgoneta Surfer aparentemente abandonada junto a una pista de tierra. Al acercarte a inspeccionarla, un asaltante emboscado surgirá por tu espalda y te disparará con una pistola de descargas (Táser). Si no reaccionas a tiempo, perderás el conocimiento y despertarás en ropa interior sobre las vías del tren con un convoy acercándose a toda velocidad.
* **Consejo Táctico:** Si juegas con **Trevor Philips**, activa de inmediato su habilidad especial de *Furia* en el instante en que oigas el disparo: anularás la parálisis del Táser, podrás abatir al agresor y quedarte con su arma eléctrica de forma anticipada antes de desbloquearla en Ammu-Nation.
* **Recompensa:** Pistola Táser (con Trevor) y la furgoneta Surfer.`;

      case 'evento-02-vehiculo-abandonado-2':
        return `## 🚐 Vehículo Abandonado 2
RON Alternates Wind Farm · Parque Eólico

---

### El Encuentro en el Parque Eólico

* **Ubicación:** Pistas de tierra del parque eólico RON Alternates Wind Farm.
* **Desarrollo del Encuentro:** Encontrarás una autocaravana Journey estacionada entre los aerogeneradores. Al aproximarte al vehículo, interrumpirás a dos tipos en pleno acto íntimo. Si te descubren, te acercas demasiado o golpeas la chapa de la caravana, saldrán enfurecidos en ropa interior empuñando armas de fuego para intentar eliminarte.
* **Consejo Táctico:** Este evento no cuenta con recompensa monetaria ni logros especiales vinculados. Prepárate para un tiroteo a corta distancia nada más aproximarte a la puerta de la autocaravana.
* **Recompensa:** Vehículo Journey y munición recuperada de los atacantes.`;

      case 'evento-03-detencion-policial-1':
        return `## 🚓 Detención Policial 1
Granja O'Neil · Grapeseed

---

### Persecución en Grapeseed

* **Ubicación:** Inmediaciones de la granja de los O'Neil, en Grapeseed.
* **Desarrollo del Encuentro:** Presenciarás a una patrulla policial persiguiendo a pie a un sospechoso por el arcén de la carretera rural. El juego te da libertad total para decidir tu bando moral: colaborar con la ley o favorecer al fugitivo.
* **Consejo Táctico:**
  * Si decides ayudar al agente, dispara al fugitivo directamente a las piernas (o golpéalo a baja velocidad con el morro del vehículo) para inmovilizarlo sin matarlo.
  * Si decides ayudar al prófugo abatiendo al agente de policía, el criminal te lo agradecerá al instante entregándote una gratificación económica antes de perderse campo a través.
* **Recompensa:** $250 en metálico y 2 estrellas de nivel de búsqueda si apoyas la fuga; sin recompensa monetaria si ayudas a la policía.`;

      case 'evento-04-detencion-policial-2':
        return `## 🚓 Detención Policial 2
Senora Freeway · Parque Eólico

---

### El Guardabosques de Senora Freeway

* **Ubicación:** Margen de la autopista Senora Freeway, a la altura del restaurante Rex's Diner (parque eólico).
* **Desarrollo del Encuentro:** Un guardabosques del parque estatal persigue a la carrera a un prófugo armado a orillas de la autovía. Al igual que en la detención de Grapeseed, puedes intervenir en favor del orden o de la delincuencia.
* **Consejo Táctico:** Si optas por el dinero fácil del fugitivo, prepárate con un coche rápido antes de abrir fuego contra la autoridad, ya que dos estrellas de nivel de búsqueda en autopista abierta atraerán patrullas de alta velocidad casi de inmediato.
* **Recompensa:** $250 en metálico y 2 estrellas de nivel de búsqueda si apoyas la fuga del sospechoso.`;

      case 'evento-05-atraco-cajero-automatico':
        return `## 🏧 Atraco en Cajero Automático
Cajeros automáticos · Varios puntos de San Andreas

---

### Intervención en el Cajero

* **Ubicación:** Diferentes cajeros automáticos (Fleeca y Maze Bank) repartidos por Los Santos y Blaine County.
* **Desarrollo del Encuentro:** Escucharás los gritos de un peatón indefenso mientras un carterista le arrebata el dinero recién retirado del cajero y escapa a toda prisa a pie o en scooter. Deberás perseguir al ladrón antes de que escape de tu radar visual.
* **Consejo Táctico:** Una vez neutralizado el delincuente, recoge el fajo de billetes del suelo. Tendrás dos alternativas:
  * **Devolver el botín a la víctima**: La víctima te agradecerá el gesto con el 10% del importe ($50 - $200) y tu barra de habilidad especial se rellenará al 100% de forma instantánea.
  * **Quedarte con la cartera**: Si prefieres el dinero, date a la fuga con el botín completo (entre $500 y $2.000 limpios).
* **Recompensa:** Entre $500 y $2.000 (si te quedas el dinero) o relleno total de habilidad especial y pequeña propina (si lo devuelves).`;

      case 'evento-06-ladron-bicicletas-1':
        return `## 🚲 Ladrón de Bicicletas 1
Little Bighorn Avenue · Rancho

---

### El Golpe de Suerte con Animal Ark

* **Ubicación:** Little Bighorn Avenue, en el barrio de Rancho (Sur de Los Santos).
* **Desarrollo del Encuentro:** Un delincuente roba la bicicleta a un ciudadano indefenso a plena luz del día. Persigue al caco a pie o embístelo con un vehículo para recuperar la bici y devolvérsela a su dueño original.
* **Consejo Táctico:** No ignores este evento bajo ningún concepto. Aunque parezca un recado callejero menor, el dueño de la bicicleta resulta ser un alto directivo empresarial. Días después de devolverle la bici, te enviará un correo electrónico de agradecimiento informándote de que ha puesto a tu nombre **$100.000 en acciones de la empresa Animal Ark** en la bolsa LCN.
* **Recompensa:** +3 de Resistencia (Stamina) instantánea y $100.000 en acciones bursátiles de Animal Ark diferidas por correo.`;

      case 'evento-07-ladron-bicicletas-2':
        return `## 🚲 Ladrón de Bicicletas 2
Bridge Street · Hawick

---

### Persecución en Hawick

* **Ubicación:** Bridge Street, en el céntrico distrito de Hawick.
* **Desarrollo del Encuentro:** Un peatón sufre el robo fulminante de su bicicleta en la acera. Persigue al ladrón esquivando el tráfico urbano, recupérala y entrégasela a la víctima.
* **Consejo Táctico:** Si decides quedarte con la bicicleta no obtendrás la mejora de estadísticas físicas. Es mucho más provechoso devolverla para acelerar la progresión del personaje.
* **Recompensa:** +3 de Resistencia física (Stamina) al devolver el vehículo.`;

      case 'evento-08-patrulla-fronteriza-1':
        return `## 🛻 Patrulla Fronteriza 1
Mount Haan Road · Gran Desierto de Señora

---

### Emboscada en Mount Haan

* **Ubicación:** Pistas secundarias de Mount Haan Road, en el Gran Desierto de Señora.
* **Desarrollo del Encuentro:** Un grupo de milicianos rurales xenófobos y armados hasta los dientes te cortarán el paso en motocicletas y camionetas, acusándote de ser un inmigrante ilegal sin importar el protagonista con el que juegues.
* **Consejo Táctico:** Busca cobertura rocosa fija de inmediato o responde con subfusiles desde el vehículo antes de descender. Los atacantes portan escopetas de bombeo letales a corta distancia.
* **Recompensa:** Hasta $700 en efectivo que sueltan los atacantes al caer, además de sus armas y munición.`;

      case 'evento-09-patrulla-fronteriza-2':
        return `## 🛻 Patrulla Fronteriza 2
Montañas Tataviam

---

### Hostigamiento en las Montañas Tataviam

* **Ubicación:** Senderos de tierra de las Montañas Tataviam (al este de Los Santos).
* **Desarrollo del Encuentro:** Una segunda partida de estos vigilantes paramilitares te interceptará en mitad de la cordillera para abrir fuego sin mediar palabra.
* **Consejo Táctico:** Mantén la distancia en los desniveles de la montaña para evitar que te rodeen desde las cotas altas de la ladera.
* **Recompensa:** Aproximadamente $700 en fajos de billetes recogidos del suelo y fusiles de asalto.`;

      case 'evento-10-patrulla-fronteriza-3':
        return `## 🛻 Patrulla Fronteriza 3
Raton Canyon

---

### Emboscada en el Cañón de Raton

* **Ubicación:** Caminos escarpados de Raton Canyon (Blaine County).
* **Desarrollo del Encuentro:** La tercera y última célula de milicianos te emboscará en las inmediaciones del cañón natural. Neutraliza a todos los integrantes de la cuadrilla para asegurar la zona.
* **Consejo Táctico:** Utiliza explosivos lanzables o rifles de precisión si consigues divisarlos antes de que abandonen sus vehículos.
* **Recompensa:** Hasta $700 en efectivo desprendido por los enemigos y munición pesada.`;

      case 'evento-11-entierro-vivo':
        return `## 🪦 Entierro en Paleto Bay
North Point · Paleto Bay

---

### El Rescate de Antonia Bottino

* **Ubicación:** Un descampado costero en North Point, al norte de Paleto Bay (Blaine County).
* **Desarrollo del Encuentro:** Descubrirás a dos sicarios de la mafia armados con palas cavando una zanja para enterrar viva a una mujer atada. Elimina rápidamente a los dos verdugos antes de que consumen la ejecución y desata a la víctima, quien revelará ser Antonia Bottino, hija del célebre capo de Liberty City Sammy Bottino. Súbela a tu vehículo y condúcela a salvo hasta Vinewood Hills.
* **Consejo Táctico:**
  * Si juegas con Michael o Franklin, llévala a su destino sin dudarlo. Tras unos días de juego, su padre se pondrá en contacto contigo para transferirte un suculento ingreso bancario de agradecimiento.
  * Si juegas con **Trevor Philips**, se te abrirá la opción de desviarte hacia Mount Chiliad y entregarla a la secta de los **Altruistas** a cambio de $1.000 rápidos, aunque perderás los $60.000 de la recompensa mafiosa.
* **Recompensa:** Relleno inmediato de la barra especial y **$60.000 en tu cuenta bancaria** recibidos días después por correo de su padre (o $1.000 en el campamento altruista con Trevor).`;

      case 'evento-12-autobus-turistico':
        return `## 🚌 Autobús Turístico de Vinewood
Alta Street · Downtown Vinewood

---

### La Ruta de las Estrellas de Los Santos

* **Ubicación:** Alta Street, frente al Teatro Chino en Downtown Vinewood (disponible exclusivamente en horario diurno).
* **Desarrollo del Encuentro:** Un autobús descapotable de la agencia Vinewood Star Tours espera viajeros para realizar un recorrido guiado por las mansiones de los famosos, Richards Majestic Studios y los monumentos arquitectónicos de la ciudad.
* **Consejo Táctico:** Puedes subirte al tour pagando una pequeña tarifa de billete ($40). El viaje ofrece comentarios cómicos y curiosidades mordaces sobre la historia del cine y las celebridades de Los Santos. Si no deseas escuchar el recorrido entero, puedes saltar de una parada a la siguiente mediante el botón de omisión.
* **Recompensa:** Lore ambiental y diálogos satíricos sobre la industria del espectáculo (sin recompensas materiales).`;

      case 'evento-13-robo-coche-1':
        return `## 🏎️ Robo de Coche 1 (Peyote Rosa)
Great Ocean Highway · North Chumash

---

### Persecución en la Costa del Pacífico

* **Ubicación:** Great Ocean Highway, en las inmediaciones del bar de moteros Hookies (North Chumash).
* **Desarrollo del Encuentro:** Una conductora pide auxilio a gritos tras ser despojada a la fuerza de su flamante descapotable clásico Vapid Peyote. El ladrón emprende la huida a toda velocidad por la autovía costera.
* **Consejo Táctico:** Dispara a las ruedas del Peyote o intercepta su trayectoria con tu vehículo para forzar al conductor a detenerse. Una vez abatido el delincuente, se plantea una disyuntiva:
  * **Devolver el coche**: Obtendrás una valiosa mejora en la habilidad de conducción de tu protagonista.
  * **Apropiarte del vehículo**: Este modelo cuenta con una carrocería en color **rosa chicle metalizado exclusivo** que no se puede replicar fielmente en Los Santos Customs. Puedes guardarlo en tu garaje personal.
* **Recompensa:** +5 puntos en la habilidad de Conducción (al devolverlo) o el automóvil Peyote rosa único (al quedártelo).`;

      case 'evento-14-robo-coche-2':
        return `## 🚙 Robo de Coche 2 (Obey Rocoto)
Exceptionalists Way · Aeropuerto Internacional (LSIA)

---

### Asalto en la Terminal del Aeropuerto

* **Ubicación:** Exceptionalists Way, en las inmediaciones del Aeropuerto Internacional de Los Santos.
* **Desarrollo del Encuentro:** Un atracador sustrae violentamente el todocamino de lujo Obey Rocoto a una ejecutiva de negocios que se disponía a tomar un vuelo. Persigue al infractor antes de que se incorpore a la autopista urbana.
* **Consejo Táctico:** Si devuelves el vehículo a su propietaria, días más tarde recibirás un correo electrónico formal de su parte notificándote que ha encargado un exclusivo **traje de etiqueta de sastrería de alta gama**, depositado directamente en el guardarropa del personaje.
* **Recompensa:** +5 puntos en la habilidad de Conducción y un **traje de lujo exclusivo en el armario** (al devolverlo), o el todocamino Obey Rocoto en color rojo oscuro exclusivo (al conservarlo).`;

      case 'evento-15-persecucion-ladrones-ciudad-1':
        return `## 🏍️ Ladrones en Hawick (The Lost MC)
Hawick Avenue · Hawick

---

### Asalto a Mano Armada en SubUrban

* **Ubicación:** Hawick Avenue, junto a la tienda de moda SubUrban.
* **Desarrollo del Encuentro:** Dos pistoleros motorizados de la banda motera The Lost MC asaltan un negocio adyacente, dejando al encargado malherido en el suelo mientras huyen a lomos de sus motocicletas con una bolsa repleta de dinero.
* **Consejo Táctico:** Persíguelos y acaba con ambos moteros en plena marcha. Tras recoger la bolsa con el botín, puedes optar por devolverla al comerciante o quedártela:
  * Devolver el botín te reportará $200 de gratificación y rellenará la barra especial de inmediato.
  * Quedarte con el botín te otorgará **$2.000 íntegros en metálico**.
* **Recompensa:** $2.000 en efectivo (si te quedas el dinero) o $200 + recarga instantánea de la habilidad especial (si lo devuelves).`;

      case 'evento-16-persecucion-ladrones-ciudad-2':
        return `## 🏍️ Ladrones en Textile City (The Lost MC)
San Andreas Avenue · Textile City

---

### Tirón Callejero en el Distrito Textil

* **Ubicación:** San Andreas Avenue, en pleno corazón del bullicioso distrito de Textile City.
* **Desarrollo del Encuentro:** Dos motoristas pertenecientes al club de moteros The Lost MC asaltan a un transeúnte de un tirón violento, arrebatándole la cartera antes de emprender la huida serpenteando entre el tráfico urbano.
* **Consejo Táctico:** Embiste su motocicleta por detrás o dispárales a través de la luna delantera. Una vez neutralizados, recoge el fajo del suelo y decide su destino:
  * Devolver el dinero a la víctima te proporcionará un 10% del botín ($50) y restaurará la barra especial al máximo.
  * Quedártelo te otorgará los **$500 íntegros**.
* **Recompensa:** $500 en metálico (si te lo quedas) o $50 y relleno total de habilidad especial (si lo devuelves).`;

      case 'evento-17-persecucion-ladrones-campo-1':
        return `## 🚐 Ladrones en Grapeseed (The Lost MC)
Grapeseed Main Street · Grapeseed

---

### Asalto Rural en Furgoneta

* **Ubicación:** Calle principal de Grapeseed, en la zona agrícola al norte del Mar de Álamo.
* **Desarrollo del Encuentro:** Varios miembros de The Lost MC asaltan a un vecino de la comarca y se dan a la fuga a bordo de una furgoneta Gang Burrito en dirección a los campos de cultivo.
* **Consejo Táctico:** La furgoneta es pesada pero resistente. Dispara directamente a los neumáticos traseros o al conductor para cortar de raíz la persecución por los estrechos caminos de tierra.
* **Recompensa:** $250 limpios (si te quedas el dinero) o $25 y recarga total de la barra especial (si devuelves la cartera al vecino asaltado).`;

      case 'evento-18-persecucion-ladrones-campo-2':
        return `## 🚐 Ladrones en Ruta 68 (The Lost MC)
Route 68 · Gran Desierto de Señora

---

### Atraco en el Supermercado Checkout!

* **Ubicación:** Gasolinera y supermercado Checkout! en la Ruta 68 (Gran Desierto de Señora).
* **Desarrollo del Encuentro:** Una furgoneta de The Lost MC atraca a un cliente que salía del establecimiento y emprende la marcha a gran velocidad por la carretera comarcal.
* **Consejo Táctico:** Persigue el furgón antes de que alcance la autopista interestatal Senora Freeway, donde las maniobras de intercepción resultan mucho más complejas debido al denso tráfico de camiones pesados.
* **Recompensa:** $120 en efectivo (si te quedas el botín) o $12 y recarga completa de la habilidad especial (si lo restituyes a la víctima).`;

      case 'evento-19-accidente-construccion':
        return `## 🚜 Accidente en la Obra
Calais Avenue · Little Seoul

---

### Rescate Contrarreloj en la Obra

* **Ubicación:** Calais Avenue, en una parcela de obras en construcción en el distrito de Little Seoul.
* **Desarrollo del Encuentro:** Un fatal desprendimiento de pesadas tuberías industriales de acero aplasta la cabina de un camión de servicio (Utility Truck), dejando a un operario atrapado entre los hierros. Para colmo, el depósito de gasolina del camión comienza a arder con llamas vivas: dispones de escasos segundos antes de una explosión catastrófica.
* **Consejo Táctico:** No intentes sacar al trabajador a pie ni dispares al vehículo. Súbete inmediatamente a la **excavadora bulldozer (Dozer)** estacionada a pocos metros del siniestro y utiliza la pala frontal para empujar y despejar con fuerza los tubos metálicos que bloquean la puerta del conductor. Al apartarlos, el obrero saltará a salvo justo antes de la detonación.
* **Recompensa:** +2 puntos de habilidad en Conducción y la satisfacción de un rescate perfecto.`;

      case 'evento-20-tiroteo-alamo-sea':
        return `## 🔫 Tiroteo en Alamo Sea
Marina Drive · Alamo Sea

---

### Emboscada al Contrabandista en la Marina

* **Ubicación:** Marina Drive, en la orilla norte del Mar de Álamo (Blaine County). Disponible únicamente jugando con **Michael De Santa** o **Franklin Clinton**.
* **Desarrollo del Encuentro:** Un individuo fuertemente armado se encuentra acorralado tras una furgoneta, librando un intenso tiroteo contra una cuadrilla de motoristas de The Lost MC. Ayúdale a repeler a los tiradores iniciales.
* **Consejo Táctico:** En cuanto elimines a los primeros moteros, no bajes la guardia: el superviviente correrá hacia su vehículo y en ese momento irrumpirá una segunda oleada de refuerzos en motocicletas disparando ráfagas continuas. Protégelo abatiendo a los recién llegados antes de que lo acribillen.
* **Recompensa:** **$1.000 en metálico** que el contrabandista te entrega en mano como gratificación por salvarle la vida.`;

      case 'evento-21-atraco-rural-harmony':
        return `## 💼 Robo en Harmony ($10.000)
Route 68 · Harmony

---

### Fuego Cruzado y los Maletines Olvidados

* **Ubicación:** Un descampado junto a la Ruta 68, en las proximidades del pueblo de Harmony (Gran Desierto de Señora).
* **Desarrollo del Encuentro:** Te toparás de lleno con un encarnizado tiroteo a campo abierto entre agentes de la policía rural y una banda de atracadores armados que acaban de asaltar un furgón o comercio. En el suelo yacen dos maletines repletos de fajos de billetes.
* **Consejo Táctico:** Mantén la distancia mientras se eliminan entre ellos. Cuando los guardias abatan a los asaltantes (o si decides acelerar el proceso disparando desde lejos), espera a que la línea de visión se despeje, recoge rápidamente los dos maletines ($5.000 cada uno) y escapa del perímetro antes de que lleguen refuerzos con patrullas.
* **Recompensa:** Hasta **$10.000 en metálico** repartidos en los dos maletines abandonados.`;

      case 'evento-22-rescate-accidente-taliana':
        return `## 🚗 Rescate de Taliana Martínez
Great Ocean Highway · Monte Chiliad

---

### La Conductora Más Valiosa de San Andreas

* **Ubicación:** Great Ocean Highway, en el tramo costero a las faldas del Monte Chiliad (disponible tras completar la misión de campaña *El Golpe a la Joyería*).
* **Desarrollo del Encuentro:** Divisarás un automóvil volcado y en llamas en la cuneta tras un accidente a alta velocidad. Cerca del coche yace malherida una mujer que pide auxilio: se trata de **Taliana Martínez**, una avezada conductora de fugas cuya propia banda la traicionó y abandonó tras un atraco.
* **Consejo Táctico:** Súbela de inmediato a tu vehículo y conduce a máxima velocidad hacia la casa segura en Sandy Shores. Una barra de salud descenderá gradualmente en pantalla: conduce de forma agresiva pero evitando choques bruscos que aceleren la muerte de la pasajera.
* **Recompensa:** Desbloqueo permanente de **Taliana Martínez como conductora de escape** para todos los Grandes Golpes de la historia. Es la mejor integrante de toda la campaña: posee estadísticas de conducción casi al máximo (idénticas a Eddie Toh) pero cobrando únicamente un **5% de comisión**, lo que te ahorrará millones de dólares en botines netos.`;

      case 'evento-23-negocio-fallido-maletin':
        return `## 💼 Negocio Fallido ($25.000)
Chiliad Mountain State Wilderness · Great Ocean Highway

---

### El Maletín Ensangrentado en la Reserva Natural

* **Ubicación:** Descampado escondido entre las colinas de Chiliad Mountain State Wilderness, justo al este de la autopista Great Ocean Highway.
* **Desarrollo del Encuentro:** Este evento rinde homenaje explícito a la película de culto *No es país para viejos* (No Country for Old Men). Encontrarás varias camionetas acribilladas a balazos, cadáveres ensangrentados y perros guardianes muertos tras una transacción de narcotráfico que acabó en carnicería. Al final del sendero rocoso, un superviviente moribundo te susurra que no bajes a por el maletín antes de expirar.
* **Consejo Táctico:** Baja al fondo del barranco y recoge el maletín plateado que contiene **$25.000 en efectivo**. En cuanto subas a un vehículo para alejarte del lugar, aparecerán dos camionetas todoterreno con pistoleros que intentarán emboscarte para recuperar el dinero. Prepárate con explosivos o un arma automática potente para repeler la persecución.
* **Recompensa:** **$25.000 íntegros en metálico** dentro del maletín + hasta $1.000 adicionales que dejan caer los sicarios perseguidores.`;

      case 'evento-24-discusion-domestica':
        return `## 🏌️ Discusión Doméstica (Castro Lagano)
Didion Drive · Vinewood Hills

---

### El Golfista Expulsado de Casa

* **Ubicación:** Didion Drive, en una lujosa urbanización de Vinewood Hills.
* **Desarrollo del Encuentro:** Presenciarás una acalorada discusión conyugal en la puerta de una mansión. Una mujer furiosa echa a patadas de casa a su marido infiel, arrojándole su bolsa de palos de golf a la acera. El hombre, llamado Castro Lagano, te suplicará que lo lleves en coche hasta el Club de Golf de Los Santos.
* **Consejo Táctico:**
  * Si juegas con Michael o Franklin, llévalo al club de golf. Te entregará $80 de propina y se desbloqueará como **oponente experto de golf**, permitiéndote jugar partidas de alto nivel para perfeccionar tu estadística de fuerza física.
  * Si juegas con **Trevor Philips**, puedes optar por desviarte hacia las montañas y venderlo a la secta de los **Altruistas** a cambio de $1.000.
* **Recompensa:** $80 de propina y desbloqueo de Castro Lagano como rival de golf (o $1.000 entregándolo a la secta altruista con Trevor).`;

      case 'evento-25-granja-marihuana-trevor':
        return `## 🌿 Asalto a la Granja de Marihuana ($70.000)
Monte Chiliad · Blaine County

---

### La Plantación Clandestina de los Narcos

* **Ubicación:** Vertiente este del Monte Chiliad (Blaine County). Disponible **exclusivamente con Trevor Philips**.
* **Desarrollo del Encuentro:** En mitad de la sierra se oculta una plantación de cultivo de hierba fuertemente custodiada por una milicia armada. Al acercarte, los guardias abrirán fuego de inmediato sin previo aviso.
* **Consejo Táctico:** Utiliza el modo *Furia* de Trevor para limpiar a los tiradores apostados tras las barricadas y las casetas de madera sin sufrir daños críticos. Una vez despejado el complejo, entra en el cobertizo principal y abre el maletín del suelo.
* **Recompensa:** Hasta **$70.000 en efectivo** dentro del maletín. Además, la plantación se reactiva periódicamente cada varias semanas de juego, convirtiéndose en una fuente recurrente de dinero fácil para Trevor.`;

      default:
        return `Información detallada del capítulo en preparación.`;
    }
  }
}




