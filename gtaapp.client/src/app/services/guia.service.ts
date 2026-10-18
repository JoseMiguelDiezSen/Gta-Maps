import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map, shareReplay, switchMap } from 'rxjs/operators';
import { GuiaManifest, GuiaSeccion, GuiaArticulo, GuiaArticuloResumen, TrofeosCatalogo } from '../models/guia';
import { GtaMystery } from '../models/gta5/mystery';

@Injectable({
  providedIn: 'root'
})
export class GuiaService {
  private manifestCache = new Map<'gta5' | 'gta6', Observable<GuiaManifest>>();

  constructor(private http: HttpClient) {}

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
  getManifest(juegoId: 'gta5' | 'gta6'): Observable<GuiaManifest> {
    const cached = this.manifestCache.get(juegoId);
    if (cached) {
      return cached;
    }

    const t = new Date().getTime();
    if (juegoId === 'gta5') {
      const obs$ = forkJoin({
        prologo: this.http.get<GuiaArticulo[]>(`assets/data/gta5/guia/offline/prologo-guia-offline.json?t=${t}`).pipe(catchError(() => of([]))),
        misiones: this.http.get<GuiaArticulo[]>(`assets/data/gta5/guia/offline/guia-misiones-historia.json?t=${t}`).pipe(catchError(() => of([]))),
        extranos: this.http.get<GuiaArticulo[]>(`assets/data/gta5/guia/offline/extranos-locos.json?t=${t}`).pipe(catchError(() => of([]))),
        negocios: this.http.get<GuiaArticulo[]>(`assets/data/gta5/guia/offline/bolsa.json?t=${t}`).pipe(catchError(() => of([]))),
        eventos: this.http.get<GuiaArticulo[]>(`assets/data/gta5/guia/offline/eventos-aleatorios.json?t=${t}`).pipe(catchError(() => of([]))),
        misterios: this.http.get<GuiaArticulo[]>(`assets/data/gta5/guia/offline/misterios-guia-offline.json?t=${t}`).pipe(catchError(() => of([])))
      }).pipe(
        map(res => ({
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
              id: 'negocios-economia',
              titulo: 'Mercado Bursátil',
              icono: 'briefcase',
              descripcion: 'Guía de finanzas, funcionamiento de LCN y BAWSAQ y especulación bursátil.',
              orden: 3,
              articulos: res.negocios.map(a => this.toResumen(a))
            },
            {
              id: 'eventos-aleatorios',
              titulo: 'Eventos Aleatorios',
              icono: 'shuffle',
              descripcion: 'Encuentros fortuitos y eventos dinámicos por todo Los Santos y Blaine County.',
              orden: 4,
              articulos: res.eventos.map(a => this.toResumen(a))
            },
            {
              id: 'secretos-misterios',
              titulo: 'Misterios',
              icono: 'ghost',
              descripcion: 'El misterio de Mount Chiliad, los 4 OVNIs y el asesino de los 8 infinitos.',
              orden: 5,
              articulos: res.misterios.map(a => this.toResumen(a))
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
        })),
        catchError(() => of(this.getFallbackManifest('gta5'))),
        shareReplay(1)
      );
      this.manifestCache.set('gta5', obs$);
      return obs$;
    }

    const obsGta6$ = this.http.get<GuiaArticulo[]>(`assets/data/gta6/guia/offline/prologo-guia-offline.json?t=${t}`).pipe(
      map(prologo => ({
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
            articulos: prologo.map(a => this.toResumen(a))
          }
        ]
      })),
      catchError(() => of(this.getFallbackManifest('gta6'))),
      shareReplay(1)
    );
    this.manifestCache.set('gta6', obsGta6$);
    return obsGta6$;
  }

  /**
   * Obtiene las secciones temáticas de la guía.
   */
  getSecciones(juegoId: 'gta5' | 'gta6'): Observable<GuiaSeccion[]> {
    return this.getManifest(juegoId).pipe(
      map(manifest => manifest.secciones)
    );
  }

  /**
   * Obtiene el contenido completo de un artículo por su ID o slug.
   */
  getArticulo(juegoId: 'gta5' | 'gta6', articuloId: string): Observable<GuiaArticulo> {
    if (juegoId === 'gta5') {
      return this.getManifest('gta5').pipe(
        switchMap(manifest => {
          const sec = manifest.secciones.find(s => s.articulos.some(a => a.id === articuloId || a.slug === articuloId));
          const isPrologo = sec?.id === 'prologo' || ['prologo-introduccion-guia', 'michael-de-santa', 'franklin-clinton', 'trevor-philips', 'michael-trevor-franklin-intrahistoria', 'requisitos-100', 'golpes-principales', 'finales-opcion-abc', 'lista-trucos-gta5'].includes(articuloId);
          const isNegocios = sec?.id === 'negocios-economia' || ['asesinatos-lester-bolsa', 'guia-negocios-propiedades'].includes(articuloId);
          const isExtranos = articuloId.startsWith('eyl-') || sec?.id === 'extranos-locos';
          const isMisterio = sec?.id === 'secretos-misterios' || ['ghost_jolene', 'underwater_', 'tunnel_', 'mount_chiliad', 'thelma_', 'infinity_', 'nothing_here', 'fridgit_', 'yellow_jack', 'greyfriars_', 'ufos_', 'sasquatch_'].some(prefix => articuloId.startsWith(prefix)) || articuloId.includes('misterio') || articuloId.includes('chiliad') || articuloId.includes('cranley');
          const isEvento = articuloId.startsWith('evento-') || sec?.id === 'eventos-aleatorios';
          const jsonUrl = isPrologo
              ? 'assets/data/gta5/guia/offline/prologo-guia-offline.json?t=' + new Date().getTime()
              : isNegocios
              ? 'assets/data/gta5/guia/offline/bolsa.json?t=' + new Date().getTime()
              : isExtranos 
              ? 'assets/data/gta5/guia/offline/extranos-locos.json?t=' + new Date().getTime()
              : isMisterio
              ? 'assets/data/gta5/guia/offline/misterios-guia-offline.json?t=' + new Date().getTime()
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
        })
      );
    }

    const gta6JsonUrl = 'assets/data/gta6/guia/offline/prologo-guia-offline.json?t=' + new Date().getTime();
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
    const jsonUrl = 'assets/data/gta5/guia/online/prologo-guia-online.json?t=' + new Date().getTime();
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
  private getFallbackManifest(juegoId: 'gta5' | 'gta6'): GuiaManifest {
    if (juegoId === 'gta5') {
      return {
        id: 'gta5',
        juego: 'Grand Theft Auto V',
        titulo: 'Guía GTA V',
        descripcion: 'Compendio interactivo de Los Santos y Blaine County: Modo Historia al 100%, Golpes, Bolsa e Inversiones, y Secretos.',
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
      default:
        return `Información detallada del capítulo en preparación.`;
    }
  }

  getMisteriosGuiaOnline(): Observable<GtaMystery[]> {
    const t = new Date().getTime();
    return this.http.get<GtaMystery[]>(`assets/data/gta5/guia/online/misterios-guia-online.json?t=${t}`).pipe(
      catchError(() => of([])),
      shareReplay(1)
    );
  }

  getMisionesGuiaOnline(): Observable<any[]> {
    const t = new Date().getTime();
    const base = 'assets/data/gta5/guia/online/misiones/';
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
      files.map(f => this.http.get<any[]>(`${base}${f}?t=${t}`).pipe(catchError(() => of([]))))
    ).pipe(
      map(arrays => {
        const flattened = arrays.reduce((acc: any[], curr: any[]) => acc.concat(curr), [] as any[]);
        return flattened.sort((a, b) => (a.order || 0) - (b.order || 0));
      }),
      shareReplay(1)
    );
  }

  getNegociosGuiaOnline(): Observable<any[]> {
    const t = new Date().getTime();
    return this.http.get<any[]>(`assets/data/gta5/guia/online/businesses-guide.json?t=${t}`).pipe(
      catchError(() => of([])),
      shareReplay(1)
    );
  }
}




