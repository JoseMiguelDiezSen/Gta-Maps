import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, HostListener, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { GuiaService } from '../../../services/guia.service';
import { CookieService } from '../../../services/cookie.service';
import { GuiaManifest, GuiaSeccion, GuiaArticulo, GuiaArticuloResumen } from '../../../models/guia';
import { Subscription, Observable, forkJoin, map, shareReplay, take } from 'rxjs';
import { DealerCategory, GtaVehicle } from '../../../models/gta5/vehicle';
import { CATEGORIAS_VEHICULOS_GTA6 } from '../vehiculos-gta6.config';

export interface GuiaBreadcrumbItem {
  label: string;
  clickable: boolean;
  action?: () => void;
}

@Component({
  selector: 'app-gta6-guia-online',
  templateUrl: './gta6-guia-online.component.html',
  styleUrls: ['../offline/gta6-guia-offline.component.css', './gta6-guia-online.component.css'],
  standalone: false
})
export class Gta6GuiaOnlineComponent implements OnInit, OnDestroy, AfterViewInit {

  manifest: GuiaManifest | null = null;
  secciones: GuiaSeccion[] = [];
  currentSection: GuiaSeccion | null = null;
  selectedArticulo: GuiaArticulo | null = null;
  selectedSeccionId: string = 'todas';

  readonly concesionarios: DealerCategory[] = CATEGORIAS_VEHICULOS_GTA6;
  readonly dealerCounts$: Observable<Record<string, number>>;
  concesionarioSeleccionado: DealerCategory | null = null;
  vehiculosConcesionario$: Observable<GtaVehicle[]> | null = null;
  vehiculosConcesionario: GtaVehicle[] = [];
  vehiculoSeleccionado: GtaVehicle | null = null;
  busquedaVehiculos: string = '';
  private vehiculosSub?: Subscription;

  getSeccionContador(seccion: GuiaSeccion): number {
    if (seccion.id === 'vehiculos') {
      return this.concesionarios.length;
    }
    return seccion.articulos ? seccion.articulos.length : 0;
  }

