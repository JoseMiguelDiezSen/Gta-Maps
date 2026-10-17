import { Component, AfterViewInit, OnInit, ViewChild, ElementRef } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { isDevAccessAllowed } from '../../../services/dev-access.guard';
import { CookieService } from '../../../services/cookie.service';
import { GuiaService } from '../../../services/guia.service';
import { GuiaArticulo, GuiaArticuloResumen, GuiaSeccion } from '../../../models/guia';
import { DealerCategory, GtaVehicle } from '../../../models/gta5/vehicle';
import { VehicleService } from '../../../services/gta5/vehicle.service';
import { CONCESIONARIOS_GTA5 } from '../../../components/gta5-info-panel/vehiculos.config';
import { GtaWeapon } from '../../../models/gta5/weapon';
import { WeaponService } from '../../../services/gta5/weapon.service';
import { WEAPON_CATEGORIES_GTA5, WeaponCategoryConfig } from '../../../components/gta5-info-panel/weapons.config';
import { LocationService } from '../../../services/gta5/location.service';
import { LocationItem } from '../../../models/gta5/location';
import { GtaMystery } from '../../../models/gta5/mystery';
import { GtaHeist, GtaMission } from '../../../models/gta5/mission';
import { MissionService } from '../../../services/gta5/mission.service';
import { Observable, shareReplay, forkJoin, map } from 'rxjs';

@Component({
  selector: 'app-gta5-guia-online',
  templateUrl: './gta5-guia-online.component.html',
  styleUrls: [
    '../offline/gta5-guia-offline.component.css',
    './gta5-guia-online.component.css',
    '../../../components/gta5-info-panel/gta5-info-panel.misiones.css'
  ],
  standalone: false
})
export class Gta5GuiaOnlineComponent implements OnInit, AfterViewInit {
  readonly isDevAllowed: boolean = isDevAccessAllowed();
  themeMode: 'night' | 'day' = 'night';
  readonly concesionarios: DealerCategory[] = CONCESIONARIOS_GTA5;
  readonly weaponCategories: WeaponCategoryConfig[] = WEAPON_CATEGORIES_GTA5;

  readonly secciones: GuiaSeccion[] = [
    {
      id: 'prologo',
      titulo: 'Prólogo',
      icono: 'book-open',
      descripcion: '',
      orden: 0,
      articulos: [
        { id: 'online-introduccion', slug: 'introduccion-gta-online', titulo: 'Introducción a GTA Online', subtitulo: 'El barrio sin ley: mundo abierto, progresión y reglas de la calle', categoria: 'prologo', badge: 'Introducción', tiempoLecturaMinutos: 4 },
        { id: 'online-personaje', slug: 'tu-personaje-criminal', titulo: 'Tu Personaje: El Criminal', subtitulo: 'Creación, apariencia y las dos formas de vivir en Los Santos', categoria: 'prologo', badge: 'Personaje', tiempoLecturaMinutos: 5 },
        { id: 'online-los-santos', slug: 'los-santos-en-linea', titulo: 'Los Santos en Línea', subtitulo: 'El mundo abierto que nunca duerme: sesiones, bandas y propiedades', categoria: 'prologo', badge: 'Ciudad', tiempoLecturaMinutos: 5 },
        { id: 'online-golpes', slug: 'golpes-online', titulo: 'Golpes Online: Los Grandes Atracos', subtitulo: 'Planificación, tripulación de hasta 4 y botín millonario', categoria: 'prologo', badge: 'Golpes', tiempoLecturaMinutos: 6 },
        { id: 'online-negocios', slug: 'negocios-y-dinero', titulo: 'Negocios, Propiedades y Dinero Sucio', subtitulo: 'Monta tus negocios, invierte y haz que el dinero trabaje para ti', categoria: 'prologo', badge: 'Negocios', tiempoLecturaMinutos: 6 },
        { id: 'online-actividades', slug: 'modos-y-actividades', titulo: 'Modos, Carreras y Actividades', subtitulo: 'Competición, modos JcJ y todo el caos del modo libre', categoria: 'prologo', badge: 'Actividades', tiempoLecturaMinutos: 6 },
        { id: 'online-progresion', slug: 'progresion-y-respeto', titulo: 'Progresión: Niveles, RP y Respeto', subtitulo: 'Cómo subir de nivel, reinvertir y hacerte un nombre en la calle', categoria: 'prologo', badge: 'Progresión', tiempoLecturaMinutos: 5 }
      ]
    },
    { id: 'misiones-principales', titulo: 'Misiones Principales', icono: 'gun', descripcion: '', orden: 1, articulos: [] },
    { id: 'golpes', titulo: 'Golpes', icono: 'vault', descripcion: '', orden: 2, articulos: [] },
    { id: 'personajes', titulo: 'Personajes', icono: 'users', descripcion: '', orden: 3, articulos: [] },
    { id: 'vehiculos', titulo: 'Vehículos', icono: 'car', descripcion: '', orden: 4, articulos: [] },
    { id: 'armas', titulo: 'Armas', icono: 'crosshairs', descripcion: '', orden: 5, articulos: [] },
    { id: 'misterios', titulo: 'Misterios', icono: 'ghost', descripcion: '', orden: 6, articulos: [] }
  ];

