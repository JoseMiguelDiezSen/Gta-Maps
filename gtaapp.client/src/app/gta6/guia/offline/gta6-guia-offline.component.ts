import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, HostListener, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { GuiaService } from '../../../services/guia.service';
import { CookieService } from '../../../services/cookie.service';
import { GuiaManifest, GuiaSeccion, GuiaArticulo, GuiaArticuloResumen, TrofeoItem, TrofeoTipo, TrofeosResumen } from '../../../models/guia';
import { isDevAccessAllowed } from '../../../services/dev-access.guard';
import { Subscription, Observable, forkJoin, map, shareReplay } from 'rxjs';
import { GRUPOS_MISIONES_GTA6 } from './misiones-grupos.config';
import { DealerCategory, GtaVehicle } from '../../../models/gta5/vehicle';
import { CATEGORIAS_VEHICULOS_GTA6 } from '../vehiculos-gta6.config';

export interface GuiaBreadcrumbItem {
  label: string;
  clickable: boolean;
  action?: () => void;
}

@Component({
  selector: 'app-gta6-guia-offline',
  templateUrl: './gta6-guia-offline.component.html',
  styleUrls: ['./gta6-guia-offline.component.css'],
  standalone: false
})
export class Gta6GuiaOfflineComponent implements OnInit, OnDestroy, AfterViewInit {
  readonly isDevAllowed: boolean = isDevAccessAllowed();

  manifest: GuiaManifest | null = null;
  secciones: GuiaSeccion[] = [];
  currentSection: GuiaSeccion | null = null;
  selectedArticulo: GuiaArticulo | null = null;
  selectedSeccionId: string = 'todas';
  
  themeMode: 'night' | 'day' = 'night';
  searchQuery: string = '';
  searchResults: GuiaArticuloResumen[] = [];
  busquedaOffline: string = '';
  expandedGrupos: Set<string> = new Set<string>();
  isLoading: boolean = true;
  isLoadingArticulo: boolean = false;
  renderedContent: string = '';
  articleToc: { id: string; text: string }[] = [];
  readingProgress: number = 0;
  showScrollTop: boolean = false;
  toastMessage: string | null = null;
  mobileNavOpen: boolean = false;
  private toastTimeout: ReturnType<typeof setTimeout> | null = null;

  mostrarTrofeos: boolean = false;
  isLoadingTrofeos: boolean = false;
  trofeos: TrofeoItem[] = [];
  trofeosResumen: TrofeosResumen = { total: 0, platino: 0, oro: 0, plata: 0, bronce: 0 };
  trofeoFiltro: TrofeoTipo | 'todos' = 'todos';

  private static readonly TROFEO_ORDEN: TrofeoTipo[] = ['platino', 'oro', 'plata', 'bronce'];

  readonly concesionarios: DealerCategory[] = CATEGORIAS_VEHICULOS_GTA6;
  readonly dealerCounts$: Observable<Record<string, number>>;
  concesionarioSeleccionado: DealerCategory | null = null;
  vehiculosConcesionario$: Observable<GtaVehicle[]> | null = null;
  vehiculosConcesionario: GtaVehicle[] = [];
  vehiculoSeleccionado: GtaVehicle | null = null;
  busquedaVehiculos: string = '';
  private vehiculosSub?: Subscription;

  getSeccionContador(seccion: GuiaSeccion): number {
    if (seccion.id === 'trofeos') {
      return this.trofeosResumen.total;
    }
    if (seccion.id === 'vehiculos') {
      return this.concesionarios.length;
    }
    return seccion.articulos.length;
  }

  /* Estado de navegación por niveles en móvil (estilo Info-Panel) */
  isMobileReadingOpen: boolean = false;

  openMobileReading(): void {
    this.isMobileReadingOpen = true;
    this.scrollToTop();
  }