  themeMode: 'night' | 'day' = 'night';
  searchQuery: string = '';
  searchResults: GuiaArticuloResumen[] = [];
  isLoading: boolean = true;
  isLoadingArticulo: boolean = false;
  renderedContent: string = '';
  readingProgress: number = 0;
  showScrollTop: boolean = false;
  toastMessage: string | null = null;
  private toastTimeout: ReturnType<typeof setTimeout> | null = null;

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
    this.scrollToTop();
  }

  goToCategoriesFromReading(): void {
    this.isMobileReadingOpen = false;
    this.currentSection = null;
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

  private readonly guiaService = inject(GuiaService);
  public readonly cookieService = inject(CookieService);
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);

  constructor() {
    this.dealerCounts$ = forkJoin(
      this.concesionarios.map(d =>
        this.guiaService.getVehiculosGuiaGta6('online', d.id).pipe(
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
    this.vehiculosSub?.unsubscribe();
  }

  ngOnInit(): void {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }

    this.cargarGuia();
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
    return this.articulosVisibles;
  }

  get capituloAnterior(): GuiaArticuloResumen | null {
    if (!this.selectedArticulo) return null;
    const lista = this.articulosSeccionActual;
    const idx = lista.findIndex(a => a.id === this.selectedArticulo!.id);
    return idx > 0 ? lista[idx - 1] : null;
  }

  get capituloSiguiente(): GuiaArticuloResumen | null {
    if (!this.selectedArticulo) return null;
    const lista = this.articulosSeccionActual;
    const idx = lista.findIndex(a => a.id === this.selectedArticulo!.id);
    return idx >= 0 && idx < lista.length - 1 ? lista[idx + 1] : null;
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardNav(event: KeyboardEvent): void {
    const active = document.activeElement;
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
      return;
    }

    if (event.key === 'ArrowLeft' && this.capituloAnterior) {
      event.preventDefault();
      this.seleccionarArticulo(this.capituloAnterior.id);
      this.scrollActiveChapterIntoView();
    } else if (event.key === 'ArrowRight' && this.capituloSiguiente) {
      event.preventDefault();
      this.seleccionarArticulo(this.capituloSiguiente.id);
      this.scrollActiveChapterIntoView();
    }
  }

  private scrollActiveChapterIntoView(): void {
    setTimeout(() => {
      const activeEl = document.querySelector('.guide-chapter-card.is-active');
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

  cargarGuia(): void {
    this.isLoading = true;
    this.manifestSub?.unsubscribe();
    this.manifestSub = this.guiaService.getManifest('gta6-online').subscribe({
      next: (data) => {
        this.manifest = data;
        this.secciones = data.secciones || [];
        this.isLoading = false;

        if (this.secciones.length > 0 && this.secciones[0].articulos.length > 0) {
          this.seleccionarArticulo(this.secciones[0].articulos[0].id, false);
        }
      },
      error: (err) => {
        console.error('Error al cargar la guía de GTA 6 Online:', err);
        this.isLoading = false;
      }
    });
  }

  seleccionarSeccion(seccionId: string): void {
    this.selectedSeccionId = seccionId;
  }

  openSection(sec: GuiaSeccion): void {
    this.currentSection = sec;
    this.selectedSeccionId = sec.id;
    this.isMobileReadingOpen = false;
    if (sec.id === 'vehiculos') {
      this.selectedArticulo = null;
      this.limpiarConcesionario();
      if (!this.isMobileView()) {
        this.abrirPrimerConcesionarioConVehiculos();
      }
      return;
    }
    if (sec.articulos && sec.articulos.length > 0) {
      this.seleccionarArticulo(sec.articulos[0].id, false);
    }
    if (this.isMobileView()) {
      this.scrollToTop();
    }
  }

  backToSections(): void {
    this.currentSection = null;
    this.isMobileReadingOpen = false;
    this.limpiarConcesionario();
    if (this.isMobileView()) {
      this.scrollToTop();
    }
  }

  private abrirPrimerConcesionarioConVehiculos(): void {
    this.dealerCounts$.pipe(take(1)).subscribe(counts => {
      const primero = this.concesionarios.find(d => counts[d.id] > 0) ?? this.concesionarios[0];
      if (primero && !this.concesionarioSeleccionado) {
        this.seleccionarConcesionario(primero, false);
      }
    });
  }

  seleccionarConcesionario(concesionario: DealerCategory, abrirEnMovil: boolean = true): void {
    this.concesionarioSeleccionado = concesionario;
    this.vehiculoSeleccionado = null;
    this.busquedaVehiculos = '';
    this.vehiculosConcesionario = [];
    this.vehiculosSub?.unsubscribe();
    this.vehiculosConcesionario$ = this.guiaService
      .getVehiculosGuiaGta6('online', concesionario.id)
      .pipe(shareReplay(1));
    this.vehiculosSub = this.vehiculosConcesionario$.subscribe(list => {
      this.vehiculosConcesionario = list || [];
    });
    if (abrirEnMovil && this.isMobileView()) {
      this.openMobileReading();
    }
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
    if (catId === 'airgator_marine') return 'Buscar embarcación...';
    if (catId === 'leonida_aviation') return 'Buscar avión o helicóptero...';
    if (catId === 'leonida_powersports') return 'Buscar moto...';
    if (catId === 'vice_fleet') return 'Buscar vehículo militar o especial...';
    return 'Buscar vehículo por modelo o marca...';
  }

  getBadgeLabelVehiculos(): string {
    const catId = this.concesionarioSeleccionado?.id;
    if (catId === 'airgator_marine') return 'embarcaciones';
    if (catId === 'leonida_aviation') return 'aeronaves';
    if (catId === 'leonida_powersports') return 'motos';
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

  getSectionColor(secId?: string): string {
    if (!secId) return '#22c55e';
    const s = secId.toLowerCase();
    if (s.includes('prologo')) return '#3b82f6';
    if (s.includes('mision') || s.includes('trabajo')) return '#22c55e';
    if (s.includes('negocio') || s.includes('economia')) return '#06b6d4';
    if (s.includes('golpe')) return '#eab308';
    if (s.includes('vehiculo')) return '#38bdf8';
    return '#22c55e';
  }

  seleccionarArticulo(articuloId: string, openMobile: boolean = true): void {
    this.isLoadingArticulo = true;
    this.articuloSub?.unsubscribe();
    this.articuloSub = this.guiaService.getArticulo('gta6-online', articuloId).subscribe({
      next: (articulo) => {
        this.selectedArticulo = articulo;
        this.renderedContent = articulo.contenidoMarkdown || '';
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

  onGta6MapBlocked(): void {
    this.mostrarToast('El mapa de GTA 6 estará disponible próximamente');
  }

  onSearch(): void {
    if (!this.searchQuery.trim()) {
      this.searchResults = [];
      return;
    }

    this.searchSub?.unsubscribe();
    this.searchSub = this.guiaService.buscarArticulos('gta6-online', this.searchQuery).subscribe({
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
}