  currentSection: GuiaSeccion | null = null;
  selectedArticulo: GuiaArticulo | null = null;
  renderedContent: SafeHtml = '';
  searchQuery: string = '';
  searchResults: GuiaArticuloResumen[] = [];
  showScrollTop: boolean = false;

  private readonly onlineArticulosContenido = new Map<string, GuiaArticulo>();

  @ViewChild('wikiShell') wikiShellRef?: ElementRef<HTMLDivElement>;

  readonly personajes$: Observable<LocationItem[]>;
  readonly dealerCounts$: Observable<Record<string, number>>;
  readonly weaponCounts$: Observable<Record<string, number>>;
  readonly misterios$: Observable<GtaMystery[]>;
  readonly golpes$: Observable<GtaHeist[]>;
  readonly misionesOnline$: Observable<GtaMission[]>;

  concesionarioSeleccionado: DealerCategory | null = null;
  vehiculosConcesionario$: Observable<GtaVehicle[]> | null = null;
  vehiculoSeleccionado: GtaVehicle | null = null;

  categoriaArmaSeleccionada: WeaponCategoryConfig | null = null;
  armasCategoria$: Observable<GtaWeapon[]> | null = null;
  armaSeleccionada: GtaWeapon | null = null;

  misterioSeleccionado: GtaMystery | null = null;
  golpeSeleccionado: GtaHeist | null = null;
  golpes: GtaHeist[] = [];

  misionesOnline: GtaMission[] = [];
  misionSeleccionada: GtaMission | null = null;
  busquedaMisiones: string = '';
  filtroContactoMisiones: string = 'todos';

  constructor(
    public cookieService: CookieService,
    private locationService: LocationService,
    private vehicleService: VehicleService,
    private weaponService: WeaponService,
    private missionService: MissionService,
    private guiaService: GuiaService,
    private sanitizer: DomSanitizer
  ) {
    this.personajes$ = this.locationService
      .getProperties('online', 'character')
      .pipe(shareReplay(1));

    this.misterios$ = this.guiaService
      .getMisteriosGuiaOnline()
      .pipe(shareReplay(1));

    this.golpes$ = this.missionService
      .getOnlineHeists()
      .pipe(shareReplay(1));

    this.misionesOnline$ = this.missionService
      .getOnlineMissions()
      .pipe(shareReplay(1));

    this.dealerCounts$ = forkJoin(
      this.concesionarios.map(d =>
        this.vehicleService.getVehicles(d.id, undefined, undefined, 'online').pipe(
          map(list => ({ id: d.id, count: list.length }))
        )
      )
    ).pipe(
      map(results => {
        const counts: Record<string, number> = {};
        for (const r of results) {
          counts[r.id] = r.count;
        }
        return counts;
      }),
      shareReplay(1)
    );

    this.weaponCounts$ = this.weaponService.getWeapons('online').pipe(
      map(weapons => {
        const counts: Record<string, number> = {};
        for (const cat of this.weaponCategories) {
          counts[cat.id] = 0;
        }
        for (const w of weapons) {
          const cat = (w.category || '').toLowerCase();
          counts[cat] = (counts[cat] || 0) + 1;
        }
        return counts;
      }),
      shareReplay(1)
    );

    this.guiaService.getOnlinePrologoArticulos().subscribe(articulos => {
      for (const articulo of articulos) {
        this.onlineArticulosContenido.set(articulo.id, articulo);
      }
      if (this.selectedArticulo) {
        this.seleccionarArticulo(this.selectedArticulo.id);
      }
    });
  }