  closeMobileReading(): void {
    this.isMobileReadingOpen = false;
    if (this.vehiculoSeleccionado) {
      this.vehiculoSeleccionado = null;
    }
    if (this.mostrarTrofeos) {
      this.mostrarTrofeos = false;
      this.currentSection = null;
    }
    this.scrollToTop();
  }

  goToCategoriesFromReading(): void {
    this.isMobileReadingOpen = false;
    this.currentSection = null;
    this.mostrarTrofeos = false;
    this.limpiarConcesionario();
    this.scrollToTop();
  }

  private isMobileView(): boolean {
    return typeof window !== 'undefined' && window.innerWidth <= 850;
  }

  get breadcrumbs(): GuiaBreadcrumbItem[] {
    const items: GuiaBreadcrumbItem[] = [];

    // 1. Vehículos
    if (this.concesionarioSeleccionado || this.currentSection?.id === 'vehiculos') {
      const secVehiculos = this.secciones.find(s => s.id === 'vehiculos');
      items.push({
        label: secVehiculos?.titulo || 'Vehículos',
        clickable: !!this.concesionarioSeleccionado,
        action: () => {
          if (secVehiculos) this.openSection(secVehiculos);
          this.limpiarConcesionario();
        }
      });
      if (this.concesionarioSeleccionado) {
        items.push({
          label: this.concesionarioSeleccionado.name,
          clickable: !!this.vehiculoSeleccionado,
          action: () => {
            this.volverAlGridVehiculos();
          }
        });
      }
      if (this.vehiculoSeleccionado) {
        items.push({
          label: this.vehiculoSeleccionado.name,
          clickable: false
        });
      }
      return items;
    }

    if (!this.selectedArticulo) return [];

    const art = this.selectedArticulo;
    let sec = this.currentSection;
    if (!sec) {
      sec = this.secciones.find(s => s.articulos?.some(a => a.id === art.id))
        || this.secciones.find(s => s.id === art.categoria)
        || null;
    }

    if (sec) {
      items.push({
        label: sec.titulo,
        clickable: true,
        action: () => {
          this.openSection(sec!);
        }
      });
    }

    items.push({
      label: this.cleanBreadcrumbTitle(art.titulo),
      clickable: false
    });

    return items;
  }

  getCleanMissionTitle(title?: string): string {
    if (!title) return '';
    return title.replace(/^\d+\.\s*/, '').trim();
  }

  cleanBreadcrumbTitle(title?: string): string {
    return this.getCleanMissionTitle(title);
  }

  getArticuloImage(art: GuiaArticulo | null): string | null {
    if (!art) return null;
    return art.imagenPrincipalUrl || art.imagen || null;
  }

  onImageError(artId: string): void {
    if (this.selectedArticulo && this.selectedArticulo.id === artId) {
      this.selectedArticulo.imagenPrincipalUrl = undefined;
      this.selectedArticulo.imagen = undefined;
    }
  }

  private manifestSub?: Subscription;
  private articuloSub?: Subscription;
  private searchSub?: Subscription;
  private trofeosSub?: Subscription;

