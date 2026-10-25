import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map, shareReplay, switchMap } from 'rxjs/operators';
import { GuiaManifest, GuiaSeccion, GuiaArticulo, GuiaArticuloResumen, TrofeosCatalogo } from '../models/guia';
import { GtaMystery } from '../models/gta5/mystery';
import { GtaHeist } from '../models/gta5/mission';
import { TranslationService } from '../i18n';

@Injectable({
  providedIn: 'root'
})
export class GuiaService {
  private manifestCache = new Map<string, Observable<GuiaManifest>>();

  constructor(
    private http: HttpClient,
    private translationService: TranslationService
  ) {}

  /**
   * Carga un archivo JSON de la guía soportando localización con fallback progresivo:
   * 1. assets/data/{game}/guia/{mode}/idiomas/{lang}/{file}
   * 2. assets/data/{game}/guia/{mode}/idiomas/es/{file}
   * 3. assets/data/{game}/guia/{mode}/{file} (fallback ruta plana)
   */
  private getGuiaJson<T>(game: 'gta5' | 'gta6', mode: 'offline' | 'online', fileName: string, subfolder = ''): Observable<T> {
    const activeLang = this.translationService ? this.translationService.currentLang : 'es';
    const sub = subfolder ? `${subfolder}/` : '';

    const localizedPath = `assets/data/${game}/guia/${mode}/idiomas/${activeLang}/${sub}${fileName}`;
    const canonicalPath = `assets/data/${game}/guia/${mode}/idiomas/es/${sub}${fileName}`;
    const legacyPath = `assets/data/${game}/guia/${mode}/${sub}${fileName}`;

    if (activeLang === 'es') {
      return this.http.get<T>(canonicalPath).pipe(
        catchError(() => this.http.get<T>(legacyPath).pipe(catchError(() => of([] as unknown as T))))
      );
    }

    return this.http.get<T>(localizedPath).pipe(
      catchError(() => this.http.get<T>(canonicalPath).pipe(
        catchError(() => this.http.get<T>(legacyPath).pipe(catchError(() => of([] as unknown as T))))
      ))
    );
  }

  /**
   * Carga un archivo raíz de la guía (ej: catálogo de armas o vehículos) con fallback seguro.
   */
  private getGuiaRootJson<T>(game: 'gta5' | 'gta6', fileName: string): Observable<T> {
    const activeLang = this.translationService ? this.translationService.currentLang : 'es';

    const localizedPath = `assets/data/${game}/guia/idiomas/${activeLang}/${fileName}`;
    const canonicalPath = `assets/data/${game}/guia/idiomas/es/${fileName}`;
    const legacyPath = `assets/data/${game}/guia/${fileName}`;

    if (activeLang === 'es') {
      return this.http.get<T>(canonicalPath).pipe(
        catchError(() => this.http.get<T>(legacyPath).pipe(catchError(() => of([] as unknown as T))))
      );
    }

    return this.http.get<T>(localizedPath).pipe(
      catchError(() => this.http.get<T>(canonicalPath).pipe(
        catchError(() => this.http.get<T>(legacyPath).pipe(catchError(() => of([] as unknown as T))))
      ))
    );
  }

  /**
   * Fusiona artículos canónicos (fuente de verdad técnica) con textos localizados opcionales.
   */
  private mergeLocalizedArticulos(baseItems: GuiaArticulo[], localizedItems: any[]): GuiaArticulo[] {
    if (!baseItems || baseItems.length === 0) return (localizedItems as GuiaArticulo[]) || [];
    if (!localizedItems || localizedItems.length === 0) return baseItems;

    const locMap = new Map<string, any>();
    localizedItems.forEach(item => {
      if (item && item.id) locMap.set(item.id, item);
    });

    return baseItems.map(base => {
      const trans = locMap.get(base.id);
      if (!trans) return base;

      return {
        ...base,
        titulo: trans.titulo || base.titulo,
        subtitulo: trans.subtitulo !== undefined ? trans.subtitulo : base.subtitulo,
        sinopsis: trans.sinopsis !== undefined ? trans.sinopsis : base.sinopsis,
        recompensa: trans.recompensa !== undefined ? trans.recompensa : base.recompensa,
        desbloqueadoTras: trans.desbloqueadoTras !== undefined ? trans.desbloqueadoTras : base.desbloqueadoTras,
        requisitosOro: trans.requisitosOro || base.requisitosOro,
        contenidoMarkdown: trans.contenidoMarkdown || base.contenidoMarkdown
      };
    });
  }