  ngOnInit(): void {
    this.seleccionarArticulo(this.secciones[0].articulos[0].id);
    this.golpes$.subscribe(list => {
      this.golpes = list;
    });
    this.misionesOnline$.subscribe(list => {
      this.misionesOnline = list;
    });
  }

  ngAfterViewInit(): void {
    if (this.wikiShellRef?.nativeElement) {
      this.wikiShellRef.nativeElement.scrollTop = 0;
    }
  }

  toggleThemeMode(): void {
    this.themeMode = this.themeMode === 'night' ? 'day' : 'night';
  }

  onGta6MapClick(event: Event): void {
    if (!this.isDevAllowed) {
      event.preventDefault();
    }
  }

  openSection(seccion: GuiaSeccion): void {
    this.currentSection = seccion;
    this.limpiarConcesionario();
    this.limpiarArma();
    this.limpiarMisterio();
    this.limpiarGolpe();
    this.limpiarMision();
    if (seccion.id === 'misterios') {
      this.misterios$.subscribe(list => {
        if (list && list.length > 0 && !this.misterioSeleccionado) {
          this.misterioSeleccionado = list[0];
        }
      });
    }
    if (seccion.id === 'golpes') {
      this.golpes$.subscribe(list => {
        if (list && list.length > 0 && !this.golpeSeleccionado) {
          this.golpeSeleccionado = list[0];
        }
      });
    }
    if (seccion.id === 'misiones-principales') {
      if (this.misionesOnline.length > 0 && !this.misionSeleccionada) {
        this.misionSeleccionada = this.misionesOnline[0];
      } else {
        this.misionesOnline$.subscribe(list => {
          if (list && list.length > 0 && !this.misionSeleccionada) {
            this.misionSeleccionada = list[0];
          }
        });
      }
    }
    if (seccion.id === 'armas') {
      if (this.weaponCategories.length > 0 && !this.categoriaArmaSeleccionada) {
        this.seleccionarCategoriaArma(this.weaponCategories[0]);
      }
    }
    if (seccion.id === 'vehiculos') {
      if (this.concesionarios.length > 0 && !this.concesionarioSeleccionado) {
        this.seleccionarConcesionario(this.concesionarios[0]);
      }
    }
  }

  backToSections(): void {
    this.currentSection = null;
    this.limpiarConcesionario();
    this.limpiarArma();
    this.limpiarMisterio();
    this.limpiarGolpe();
    this.limpiarMision();
  }

  seleccionarGolpe(g: GtaHeist): void {
    this.golpeSeleccionado = g;
  }

  volverAlGridGolpes(): void {
    this.golpeSeleccionado = null;
  }

  private limpiarGolpe(): void {
    this.golpeSeleccionado = null;
  }

  getHeistAccentColor(h: GtaHeist | null): string {
    return h?.badgeColor || '#ffb833';
  }

  seleccionarMisterio(m: GtaMystery): void {
    this.misterioSeleccionado = m;
  }

  volverAlGridMisterios(): void {
    this.misterioSeleccionado = null;
  }

  getMysteryImage(m: GtaMystery | null | undefined): string {
    if (!m || !m.thumbnail) return '';
    const src = m.thumbnail.trim();
    if (src.includes('mysteries/')) {
      const fileName = src.substring(src.lastIndexOf('/') + 1);
      return `/assets/images/gta5/mysteries/${fileName}`;
    }
    return src.startsWith('/') ? src : '/' + src;
  }

  private limpiarMisterio(): void {
    this.misterioSeleccionado = null;
  }

  seleccionarConcesionario(concesionario: DealerCategory): void {
    this.concesionarioSeleccionado = concesionario;
    this.vehiculoSeleccionado = null;
    this.vehiculosConcesionario$ = this.vehicleService
      .getVehicles(concesionario.id, undefined, undefined, 'online')
      .pipe(shareReplay(1));
  }

  seleccionarVehiculo(vehiculo: GtaVehicle): void {
    this.vehiculoSeleccionado = vehiculo;
  }

  volverAlGridVehiculos(): void {
    this.vehiculoSeleccionado = null;
  }

