import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { Title, Meta, DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { GuiaService } from '../../../services/guia.service';
import { CookieService } from '../../../services/cookie.service';
import { GuiaManifest, GuiaSeccion, GuiaArticulo, GuiaArticuloResumen, TrofeoItem, TrofeoTipo, TrofeosResumen } from '../../../models/guia';
import { isDevAccessAllowed } from '../../../services/dev-access.guard';
import { Subscription } from 'rxjs';
import { GRUPOS_MISIONES_GTA6 } from './misiones-grupos.config';

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
  renderedContent: SafeHtml = '';
  articleToc: { id: string; text: string }[] = [];
  readingProgress: number = 0;
  showScrollTop: boolean = false;
  toastMessage: string | null = null;
  mobileNavOpen: boolean = false;
  private toastTimeout: any = null;

  mostrarTrofeos: boolean = false;
  isLoadingTrofeos: boolean = false;
  trofeos: TrofeoItem[] = [];
  trofeosResumen: TrofeosResumen = { total: 0, platino: 0, oro: 0, plata: 0, bronce: 0 };
  trofeoFiltro: TrofeoTipo | 'todos' = 'todos';

  private static readonly TROFEO_ORDEN: TrofeoTipo[] = ['platino', 'oro', 'plata', 'bronce'];

  getSeccionContador(seccion: GuiaSeccion): number {
    if (seccion.id === 'trofeos') {
      return this.trofeosResumen.total;
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
    this.scrollToTop();
  }

  private isMobileView(): boolean {
    return typeof window !== 'undefined' && window.innerWidth <= 850;
  }

  get breadcrumbs(): GuiaBreadcrumbItem[] {
    const items: GuiaBreadcrumbItem[] = [];
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

  constructor(
    private guiaService: GuiaService,
    public cookieService: CookieService,
    private titleService: Title,
    private metaService: Meta,
    private sanitizer: DomSanitizer
  ) {}

  ngOnDestroy(): void {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
      this.toastTimeout = null;
    }
    this.manifestSub?.unsubscribe();
    this.articuloSub?.unsubscribe();
    this.searchSub?.unsubscribe();
    this.trofeosSub?.unsubscribe();
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
          this.seleccionarArticulo(this.secciones[0].articulos[0].id);
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
    if (this.isMobileView()) {
      this.scrollToTop();
    }
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
        const secId = `sec-g6-${sectionCounter++}`;
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