  private toResumen(a: GuiaArticulo): GuiaArticuloResumen {
    return {
      id: a.id,
      slug: a.slug,
      titulo: a.titulo,
      subtitulo: a.subtitulo,
      categoria: a.categoria,
      badge: a.badge,
      tiempoLecturaMinutos: a.tiempoLecturaMinutos
    };
  }

  /**
   * Obtiene el manifiesto completo con secciones y listado de artículos para GTA 5 o GTA 6.
   */
  getManifest(juegoId: 'gta5' | 'gta6' | 'gta6-online'): Observable<GuiaManifest> {
    const lang = this.translationService ? this.translationService.currentLang : 'es';
    const cacheKey = `${juegoId}_${lang}`;
    const cached = this.manifestCache.get(cacheKey);
    if (cached) {
      return cached;
    }


    if (juegoId === 'gta5') {
      const obs$ = forkJoin({
        prologo: this.getGuiaJson<GuiaArticulo[]>('gta5', 'offline', 'prologo-guia-offline.json'),
        misiones: this.getGuiaJson<GuiaArticulo[]>('gta5', 'offline', 'guia-misiones-historia.json'),
        extranos: this.getGuiaJson<GuiaArticulo[]>('gta5', 'offline', 'extranos-locos.json'),
        negocios: this.getGuiaJson<GuiaArticulo[]>('gta5', 'offline', 'bolsa.json'),
        eventos: this.getGuiaJson<GuiaArticulo[]>('gta5', 'offline', 'eventos-aleatorios.json'),
        misterios: this.getGuiaJson<GuiaArticulo[]>('gta5', 'offline', 'misterios-guia-offline.json'),
        armas: this.getGuiaRootJson<any[]>('gta5', 'guia-weapons-offline.json')
      }).pipe(
        map(res => ({
          id: 'gta5',
          juego: 'Grand Theft Auto V',
          titulo: 'Guía GTA V',
          descripcion: 'Compendio interactivo de Los Santos y Blaine County: Modo Historia al 100%, Golpes, Bolsa e Inversiones, y Secretos.',
          bannerUrl: 'assets/images/home/home-bg.jpg',
          secciones: [
            {
              id: 'prologo',
              titulo: 'Inicio',
              icono: 'book-open',
              descripcion: 'Introducción a la guía interactiva de Grand Theft Auto V y perfiles de los protagonistas.',
              orden: 0,
              articulos: res.prologo.filter(a => a.categoria === 'prologo').map(a => this.toResumen(a))
            },
            {
              id: 'misiones-historia',
              titulo: 'Misiones Principales',
              icono: 'gun',
              descripcion: 'Guía detallada paso a paso de todas las misiones principales de GTA V.',
              orden: 1,
              articulos: res.misiones.map(a => this.toResumen(a))
            },
            {
              id: 'extranos-locos',
              titulo: 'Locos y Extraños',
              icono: 'burst',
              descripcion: 'Misiones secundarias de Extraños y Locos por todo San Andreas.',
              orden: 2,
              articulos: res.extranos.map(a => this.toResumen(a))
            },
            {
              id: 'armas',
              titulo: 'Armas',
              icono: 'gun',
              descripcion: 'Catálogo de armamento del modo historia, desbloqueos en Ammu-Nation y ubicaciones en el mapa.',
              orden: 3,
              articulos: (res.armas || []).map(w => ({
                id: w.id,
                slug: w.id,
                titulo: w.name,
                subtitulo: w.category ? w.category.toUpperCase() : 'Arma',
                categoria: 'armas',
                badge: w.category,
                tiempoLecturaMinutos: 2
              }))
            },
            {
              id: 'negocios-economia',
              titulo: 'Mercado Bursátil',
              icono: 'briefcase',
              descripcion: 'Guía de finanzas, funcionamiento de LCN y BAWSAQ y especulación bursátil.',
              orden: 4,
              articulos: res.negocios.map(a => this.toResumen(a))
            },
            {
              id: 'eventos-aleatorios',
              titulo: 'Eventos Aleatorios',
              icono: 'shuffle',
              descripcion: 'Encuentros fortuitos y eventos dinámicos por todo Los Santos y Blaine County.',
              orden: 5,
              articulos: res.eventos.map(a => this.toResumen(a))
            },
            {
              id: 'secretos-misterios',
              titulo: 'Misterios',
              icono: 'ghost',
              descripcion: 'El misterio de Mount Chiliad, los 4 OVNIs y el asesino de los 8 infinitos.',
              orden: 6,
              articulos: res.misterios.map(a => this.toResumen(a))
            },
            {
              id: 'trofeos',
              titulo: 'Trofeos',
              icono: 'trophy',
              descripcion: 'Listado de trofeos y logros de GTA V: Platino, Oro, Plata y Bronce.',
              orden: 7,
              articulos: []
            }
          ]
        })),
        catchError(() => of(this.getFallbackManifest('gta5'))),
        shareReplay(1)
      );
      this.manifestCache.set(cacheKey, obs$);
      return obs$;
    }

    const obsGta6$ = forkJoin({
      prologo: this.getGuiaJson<GuiaArticulo[]>('gta6', 'offline', 'prologo-guia-offline.json'),
      misiones: this.getGuiaJson<GuiaArticulo[]>('gta6', 'offline', 'misiones-guia-offline.json')
    }).pipe(
      map(res => ({
        id: 'gta6',
        juego: 'Grand Theft Auto VI',
        titulo: 'Guía GTA VI & Base de Datos',
        descripcion: 'Compendio interactivo de Vice City y el Estado de Leonida: protagonistas, distritos, mecánicas de sigilo e inventario y análisis criminal.',
        bannerUrl: 'assets/home-bg.jpg',
        secciones: [
          {
            id: 'prologo',
            titulo: 'Inicio',
            icono: 'book-open',
            descripcion: 'Introducción al Estado de Leonida, Vice City y perfiles de los protagonistas.',
            orden: 0,
            articulos: res.prologo.map(a => this.toResumen(a))
          },
          {
            id: 'misiones-historia',
            titulo: 'Misiones Principales',
            icono: 'gun',
            descripcion: 'Guía de las misiones principales de GTA VI.',
            orden: 1,
            articulos: res.misiones.map(a => this.toResumen(a))
          },
          {
            id: 'trofeos',
            titulo: 'Trofeos',
            icono: 'trophy',
            descripcion: 'Listado provisional de trofeos y logros de GTA VI: Platino, Oro, Plata y Bronce.',
            orden: 2,
            articulos: []
          },
          {
            id: 'vehiculos',
            titulo: 'Vehículos',
            icono: 'car',
            descripcion: 'Catálogo de vehículos, deportivos, embarcaciones y aeronaves de Leonida.',
            orden: 3,
            articulos: []
          }
        ]
      })),
      catchError(() => of(this.getFallbackManifest('gta6'))),
      shareReplay(1)
    );
    this.manifestCache.set(cacheKey, obsGta6$);

    if (juegoId === 'gta6-online') {
      const obsOnline$ = forkJoin({
        prologo: this.getGuiaJson<GuiaArticulo[]>('gta6', 'online', 'prologo-guia-online.json'),
        misiones: this.getGuiaJson<GuiaArticulo[]>('gta6', 'online', 'misiones-guia-online.json')
      }).pipe(
        map(res => ({
          id: 'gta6-online',
          juego: 'Grand Theft Auto VI Online',
          titulo: 'Guía GTA VI Online & Base de Datos',
          descripcion: 'Compendio interactivo multijugador de Vice City y el Estado de Leonida.',
          bannerUrl: 'assets/home-bg.jpg',
          secciones: [
            {
              id: 'prologo',
              titulo: 'Inicio',
              icono: 'book-open',
              descripcion: 'Primeros pasos, reputación y economía en Leonida Online.',
              orden: 0,
              articulos: res.prologo.map(a => this.toResumen(a))
            },
            {
              id: 'misiones-online',
              titulo: 'Misiones & Operaciones',
              icono: 'crosshairs',
              descripcion: 'Misiones de contacto y operaciones clandestinas en Vice City.',
              orden: 1,
              articulos: res.misiones.map(a => this.toResumen(a))
            },
            {
              id: 'vehiculos',
              titulo: 'Vehículos',
              icono: 'car',
              descripcion: 'Catálogo multijugador de transportes, concesionarios y vehículos de Vice City.',
              orden: 2,
              articulos: []
            }
          ]
        })),
        catchError(() => of(this.getFallbackManifest('gta6-online'))),
        shareReplay(1)
      );
      this.manifestCache.set(cacheKey, obsOnline$);
      return obsOnline$;
    }

    return obsGta6$;
  }

