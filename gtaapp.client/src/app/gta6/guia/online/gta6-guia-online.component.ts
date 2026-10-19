import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { Title, Meta, DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { GuiaService } from '../../../services/guia.service';
import { CookieService } from '../../../services/cookie.service';
import { GuiaManifest, GuiaSeccion, GuiaArticulo, GuiaArticuloResumen } from '../../../models/guia';
import { isDevAccessAllowed } from '../../../services/dev-access.guard';
import { Subscription, Observable, forkJoin, map, shareReplay } from 'rxjs';
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
  readonly isDevAllowed: boolean = isDevAccessAllowed();

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
  renderedContent: SafeHtml = '';
  articleToc: { id: string; text: string }[] = [];
  readingProgress: number = 0;
  showScrollTop: boolean = false;
  toastMessage: string | null = null;
  mobileNavOpen: boolean = false;
  private toastTimeout: any = null;

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

  constructor(
    private guiaService: GuiaService,
    public cookieService: CookieService,
    private titleService: Title,
    private metaService: Meta,
    private sanitizer: DomSanitizer
  ) {
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

  toggleMobileNav(): void {
    this.mobileNavOpen = !this.mobileNavOpen;
  }

  closeMobileNav(): void {
    this.mobileNavOpen = false;
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
          this.seleccionarArticulo(this.secciones[0].articulos[0].id);
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

  seleccionarConcesionario(concesionario: DealerCategory): void {
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
    if (catId === 'barcos') return 'Buscar embarcación...';
    if (catId === 'aviones') return 'Buscar avión...';
    if (catId === 'helicopteros') return 'Buscar helicóptero...';
    if (catId === 'motos') return 'Buscar moto...';
    if (catId === 'especiales') return 'Buscar vehículo militar o especial...';
    return 'Buscar vehículo por modelo o marca...';
  }

  getBadgeLabelVehiculos(): string {
    const catId = this.concesionarioSeleccionado?.id;
    if (catId === 'barcos') return 'embarcaciones';
    if (catId === 'aviones') return 'aeronaves';
    if (catId === 'helicopteros') return 'helicópteros';
    if (catId === 'motos') return 'motos';
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

  private renderMarkdown(raw: string): SafeHtml {
    if (!raw) {
      this.articleToc = [];
      return this.sanitizer.bypassSecurityTrustHtml('');
    }

    const lines = raw.split('\n');
    const out: string[] = [];
    const toc: { id: string; text: string }[] = [];
    let inList = false;
    let sectionCounter = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      const isSubBullet = /^\s{2,}[\*\-]\s+(.*)$/.test(line);
      const isBullet = /^\s*[\*\-]\s+(.*)$/.test(line);
      if (!isBullet && inList) {
        out.push('</ul>');
        inList = false;
      }

      if (line.startsWith('### ')) {
        const rawText = line.substring(4).trim();
        const heading = this.formatInline(rawText);
        const secId = `sec-g6o-${sectionCounter++}`;
        const cleanText = rawText.replace(/\*\*/g, '').replace(/`/g, '');
        toc.push({ id: secId, text: cleanText });
        out.push(`<h3 class="guide-h3" id="${secId}"><span class="guide-h3-accent"></span>${heading}</h3>`);
      } else if (line.startsWith('## ')) {
        const heading = this.formatInline(line.substring(3));
        out.push(`<h2 class="guide-h2">${heading}</h2>`);
      } else if (line.startsWith('> ')) {
        const calloutText = this.formatInline(line.substring(2));
        out.push(`
          <div class="guide-callout">
            <div class="guide-callout-icon">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
            </div>
            <div class="guide-callout-body">${calloutText}</div>
          </div>
        `);
      } else if (line.trim() === '---') {
        out.push('<hr class="guide-divider-line" />');
      } else if (isBullet) {
        if (!inList) {
          out.push('<ul class="guide-list">');
          inList = true;
        }
        const match = line.match(/^\s*[\*\-]\s+(.*)$/);
        const text = match ? this.formatInline(match[1]) : '';
        const subClass = isSubBullet ? ' guide-list-subitem' : '';
        out.push(`<li class="guide-list-item${subClass}"><span class="guide-list-bullet">›</span><span class="guide-list-text">${text}</span></li>`);
      } else if (line.trim().length > 0) {
        const p = this.formatInline(line);
        out.push(`<p class="guide-p">${p}</p>`);
      }
    }

    if (inList) {
      out.push('</ul>');
    }

    this.articleToc = toc;
    return this.sanitizer.bypassSecurityTrustHtml(out.join('\n'));
  }

  private formatInline(text: string): string {
    if (!text) return '';
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong class="guide-strong">$1</strong>');
    formatted = formatted.replace(/\*([^*]+)\*/g, '<em class="guide-em">$1</em>');
    formatted = formatted.replace(/`([^`]+)`/g, '<span class="guide-chip-code">$1</span>');
    return formatted;
  }
}