  private readonly guiaService = inject(GuiaService);
  public readonly cookieService = inject(CookieService);
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);

  constructor() {
    this.dealerCounts$ = forkJoin(
      this.concesionarios.map(d =>
        this.guiaService.getVehiculosGuiaGta6('offline', d.id).pipe(
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
  }

  ngOnDestroy(): void {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
      this.toastTimeout = null;
    }
    this.manifestSub?.unsubscribe();
    this.articuloSub?.unsubscribe();
    this.searchSub?.unsubscribe();
    this.trofeosSub?.unsubscribe();
    this.vehiculosSub?.unsubscribe();
  }

  ngOnInit(): void {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }

    this.cargarGuia();
    this.cargarTrofeos();
  }

  ngAfterViewInit(): void {
    if (this.wikiShellRef?.nativeElement) {
      this.wikiShellRef.nativeElement.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  }

  get articulosVisibles(): GuiaArticuloResumen[] {
    if (this.selectedSeccionId === 'todas') {
      const all: GuiaArticuloResumen[] = [];
      for (const s of this.secciones) {
        if (s.articulos) {
          all.push(...s.articulos);
        }
      }
      return all;
    }
    const seccion = this.secciones.find(s => s.id === this.selectedSeccionId);
    return seccion ? seccion.articulos : [];
  }

  get todosLosArticulos(): GuiaArticuloResumen[] {
    const todos: GuiaArticuloResumen[] = [];
    for (const sec of this.secciones) {
      if (sec.articulos) {
        todos.push(...sec.articulos);
      }
    }
    return todos;
  }

  get articulosSeccionActual(): GuiaArticuloResumen[] {
    if (this.currentSection) {
      return this.currentSection.articulos || [];
    }
    if (this.selectedArticulo) {
      const seccionDelArticulo = this.secciones.find(s => s.articulos?.some(a => a.id === this.selectedArticulo?.id));
      if (seccionDelArticulo) {
        return seccionDelArticulo.articulos || [];
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

  @HostListener('window:keydown', ['$event'])
  handleKeyboardNavigation(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      if (this.capituloSiguiente) {
        event.preventDefault();
        this.seleccionarArticulo(this.capituloSiguiente.id);
        this.scrollActiveChapterIntoView();
      }
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      if (this.capituloAnterior) {
        event.preventDefault();
        this.seleccionarArticulo(this.capituloAnterior.id);
        this.scrollActiveChapterIntoView();
      }
    }
  }

  private scrollActiveChapterIntoView(): void {
    setTimeout(() => {
      const activeEl = document.querySelector('.guide-chapter-card.is-active') as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }, 50);
  }

  @ViewChild('wikiShell') wikiShellRef?: ElementRef<HTMLDivElement>;

  onShellScroll(): void {
    const el = this.wikiShellRef?.nativeElement;
    if (!el) return;
    const scrollY = el.scrollTop;
    this.showScrollTop = scrollY > 400;

    const docHeight = el.scrollHeight - el.clientHeight;
    if (docHeight > 0) {
      this.readingProgress = Math.min(100, Math.max(0, Math.round((scrollY / docHeight) * 100)));
    } else {
      this.readingProgress = 0;
    }
  }

  scrollToTop(): void {
    if (this.wikiShellRef?.nativeElement) {
      this.wikiShellRef.nativeElement.scrollTo({ top: 0, behavior: 'smooth' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onContentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const chip = target.closest('.guide-chip-code') as HTMLElement;
    if (chip && chip.textContent) {
      const textToCopy = chip.textContent.trim();
      if (navigator.clipboard) {
        navigator.clipboard.writeText(textToCopy).then(() => {
          this.mostrarToast(`Copiado al portapapeles: ${textToCopy}`);
        }).catch(() => {
          this.mostrarToast(`Texto: ${textToCopy}`);
        });
      } else {
        this.mostrarToast(`Texto: ${textToCopy}`);
      }
    }
  }

  private mostrarToast(msg: string): void {
    this.toastMessage = msg;
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.toastTimeout = setTimeout(() => {
      this.toastMessage = null;
    }, 2800);
  }

  toggleMobileNav(): void {
    this.mobileNavOpen = !this.mobileNavOpen;
  }

  closeMobileNav(): void {
    this.mobileNavOpen = false;
  }

  cargarGuia(): void {
    this.isLoading = true;
    this.manifestSub?.unsubscribe();
    this.manifestSub = this.guiaService.getManifest('gta6').subscribe({
      next: (data) => {
        this.manifest = data;
        this.secciones = data.secciones || [];
        this.isLoading = false;
        
        if (this.secciones.length > 0 && this.secciones[0].articulos.length > 0) {
          this.seleccionarArticulo(this.secciones[0].articulos[0].id, false);
        }
      },
      error: (err) => {
        console.error('Error al cargar la guía de GTA 6:', err);
        this.isLoading = false;
      }
    });
  }

  seleccionarSeccion(seccionId: string): void {
    this.selectedSeccionId = seccionId;
  }

  openSection(sec: GuiaSeccion): void {
    this.busquedaOffline = '';
    this.currentSection = sec;
    this.selectedSeccionId = sec.id;
    if (sec.id === 'trofeos') {
      this.mostrarTrofeos = true;
      this.isMobileReadingOpen = true;
      this.cargarTrofeos();
    } else if (sec.id === 'vehiculos') {
      this.mostrarTrofeos = false;
      this.isMobileReadingOpen = false;
      this.selectedArticulo = null;
      this.limpiarConcesionario();
    } else {
      this.mostrarTrofeos = false;
      this.isMobileReadingOpen = false;
      if (sec.id === 'misiones-historia') {
        this.expandedGrupos.clear();
        if (GRUPOS_MISIONES_GTA6.length > 0) {
          this.expandedGrupos.add(GRUPOS_MISIONES_GTA6[0].id);
        }
      }
      if (sec.articulos && sec.articulos.length > 0) {
        this.seleccionarArticulo(sec.articulos[0].id, false);
      }
    }
    if (this.isMobileView()) {
      this.scrollToTop();
    }
  }

  backToSections(): void {
    this.busquedaOffline = '';
    this.currentSection = null;
    this.mostrarTrofeos = false;
    this.isMobileReadingOpen = false;
    this.limpiarConcesionario();
    if (this.isMobileView()) {
      this.scrollToTop();
    }
  }

  seleccionarConcesionario(concesionario: DealerCategory): void {
    this.concesionarioSeleccionado = concesionario;
    this.vehiculoSeleccionado = null;
    this.busquedaVehiculos = '';
    this.vehiculosConcesionario = [];
    this.vehiculosSub?.unsubscribe();
    this.vehiculosConcesionario$ = this.guiaService
      .getVehiculosGuiaGta6('offline', concesionario.id)
      .pipe(shareReplay(1));
    this.vehiculosSub = this.vehiculosConcesionario$.subscribe(list => {
      this.vehiculosConcesionario = list || [];
    });
  }

  get vehiculosFiltrados(): GtaVehicle[] {
    const list = this.vehiculosConcesionario || [];
    const rawQuery = (this.busquedaVehiculos || '').trim();
    if (!rawQuery) {
      return list;
    }
    const cleanStr = (s?: string) =>
      (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const query = cleanStr(rawQuery);
    return list.filter(v =>
      cleanStr(v.name).includes(query) ||
      cleanStr(v.manufacturer).includes(query) ||
      cleanStr(v.class).includes(query)
    );
  }

  limpiarBusquedaVehiculos(): void {
    this.busquedaVehiculos = '';
  }

  getPlaceholderBuscadorVehiculos(): string {
    const catId = this.concesionarioSeleccionado?.id;
    if (catId === 'airgator_marine' || catId === 'barcos') return 'Buscar aerodeslizador o embarcación...';
    if (catId === 'leonida_aviation' || catId === 'aviones' || catId === 'helicopteros') return 'Buscar aeronave o helicóptero...';
    if (catId === 'leonida_powersports' || catId === 'motos') return 'Buscar moto o quad...';
    if (catId === 'vice_fleet' || catId === 'especiales') return 'Buscar vehículo policial o táctico...';
    if (catId === 'vice_luxury') return 'Buscar superdeportivo de lujo...';
    return 'Buscar vehículo en Sunshine Autos...';
  }

  getBadgeLabelVehiculos(): string {
    const catId = this.concesionarioSeleccionado?.id;
    if (catId === 'airgator_marine' || catId === 'barcos') return 'embarcaciones';
    if (catId === 'leonida_aviation' || catId === 'aviones' || catId === 'helicopteros') return 'aeronaves';
    if (catId === 'leonida_powersports' || catId === 'motos') return 'motos y quads';
    return 'vehículos';
  }

  seleccionarVehiculo(vehiculo: GtaVehicle): void {
    this.vehiculoSeleccionado = vehiculo;
    if (this.isMobileView()) {
      this.openMobileReading();
    }
  }

  volverAlGridVehiculos(): void {
    this.vehiculoSeleccionado = null;
  }

  getVehicleIcon(v: GtaVehicle | null): string {
    if (!v) return 'fa-car';
    const cat = (v.category || v.class || '').toLowerCase();
    if (cat.includes('boat') || cat.includes('barco')) return 'fa-ship';
    if (cat.includes('plane') || cat.includes('avion') || cat.includes('avión')) return 'fa-plane';
    if (cat.includes('heli')) return 'fa-helicopter';
    if (cat.includes('motorcycle') || cat.includes('moto') || cat.includes('bike')) return 'fa-motorcycle';
    if (cat.includes('cycle') || cat.includes('bici')) return 'fa-bicycle';
    return 'fa-car';
  }

  limpiarConcesionario(): void {
    this.concesionarioSeleccionado = null;
    this.vehiculosConcesionario$ = null;
    this.vehiculosConcesionario = [];
    this.vehiculoSeleccionado = null;
    this.busquedaVehiculos = '';
    this.vehiculosSub?.unsubscribe();
  }

  cargarTrofeos(): void {
    if (this.trofeos.length > 0 || this.isLoadingTrofeos) return;
    this.isLoadingTrofeos = true;
    this.trofeosSub?.unsubscribe();
    this.trofeosSub = this.guiaService.getTrofeos('gta6').subscribe({
      next: (catalogo) => {
        this.trofeos = catalogo?.trofeos || [];
        this.trofeosResumen = catalogo?.resumen || this.calcularResumen(this.trofeos);
        this.isLoadingTrofeos = false;
      },
      error: (err) => {
        console.error('Error al cargar el catálogo de trofeos de GTA 6:', err);
        this.isLoadingTrofeos = false;
      }
    });
  }

  private calcularResumen(trofeos: TrofeoItem[]): TrofeosResumen {
    const resumen: TrofeosResumen = { total: trofeos.length, platino: 0, oro: 0, plata: 0, bronce: 0 };
    for (const t of trofeos) {
      resumen[t.tipo] += 1;
    }
    return resumen;
  }

  seleccionarTrofeoFiltro(tipo: TrofeoTipo | 'todos'): void {
    this.trofeoFiltro = tipo;
  }

  get trofeosFiltrados(): TrofeoItem[] {
    if (this.trofeoFiltro === 'todos') return this.trofeos;
    return this.trofeos.filter(t => t.tipo === this.trofeoFiltro);
  }

  get trofeosPorTipo(): { tipo: TrofeoTipo; titulo: string; trofeos: TrofeoItem[] }[] {
    const titulos: Record<TrofeoTipo, string> = {
      platino: 'Platino',
      oro: 'Oro',
      plata: 'Plata',
      bronce: 'Bronce'
    };
    return Gta6GuiaOfflineComponent.TROFEO_ORDEN
      .map(tipo => ({
        tipo,
        titulo: titulos[tipo],
        trofeos: this.trofeosFiltrados.filter(t => t.tipo === tipo)
      }))
      .filter(g => g.trofeos.length > 0);
  }

  getTrofeoTipoColor(tipo: TrofeoTipo): string {
    switch (tipo) {
      case 'platino': return '#7dd3fc';
      case 'oro': return '#fbbf24';
      case 'plata': return '#cbd5e1';
      case 'bronce': return '#d08b5b';
      default: return '#ffb833';
    }
  }

  getTrofeoTipoIcono(tipo: TrofeoTipo): string {
    switch (tipo) {
      case 'platino': return 'fa-trophy';
      case 'oro': return 'fa-medal';
      case 'plata': return 'fa-award';
      case 'bronce': return 'fa-shield-halved';
      default: return 'fa-trophy';
    }
  }

  getTrofeoModoLabel(modo: TrofeoItem['modo']): string {
    switch (modo) {
      case 'historia': return 'Modo Historia';
      case 'online': return 'GTA Online';
      default: return 'Historia + Online';
    }
  }

  getSectionColor(secId?: string): string {
    if (!secId) return '#ec4899';
    const s = secId.toLowerCase();
    if (s.includes('trofeo')) return '#ffffff';
    if (s.includes('prologo')) return '#3b82f6';
    if (s.includes('mision')) return '#ef4444';
    if (s.includes('protagonista')) return '#ec4899';
    if (s.includes('mundo') || s.includes('leonida')) return '#38bdf8';
    if (s.includes('mecanica')) return '#a855f7';
    if (s.includes('policial') || s.includes('ia-')) return '#f97316';
    if (s.includes('vehiculo')) return '#38bdf8';
    return '#ec4899';
  }

  isLightAccentSection(secId?: string): boolean {
    return this.getSectionColor(secId) === '#ffffff';
  }

  isAccordionSection(secId?: string): boolean {
    return secId === 'misiones-historia';
  }

  toggleGrupo(grupoId: string): void {
    if (this.expandedGrupos.has(grupoId)) {
      this.expandedGrupos.delete(grupoId);
    } else {
      this.expandedGrupos.add(grupoId);
    }
  }

  isGrupoExpanded(grupoId: string): boolean {
    if (this.busquedaOffline) return true;
    return this.expandedGrupos.has(grupoId);
  }

  trackByGrupoId(index: number, item: { id: string }): string {
    return item.id;
  }

  trackByArticuloId(index: number, item: GuiaArticuloResumen): string {
    return item.id;
  }

  getGruposAccordion(): { id: string; titulo: string; badge: string; icono: string; color: string; total: number; articulos: GuiaArticuloResumen[] }[] {
    if (!this.currentSection || !this.isAccordionSection(this.currentSection.id)) return [];
    const allArts = this.currentSection.articulos || [];
    const clean = (s?: string) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const query = clean(this.busquedaOffline).trim();

    return GRUPOS_MISIONES_GTA6.map(grupo => {
      const targetBadge = clean(grupo.badge);
      let arts = allArts.filter(a => clean(a.badge) === targetBadge);
      if (query) {
        arts = arts.filter(a =>
          clean(a.titulo).includes(query) ||
          clean(a.subtitulo).includes(query) ||
          clean(a.badge).includes(query)
        );
      }
      return {
        id: grupo.id,
        titulo: grupo.titulo,
        badge: grupo.badge,
        icono: grupo.icono,
        color: grupo.color,
        total: arts.length,
        articulos: arts
      };
    }).filter(g => g.articulos.length > 0);
  }

  limpiarBusquedaOffline(): void {
    this.busquedaOffline = '';
  }

  hasBuscadorSeccion(seccionId?: string): boolean {
    return seccionId === 'misiones-historia';
  }

  getPlaceholderBuscador(seccionId?: string): string {
    if (seccionId === 'misiones-historia') return 'Buscar misión o personaje...';
    return 'Buscar en esta sección...';
  }

  get articulosFiltradosSeccion(): GuiaArticuloResumen[] {
    if (!this.currentSection) return [];
    const raw = this.currentSection.articulos || [];
    const clean = (s?: string) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const query = clean(this.busquedaOffline).trim();
    if (!query) return raw;
    return raw.filter(a =>
      clean(a.titulo).includes(query) ||
      clean(a.subtitulo).includes(query) ||
      clean(a.badge).includes(query)
    );
  }

  getPersonajeClass(badge?: string): string {
    if (!badge) return '';
    const normalizedBadge = badge.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const badgeKeywordToClass: ReadonlyArray<readonly [string, string]> = [
      ['introduccion', 'personaje-introduccion'],
      ['duo', 'personaje-duo'],
      ['lucia', 'personaje-lucia'],
      ['jason', 'personaje-jason'],
      ['geografia', 'personaje-geografia'],
      ['distrito', 'personaje-distritos'],
      ['ecosistema', 'personaje-ecosistema'],
      ['mecanica', 'personaje-mecanicas'],
      ['vehiculo', 'personaje-vehiculos'],
      ['policial', 'personaje-policial'],
      ['tactica', 'personaje-tacticas']
    ];
    const matchedEntry = badgeKeywordToClass.find(([keyword]) => normalizedBadge.includes(keyword));
    return matchedEntry ? `guide-personaje ${matchedEntry[1]}` : '';
  }

  seleccionarArticulo(articuloId: string, openMobile: boolean = true): void {
    this.mostrarTrofeos = false;
    if (this.currentSection?.id === 'misiones-historia') {
      const art = this.currentSection.articulos?.find(a => a.id === articuloId);
      if (art?.badge) {
        const clean = (s?: string) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        const grupo = GRUPOS_MISIONES_GTA6.find(g => clean(g.badge) === clean(art.badge));
        if (grupo) {
          this.expandedGrupos.add(grupo.id);
        }
      }
    }
    this.isLoadingArticulo = true;
    this.articuloSub?.unsubscribe();
    this.articuloSub = this.guiaService.getArticulo('gta6', articuloId).subscribe({
      next: (articulo) => {
        this.selectedArticulo = articulo;
        this.renderedContent = this.renderMarkdown(articulo.contenidoMarkdown || '');
        this.isLoadingArticulo = false;
        if (openMobile && this.isMobileView()) {
          this.openMobileReading();
        }
      },
      error: (err) => {
        console.error(`Error al cargar el artículo ${articuloId}:`, err);
        this.isLoadingArticulo = false;
      }
    });
  }

  toggleThemeMode(): void {
    this.themeMode = this.themeMode === 'night' ? 'day' : 'night';
  }

  onGta6MapClick(event: Event): void {
    if (!this.isDevAllowed) {
      event.preventDefault();
      event.stopPropagation();
      this.mostrarToast('El mapa de GTA 6 estará disponible próximamente');
    }
  }

  onSearch(): void {
    if (!this.searchQuery.trim()) {
      this.searchResults = [];
      return;
    }

    this.searchSub?.unsubscribe();
    this.searchSub = this.guiaService.buscarArticulos('gta6', this.searchQuery).subscribe({
      next: (results) => {
        this.searchResults = results;
      },
      error: (err) => {
        console.error('Error en búsqueda de artículos:', err);
      }
    });
  }

  limpiarBusqueda(): void {
    this.searchQuery = '';
    this.searchResults = [];
  }

  scrollToSection(sectionId: string): void {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  private renderMarkdown(raw: string): string {
    if (!raw) {
      this.articleToc = [];
      return '';
    }

    const lines = raw.split('\n');
    const root = document.createElement('div');
    const toc: { id: string; text: string }[] = [];
    let currentList: HTMLUListElement | null = null;
    let sectionCounter = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      const isSubBullet = /^\s{2,}[-*]\s+/.test(line);
      const isBullet = /^\s*[-*]\s+/.test(line);
      if (!isBullet && currentList) {
        root.appendChild(currentList);
        currentList = null;
      }

      if (line.startsWith('### ')) {
        const rawText = line.substring(4).trim();
        const secId = `sec-g6-${sectionCounter++}`;
        const cleanText = rawText.replace(/\*\*/g, '').replace(/`/g, '');
        toc.push({ id: secId, text: cleanText });

        const h3 = document.createElement('h3');
        h3.className = 'guide-h3';
        h3.id = secId;
        const accent = document.createElement('span');
        accent.className = 'guide-h3-accent';
        h3.appendChild(accent);
        this.appendInline(h3, rawText);
        root.appendChild(h3);
      } else if (line.startsWith('## ')) {
        const h2 = document.createElement('h2');
        h2.className = 'guide-h2';
        this.appendInline(h2, line.substring(3));
        root.appendChild(h2);
      } else if (line.startsWith('> ')) {
        const callout = document.createElement('div');
        callout.className = 'guide-callout';
        const iconDiv = document.createElement('div');
        iconDiv.className = 'guide-callout-icon';

        const svgNS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(svgNS, 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('width', '20');
        svg.setAttribute('height', '20');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '2');

        const circle = document.createElementNS(svgNS, 'circle');
        circle.setAttribute('cx', '12');
        circle.setAttribute('cy', '12');
        circle.setAttribute('r', '10');
        svg.appendChild(circle);

        const l1 = document.createElementNS(svgNS, 'line');
        l1.setAttribute('x1', '12');
        l1.setAttribute('y1', '16');
        l1.setAttribute('x2', '12');
        l1.setAttribute('y2', '12');
        svg.appendChild(l1);

        const l2 = document.createElementNS(svgNS, 'line');
        l2.setAttribute('x1', '12');
        l2.setAttribute('y1', '8');
        l2.setAttribute('x2', '12.01');
        l2.setAttribute('y2', '8');
        svg.appendChild(l2);

        iconDiv.appendChild(svg);
        callout.appendChild(iconDiv);

        const bodyDiv = document.createElement('div');
        bodyDiv.className = 'guide-callout-body';
        this.appendInline(bodyDiv, line.substring(2));
        callout.appendChild(bodyDiv);
        root.appendChild(callout);
      } else if (line.trim() === '---') {
        const hr = document.createElement('hr');
        hr.className = 'guide-divider-line';
        root.appendChild(hr);
      } else if (isBullet) {
        if (!currentList) {
          currentList = document.createElement('ul');
          currentList.className = 'guide-list';
        }
        const match = line.match(/^\s*[-*]\s+(.*)/);
        const li = document.createElement('li');
        li.className = isSubBullet ? 'guide-list-item guide-list-subitem' : 'guide-list-item';
        const bullet = document.createElement('span');
        bullet.className = 'guide-list-bullet';
        bullet.textContent = '\u203A';
        li.appendChild(bullet);
        const textSpan = document.createElement('span');
        textSpan.className = 'guide-list-text';
        if (match) {
          this.appendInline(textSpan, match[1]);
        }
        li.appendChild(textSpan);
        currentList.appendChild(li);
      } else if (line.trim().length > 0) {
        const p = document.createElement('p');
        p.className = 'guide-p';
        this.appendInline(p, line);
        root.appendChild(p);
      }
    }

    if (currentList) {
      root.appendChild(currentList);
    }

    this.articleToc = toc;
    return Array.from(root.childNodes).map(node => new XMLSerializer().serializeToString(node)).join('');
  }

  private appendInline(parent: HTMLElement, text: string): void {
    if (!text) return;
    const tokenRegex = /(\*\*.*?\*\*|\*[^*]+\*|`[^`]+`)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = tokenRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parent.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
      }
      const token = match[0];
      if (token.startsWith('**') && token.endsWith('**')) {
        const strong = document.createElement('strong');
        strong.className = 'guide-strong';
        strong.textContent = token.slice(2, -2);
        parent.appendChild(strong);
      } else if (token.startsWith('*') && token.endsWith('*')) {
        const em = document.createElement('em');
        em.className = 'guide-em';
        em.textContent = token.slice(1, -1);
        parent.appendChild(em);
      } else if (token.startsWith('`') && token.endsWith('`')) {
        const code = document.createElement('span');
        code.className = 'guide-chip-code';
        code.textContent = token.slice(1, -1);
        parent.appendChild(code);
      }
      lastIndex = tokenRegex.lastIndex;
    }
    if (lastIndex < text.length) {
      parent.appendChild(document.createTextNode(text.slice(lastIndex)));
    }
  }
}