  /**
   * Obtiene las secciones temáticas de la guía.
   */
  getSecciones(juegoId: 'gta5' | 'gta6' | 'gta6-online'): Observable<GuiaSeccion[]> {
    return this.getManifest(juegoId).pipe(
      map(manifest => manifest.secciones)
    );
  }

  /**
   * Obtiene el contenido completo de un artículo por su ID o slug.
   */
  getArticulo(juegoId: 'gta5' | 'gta6' | 'gta6-online', articuloId: string): Observable<GuiaArticulo> {
    if (juegoId === 'gta6-online') {
  
      return forkJoin([
        this.getGuiaJson<GuiaArticulo[]>('gta6', 'online', 'prologo-guia-online.json'),
        this.getGuiaJson<GuiaArticulo[]>('gta6', 'online', 'misiones-guia-online.json')
      ]).pipe(
        map(([prologo, misiones]) => {
          const todos = [...prologo, ...misiones];
          const found = todos.find(a => a.id === articuloId || a.slug === articuloId);
          if (found) {
            const siblings = todos.filter(a => a.id !== found.id && a.categoria === found.categoria);
            return {
              ...found,
              tags: found.tags || ['Guía', 'GTA VI Online', found.badge || 'Leonida'],
              relacionados: siblings.slice(0, 2).map(a => ({ id: a.id, titulo: a.titulo, slug: a.slug })),
              ultimaActualizacion: new Date().toISOString()
            } as GuiaArticulo;
          }
          return this.getFallbackArticulo(juegoId, articuloId);
        }),
        catchError(() => of(this.getFallbackArticulo(juegoId, articuloId)))
      );
    }

    if (juegoId === 'gta5') {
      return this.getManifest('gta5').pipe(
        switchMap(manifest => {
          const sec = manifest.secciones.find(s => s.articulos.some(a => a.id === articuloId || a.slug === articuloId));
          const isPrologo = sec?.id === 'prologo' || ['prologo-introduccion-guia', 'michael-de-santa', 'franklin-clinton', 'trevor-philips', 'michael-trevor-franklin-intrahistoria', 'requisitos-100', 'golpes-principales', 'finales-opcion-abc'].includes(articuloId);
          const isNegocios = sec?.id === 'negocios-economia' || ['asesinatos-lester-bolsa', 'guia-negocios-propiedades'].includes(articuloId);
          const isExtranos = articuloId.startsWith('eyl-') || sec?.id === 'extranos-locos';
          const isMisterio = sec?.id === 'secretos-misterios' || ['ghost_jolene', 'underwater_', 'tunnel_', 'mount_chiliad', 'thelma_', 'infinity_', 'nothing_here', 'fridgit_', 'yellow_jack', 'greyfriars_', 'ufos_', 'sasquatch_'].some(prefix => articuloId.startsWith(prefix)) || articuloId.includes('misterio') || articuloId.includes('chiliad') || articuloId.includes('cranley');
          const isEvento = articuloId.startsWith('evento-') || sec?.id === 'eventos-aleatorios';
          const jsonFileName = isPrologo
              ? 'prologo-guia-offline.json'
              : isNegocios
              ? 'bolsa.json'
              : isExtranos 
              ? 'extranos-locos.json'
              : isMisterio
              ? 'misterios-guia-offline.json'
              : isEvento
              ? 'eventos-aleatorios.json'
              : 'guia-misiones-historia.json';
              
          return this.getGuiaJson<GuiaArticulo[]>('gta5', 'offline', jsonFileName).pipe(
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
        })
      );
    }


    return forkJoin([
      this.getGuiaJson<GuiaArticulo[]>('gta6', 'offline', 'prologo-guia-offline.json').pipe(catchError(() => of([]))),
      this.getGuiaJson<GuiaArticulo[]>('gta6', 'offline', 'misiones-guia-offline.json').pipe(catchError(() => of([])))
    ]).pipe(
      map(([prologo, misiones]) => {
        const articulos = [...prologo, ...misiones];
        const found = articulos.find(a => a.id === articuloId || a.slug === articuloId);
        if (found) {
          const siblings = articulos.filter(a => a.id !== found.id && a.categoria === found.categoria);
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

    return this.getGuiaJson<GuiaArticulo[]>('gta5', 'online', 'prologo-guia-online.json').pipe(
      catchError(() => of([]))
    );
  }

  /**
   * Obtiene el catálogo de trofeos de GTA V (listado real en español).
   */
  getTrofeos(juegoId: 'gta5' | 'gta6'): Observable<TrofeosCatalogo> {
    const fileName = juegoId === 'gta5' ? 'trofeos.json' : 'trofeos-gta6.json';


    return this.getGuiaJson<TrofeosCatalogo>(juegoId, 'offline', fileName).pipe(
      catchError(() => of(this.getFallbackTrofeos()))
    );
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
  buscarArticulos(juegoId: 'gta5' | 'gta6' | 'gta6-online', query: string): Observable<GuiaArticuloResumen[]> {
    const params = new HttpParams().set('q', query);
    return this.http.get<GuiaArticuloResumen[]>(`/api/${juegoId}/guia/buscar`, { params }).pipe(
      catchError(() => {
        const q = (query || '').toLowerCase().trim();
        return this.getManifest(juegoId).pipe(
          map(manifest => {
            const results: GuiaArticuloResumen[] = [];
            for (const sec of manifest.secciones) {
              for (const a of sec.articulos) {
                if (a.titulo.toLowerCase().includes(q) || a.subtitulo.toLowerCase().includes(q)) {
                  results.push(a);
                }
              }
            }
            return results;
          })
        );
      })
    );
  }

  /* --------------------------------------------------------------------------
     DATOS LOCALES DE RESPALDO (OFFLINE / INICIALES)
     -------------------------------------------------------------------------- */
  private getFallbackManifest(juegoId: 'gta5' | 'gta6' | 'gta6-online'): GuiaManifest {
    if (juegoId === 'gta5') {
      return {
        id: 'gta5',
        juego: 'Grand Theft Auto V',
        titulo: 'Guía GTA V',
        descripcion: 'Compendio interactivo de Los Santos y Blaine County: Modo Historia al 100%, Golpes, Bolsa e Inversiones, y Secretos.',
        bannerUrl: 'assets/home-bg.jpg',
        secciones: []
      };
    } else if (juegoId === 'gta6-online') {
      return {
        id: 'gta6-online',
        juego: 'Grand Theft Auto VI Online',
        titulo: 'Guía GTA VI Online & Base de Datos',
        descripcion: 'Compendio interactivo multijugador de Vice City y el Estado de Leonida.',
        bannerUrl: 'assets/home-bg.jpg',
        secciones: []
      };
    } else {
      return {
        id: 'gta6',
        juego: 'Grand Theft Auto VI',
        titulo: 'Guía GTA VI & Base de Datos',
        descripcion: 'Compendio interactivo de Vice City y el Estado de Leonida: protagonistas, distritos, mecánicas de sigilo e inventario y análisis criminal.',
        bannerUrl: 'assets/home-bg.jpg',
        secciones: [
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

  private getFallbackArticulo(juegoId: 'gta5' | 'gta6' | 'gta6-online', articuloId: string): GuiaArticulo {
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
      default:
        return `Información detallada del capítulo en preparación.`;
    }
  }

  getMisteriosGuiaOnline(): Observable<GtaMystery[]> {

    return this.getGuiaJson<GtaMystery[]>('gta5', 'online', 'misterios-guia-online.json').pipe(
      catchError(() => of([])),
      shareReplay(1)
    );
  }

  getGolpesGuiaOnline(): Observable<GtaHeist[]> {

    return this.getGuiaJson<GtaHeist[]>('gta5', 'online', 'golpes-guia-online.json').pipe(
      catchError(() => of([])),
      shareReplay(1)
    );
  }

  getMisionesGuiaOnline(): Observable<any[]> {


    const files = [
      'misiones-lamar.json',
      'misiones-simeon.json',
      'misiones-gerald.json',
      'misiones-ron.json',
      'misiones-lester.json',
      'misiones-trevor.json',
      'misiones-madrazo.json',
      'misiones-lowriders.json',
      'misiones-vehiculos-especiales.json',
      'misiones-operaciones-moviles.json',
      'misiones-dispatch.json',
      'misiones-embargos-deluxe.json',
      'misiones-casino.json',
      'misiones-ultima-jugada.json',
      'misiones-superyate.json',
      'misiones-the-contract.json',
      'misiones-drug-wars.json',
      'misiones-cluckin-bell.json'
    ];

    return forkJoin(
      files.map(f => this.getGuiaJson<any[]>('gta5', 'online', f, 'misiones').pipe(catchError(() => of([]))))
    ).pipe(
      map(arrays => {
        const flattened = arrays.reduce((acc: GuiaArticulo[], curr: GuiaArticulo[]) => acc.concat(curr), [] as GuiaArticulo[]);
        return flattened.sort((a, b) => (a.order || 0) - (b.order || 0));
      }),
      shareReplay(1)
    );
  }

  getNegociosGuiaOnline(): Observable<any[]> {

    return this.getGuiaJson<any[]>('gta5', 'online', 'businesses-guide.json').pipe(
      catchError(() => of([])),
      shareReplay(1)
    );
  }

  getVehiculosGuiaOnline(dealershipId?: string): Observable<any[]> {

    return this.getGuiaRootJson<any[]>('gta5', 'guia-vehicles-online.json').pipe(
      map(list => {
        if (!list) return [];
        let items = list;
        if (dealershipId) {
          const norm = dealershipId.toLowerCase();
          items = items.filter(v => (v.dealership || '').toLowerCase() === norm);
        }
        return items;
      }),
      catchError(() => of([])),
      shareReplay(1)
    );
  }

  getVehiculosGuiaGta6(mode: 'offline' | 'online', dealershipId?: string): Observable<any[]> {

    return this.getGuiaJson<any[]>('gta6', mode, `vehiculos-guia-${mode}.json`).pipe(
      map(list => {
        if (!list) return [];
        let items = list;
        if (dealershipId) {
          const norm = dealershipId.toLowerCase();
          items = items.filter(v => (v.dealership || '').toLowerCase() === norm);
        }
        return items;
      }),
      catchError(() => of([])),
      shareReplay(1)
    );
  }

  getArmasGuiaOnline(categoryId?: string): Observable<any[]> {

    return this.getGuiaRootJson<any[]>('gta5', 'guia-weapons-online.json').pipe(
      map(list => {
        if (!list) return [];
        let items = list;
        if (categoryId && categoryId !== 'all') {
          const norm = categoryId.toLowerCase();
          items = items.filter(w => (w.category || '').toLowerCase() === norm);
        }
        return items;
      }),
      catchError(() => of([])),
      shareReplay(1)
    );
  }

  getArmasGuiaOffline(categoryId?: string): Observable<any[]> {

    return this.getGuiaRootJson<any[]>('gta5', 'guia-weapons-offline.json').pipe(
      map(list => {
        if (!list) return [];
        let items = list;
        if (categoryId && categoryId !== 'all') {
          const norm = categoryId.toLowerCase();
          items = items.filter(w => (w.category || '').toLowerCase() === norm);
        }
        return items.map(w => {
          if (w) {
            if (!w.priceFormatted) {
              w.priceFormatted = (w.price === 0 || w.price === undefined) ? 'Gratis' : `$${Number(w.price).toLocaleString('en-US')}`;
            }
          }
          return w;
        });
      }),
      catchError(() => of([])),
      shareReplay(1)
    );
  }
}