  getVehicleIcon(v: GtaVehicle | null): string {
    if (!v) return 'fa-car';
    const cat = (v.category || v.class || '').toLowerCase();
    if (cat.includes('motor') || cat.includes('moto')) return 'fa-motorcycle';
    if (cat.includes('heli')) return 'fa-helicopter';
    if (cat.includes('plane') || cat.includes('avión') || cat.includes('avion')) return 'fa-plane';
    if (cat.includes('boat') || cat.includes('embarc') || cat.includes('barco')) return 'fa-ship';
    if (cat.includes('cycle') || cat.includes('bici')) return 'fa-bicycle';
    if (cat.includes('militar') || cat.includes('indust') || cat.includes('offroad') || cat.includes('todoterreno')) return 'fa-truck-monster';
    return 'fa-car';
  }

  private limpiarConcesionario(): void {
    this.concesionarioSeleccionado = null;
    this.vehiculosConcesionario$ = null;
    this.vehiculoSeleccionado = null;
  }

  seleccionarCategoriaArma(cat: WeaponCategoryConfig): void {
    this.categoriaArmaSeleccionada = cat;
    this.armaSeleccionada = null;
    this.armasCategoria$ = this.weaponService
      .getWeapons('online', cat.id)
      .pipe(shareReplay(1));
  }

  seleccionarArma(arma: GtaWeapon): void {
    this.armaSeleccionada = arma;
  }

  volverAlGridArmas(): void {
    this.armaSeleccionada = null;
  }

  getWeaponIcon(arma: GtaWeapon | null): string {
    if (!arma) return 'fa-gun';
    return arma.icon || 'fa-gun';
  }

  private limpiarArma(): void {
    this.categoriaArmaSeleccionada = null;
    this.armasCategoria$ = null;
    this.armaSeleccionada = null;
  }

  seleccionarArticulo(articuloId: string): void {
    const resumen = this.secciones
      .flatMap(seccion => seccion.articulos)
      .find(articulo => articulo.id === articuloId);
    if (!resumen) return;
    const contenido = this.onlineArticulosContenido.get(articuloId);
    this.selectedArticulo = {
      ...resumen,
      contenidoMarkdown: contenido?.contenidoMarkdown ?? '',
      tags: contenido?.tags ?? [],
      ultimaActualizacion: contenido?.ultimaActualizacion ?? '',
      relacionados: contenido?.relacionados ?? []
    };
    this.renderedContent = this.renderMarkdown(this.selectedArticulo.contenidoMarkdown);
  }

  private renderMarkdown(raw: string): SafeHtml {
    if (!raw) {
      return this.sanitizer.bypassSecurityTrustHtml('');
    }

    const lines = raw.split('\n');
    const out: string[] = [];
    let inList = false;

    for (const line of lines) {
      const isSubBullet = /^\s{2,}[\*\-]\s+(.*)$/.test(line);
      const isBullet = /^\s*[\*\-]\s+(.*)$/.test(line);
      if (!isBullet && inList) {
        out.push('</ul>');
        inList = false;
      }

      if (line.startsWith('### ')) {
        const rawText = line.substring(4).trim();
        const noEmoji = rawText.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();
        const heading = this.formatInline(noEmoji);
        out.push(`
          <div class="guide-heading-divider">
            <div class="guide-heading-line"></div>
            <h3 class="guide-heading-title">${heading}</h3>
            <div class="guide-heading-line guide-heading-line--right"></div>
          </div>
        `);
      } else if (line.startsWith('## ')) {
        const rawText = line.substring(3).trim();
        const noEmoji = rawText.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();
        const heading = this.formatInline(noEmoji);
        out.push(`<h2 class="guide-h2">${heading}</h2>`);
      } else if (line.startsWith('> ')) {
        if (!inList) {
          out.push('<ul class="guide-list">');
          inList = true;
        }
        const text = this.formatInline(line.substring(2).trim());
        out.push(`<li class="guide-list-item"><span class="guide-list-bullet">&#x203A;</span><span class="guide-list-text">${text}</span></li>`);
      } else if (line.trim() === '---') {
        continue;
      } else if (isBullet) {
        if (!inList) {
          out.push('<ul class="guide-list">');
          inList = true;
        }
        const match = line.match(/^\s*[\*\-]\s+(.*)$/);
        const text = match ? this.formatInline(match[1]) : '';
        const subClass = isSubBullet ? ' guide-list-subitem' : '';
        out.push(`<li class="guide-list-item${subClass}"><span class="guide-list-bullet">&#x203A;</span><span class="guide-list-text">${text}</span></li>`);
      } else if (line.trim().length > 0) {
        const p = this.formatInline(line);
        out.push(`<p class="guide-p">${p}</p>`);
      }
    }

    if (inList) {
      out.push('</ul>');
    }

    return this.sanitizer.bypassSecurityTrustHtml(out.join('\n'));
  }

  private formatInline(text: string): string {
    if (!text) return '';
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong class="guide-strong">$1</strong>');
    formatted = formatted.replace(/\*([^*]+)\*/g, '<em class="guide-em">$1</em>');
    formatted = formatted.replace(/`([^`]+)`/g, '<span class="guide-chip-code">$1</span>');
    return formatted;
  }

  onSearch(): void {
    const consulta = this.searchQuery.trim().toLowerCase();
    if (!consulta) {
      this.searchResults = [];
      return;
    }
    this.searchResults = this.secciones
      .flatMap(seccion => seccion.articulos)
      .filter(articulo => articulo.titulo.toLowerCase().includes(consulta));
  }

  limpiarBusqueda(): void {
    this.searchQuery = '';
    this.searchResults = [];
  }

  getSeccionContador(seccion: GuiaSeccion): number {
    if (seccion.id === 'vehiculos') {
      return this.concesionarios.length;
    }
    if (seccion.id === 'armas') {
      return this.weaponCategories.length;
    }
    if (seccion.id === 'misiones-principales') {
      return this.misionesOnline.length;
    }
    return seccion.articulos.length;
  }

  seleccionarMision(m: GtaMission): void {
    this.misionSeleccionada = m;
  }

  limpiarMision(): void {
    this.misionSeleccionada = null;
  }

  renderMissionMarkdown(m: GtaMission | null | undefined): SafeHtml {
    if (!m || !m.contenidoMarkdown) {
      return this.sanitizer.bypassSecurityTrustHtml('');
    }
    return this.renderMarkdown(m.contenidoMarkdown);
  }

  get filteredOnlineMissions(): GtaMission[] {
    const query = this.busquedaMisiones.trim().toLowerCase();
    const contact = this.filtroContactoMisiones;
    return this.misionesOnline.filter(m => {
      const matchContact = contact === 'todos' || m.character === contact || m.giver === contact;
      const matchQuery = !query ||
        m.title.toLowerCase().includes(query) ||
        (m.character && m.character.toLowerCase().includes(query)) ||
        (m.category && m.category.toLowerCase().includes(query));
      return matchContact && matchQuery;
    });
  }

  get uniqueOnlineContacts(): { name: string; count: number }[] {
    const map = new Map<string, number>();
    for (const m of this.misionesOnline) {
      const name = m.character || m.giver;
      if (name) {
        map.set(name, (map.get(name) || 0) + 1);
      }
    }
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }

  get previousMission(): GtaMission | null {
    if (!this.misionSeleccionada || this.misionesOnline.length === 0) return null;
    const idx = this.misionesOnline.findIndex(m => m.id === this.misionSeleccionada!.id);
    return idx > 0 ? this.misionesOnline[idx - 1] : null;
  }

  get nextMission(): GtaMission | null {
    if (!this.misionSeleccionada || this.misionesOnline.length === 0) return null;
    const idx = this.misionesOnline.findIndex(m => m.id === this.misionSeleccionada!.id);
    return (idx >= 0 && idx < this.misionesOnline.length - 1) ? this.misionesOnline[idx + 1] : null;
  }

  selectPreviousMission(): void {
    const prev = this.previousMission;
    if (prev) this.misionSeleccionada = prev;
  }

  selectNextMission(): void {
    const next = this.nextMission;
    if (next) this.misionSeleccionada = next;
  }

  get articulosSeccionActual(): GuiaArticuloResumen[] {
    if (this.currentSection) {
      return this.currentSection.articulos || [];
    }
    if (this.selectedArticulo) {
      const sec = this.secciones.find(s => s.articulos?.some(a => a.id === this.selectedArticulo?.id));
      if (sec) {
        return sec.articulos || [];
      }
    }
    return [];
  }

  get capituloAnterior(): GuiaArticuloResumen | null {
    if (!this.selectedArticulo) return null;
    const articulos = this.articulosSeccionActual;
    const idx = articulos.findIndex(a => a.id === this.selectedArticulo?.id);
    return idx > 0 ? articulos[idx - 1] : null;
  }

  get capituloSiguiente(): GuiaArticuloResumen | null {
    if (!this.selectedArticulo) return null;
    const articulos = this.articulosSeccionActual;
    const idx = articulos.findIndex(a => a.id === this.selectedArticulo?.id);
    return idx >= 0 && idx < articulos.length - 1 ? articulos[idx + 1] : null;
  }

  getOnlineContactBadgeClass(char: string): string {
    const c = (char || '').toLowerCase();
    if (c.includes('gerald')) return 'badge-gerald';
    if (c.includes('simeon')) return 'badge-simeon';
    if (c.includes('lamar')) return 'badge-lamar';
    if (c.includes('lester')) return 'badge-lester';
    if (c.includes('madrazo')) return 'badge-madrazo';
    if (c.includes('trevor') || c.includes('ron')) return 'badge-trevor';
    if (c.includes('agatha')) return 'badge-agatha';
    if (c.includes('brendan')) return 'badge-darcy';
    if (c.includes('franklin')) return 'badge-franklin';
    if (c.includes('dax')) return 'badge-dax';
    if (c.includes('vincent')) return 'badge-vincent';
    if (c.includes('agente') || c.includes('securoserv')) return 'badge-tactical';
    return 'badge-neutral';
  }

  getMissionAccentColor(m: GtaMission | null): string {
    if (!m) return '#ffb833';
    const c = (m.character || '').toLowerCase();
    const cat = (m.category || '').toLowerCase();
    if (c.includes('lucia')) return '#ff4fe0';
    if (c.includes('jason')) return '#00cec9';
    if (c.includes('gerald')) return '#9b59b6';
    if (c.includes('simeon')) return '#f1c40f';
    if (c.includes('lamar')) return '#2ecc71';
    if (c.includes('lester')) return '#3498db';
    if (c.includes('madrazo')) return '#e74c3c';
    if (c.includes('trevor') || c.includes('ron')) return '#e67e22';
    if (c.includes('agatha')) return '#d4af37';
    if (c.includes('brendan')) return '#2980b9';
    if (c.includes('franklin')) return '#27ae60';
    if (c.includes('dax')) return '#e91e63';
    if (c.includes('vincent')) return '#ff5722';
    if (cat.includes('golpe') || cat.includes('heist') || cat.includes('final')) return '#f1c40f';
    if (c.includes('franklin') && !c.includes('michael') && !c.includes('trevor')) return '#2ecc71';
    if (c.includes('michael') && !c.includes('franklin') && !c.includes('trevor')) return '#3498db';
    if (c.includes('trevor') && !c.includes('franklin') && !c.includes('michael')) return '#e67e22';
    return '#ffb833';
  }

  getMissionIcon(m: GtaMission | null): string {
    if (!m) return 'fa-crosshairs';
    const c = (m.character || '').toLowerCase();
    const cat = (m.category || '').toLowerCase();
    if (cat.includes('golpe') || cat.includes('heist')) return 'fa-sack-dollar';
    if (c.includes('lucia')) return 'fa-gem';
    if (c.includes('jason')) return 'fa-shield-halved';
    if (c.includes('gerald')) return 'fa-pills';
    if (c.includes('simeon')) return 'fa-car';
    if (c.includes('lamar')) return 'fa-cannabis';
    if (c.includes('lester')) return 'fa-laptop-code';
    if (c.includes('madrazo')) return 'fa-crosshairs';
    if (c.includes('trevor') || c.includes('ron')) return 'fa-skull';
    if (c.includes('agatha')) return 'fa-gem';
    if (c.includes('franklin')) return 'fa-car';
    if (c.includes('michael')) return 'fa-gun';
    if (c.includes('vincent')) return 'fa-shield-halved';
    if (c.includes('dax')) return 'fa-flask';
    if (c.includes('brendan') || c.includes('agente 14') || c.includes('securoserv')) return 'fa-user-secret';
    return 'fa-crosshairs';
  }

  getSectionColor(seccionId?: string): string {
    if (!seccionId) return '#ffb833';
    const id = seccionId.toLowerCase();
    if (id.includes('prologo')) return '#3b82f6';
    if (id.includes('mision')) return '#ef4444';
    if (id.includes('golpe')) return '#eab308';
    if (id.includes('personaje')) return '#f97316';
    if (id.includes('vehiculo')) return '#38bdf8';
    if (id.includes('arma')) return '#e11d48';
    if (id.includes('misterio')) return '#a855f7';
    return '#ffb833';
  }

  onShellScroll(): void {
    const shell = this.wikiShellRef?.nativeElement;
    if (!shell) return;
    this.showScrollTop = shell.scrollTop > 400;
  }

  scrollToTop(): void {
    this.wikiShellRef?.nativeElement.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
