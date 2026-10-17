import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { Title, Meta, DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { GuiaService } from '../../../services/guia.service';
import { CookieService } from '../../../services/cookie.service';
import { GuiaManifest, GuiaSeccion, GuiaArticulo, GuiaArticuloResumen, TrofeoItem, TrofeoTipo, TrofeosResumen } from '../../../models/guia';
import { isDevAccessAllowed } from '../../../services/dev-access.guard';
import { Subscription } from 'rxjs';

export interface GuiaBreadcrumbItem {
  label: string;
  clickable: boolean;
  action?: () => void;
}

@Component({
  selector: 'app-gta5-guia-offline',
  templateUrl: './gta5-guia-offline.component.html',
  styleUrls: ['./gta5-guia-offline.component.css'],
  standalone: false
})
export class Gta5GuiaOfflineComponent implements OnInit, OnDestroy, AfterViewInit {
  readonly isDevAllowed: boolean = isDevAccessAllowed();

  manifest: GuiaManifest | null = null;
  secciones: GuiaSeccion[] = [];
  currentSection: GuiaSeccion | null = null;
  currentSubcategory: string | null = null;
  currentGolpe: string | null = null;
  selectedArticulo: GuiaArticulo | null = null;
  
  themeMode: 'night' | 'day' = 'night';
  busquedaOffline: string = '';
  searchQuery: string = '';
  searchResults: GuiaArticuloResumen[] = [];
  isLoading: boolean = true;
  isLoadingArticulo: boolean = false;
  renderedContent: SafeHtml = '';
  showScrollTop: boolean = false;
  toastMessage: string | null = null;
  private toastTimeout: any = null;

  mobileNavOpen: boolean = false;

  toggleMobileNav(): void {
    this.mobileNavOpen = !this.mobileNavOpen;
  }

  closeMobileNav(): void {
    this.mobileNavOpen = false;
  }

  /* Estado de navegación por niveles en móvil (estilo Info-Panel Coches/Armas) */
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
    this.currentSubcategory = null;
    this.currentGolpe = null;
    this.mostrarTrofeos = false;
    this.scrollToTop();
  }

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
    if (seccion.id === 'golpes') {
      return 6;
    }
    return seccion.articulos.length;
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

  get breadcrumbs(): GuiaBreadcrumbItem[] {
    if (!this.selectedArticulo) return [];

    const items: GuiaBreadcrumbItem[] = [];
    const art = this.selectedArticulo;

    let sec = this.currentSection;
    if (!sec) {
      sec = this.secciones.find(s => s.articulos?.some(a => a.id === art.id))
        || this.secciones.find(s => s.id === art.categoria)
        || null;
    }

    const heists = this.getGolpesList();
    const heistFound = heists.find(h => h.missionIds.includes(art.id));
    const isGolpeContext = (sec?.id === 'golpes') || !!this.currentGolpe || (this.currentSubcategory === 'golpes');

    if (isGolpeContext && heistFound) {
      const secGolpes = this.secciones.find(s => s.id === 'golpes') || sec;
      items.push({
        label: secGolpes ? secGolpes.titulo : 'Golpes y Atracos',
        clickable: true,
        action: () => {
          if (secGolpes) this.openSection(secGolpes);
          this.currentGolpe = null;
        }
      });

      const heistTitle = heistFound.titulo.replace(/^\d+\.\s*/, '').replace(/\s*\(.*?\)$/, '');
      items.push({
        label: heistTitle || heistFound.titulo,
        clickable: true,
        action: () => {
          if (secGolpes) this.openSection(secGolpes);
          this.openGolpe(heistFound.id);
        }
      });

      items.push({
        label: this.cleanBreadcrumbTitle(art.titulo),
        clickable: false
      });

      return items;
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
    return title
      .replace(/^\d+\.\s*/, '')
      .replace(/\s*\((Tonya|Beverly|Hao|Barry|Mary-Ann|Cletus|Dom|Maude|Patrulla|Peter Dreyfuss|Epsilon|Josh|Nigel|Abigail[^)]*|[^)]*Sasquatch[^)]*)\s*\d*\)$/i, '')
      .trim();
  }

  cleanBreadcrumbTitle(title?: string): string {
    return this.getCleanMissionTitle(title);
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
    this.showScrollTop = el.scrollTop > 400;
  }

  scrollToTop(): void {
    if (this.wikiShellRef?.nativeElement) {
      this.wikiShellRef.nativeElement.scrollTo({ top: 0, behavior: 'smooth' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private isMobileView(): boolean {
    return typeof window !== 'undefined' && window.innerWidth <= 850;
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
    this.manifestSub = this.guiaService.getManifest('gta5').subscribe({
      next: (data) => {
        this.manifest = data;
        this.secciones = data.secciones || [];
        this.isLoading = false;
        
        if (this.secciones.length > 0 && this.secciones[0].articulos.length > 0) {
          this.seleccionarArticulo(this.secciones[0].articulos[0].id, false);
        }
      },
      error: (err) => {
        console.error('Error al cargar la guía de GTA 5:', err);
        this.isLoading = false;
      }
    });
  }

  openSection(sec: GuiaSeccion): void {
    this.busquedaOffline = '';
    this.currentSection = sec;
    this.currentSubcategory = null;
    this.currentGolpe = null;
    if (sec.id === 'trofeos') {
      this.mostrarTrofeos = true;
      this.isMobileReadingOpen = true;
      this.cargarTrofeos();
    } else {
      this.mostrarTrofeos = false;
      this.isMobileReadingOpen = false;
      if (sec.articulos && sec.articulos.length > 0 && !this.hasSubcategorias(sec) && sec.id !== 'golpes') {
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
    this.currentSubcategory = null;
    this.currentGolpe = null;
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
    this.trofeosSub = this.guiaService.getTrofeos('gta5').subscribe({
      next: (catalogo) => {
        this.trofeos = catalogo?.trofeos || [];
        this.trofeosResumen = catalogo?.resumen || this.calcularResumen(this.trofeos);
        this.isLoadingTrofeos = false;
      },
      error: (err) => {
        console.error('Error al cargar el catálogo de trofeos:', err);
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
    return Gta5GuiaOfflineComponent.TROFEO_ORDEN
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

  openSubcategory(subcatId: string): void {
    this.busquedaOffline = '';
    this.currentSubcategory = subcatId;
    this.currentGolpe = null;
    this.isMobileReadingOpen = false;
    if (this.isMobileView()) {
      this.scrollToTop();
    }
  }

  backToSubcategories(): void {
    this.busquedaOffline = '';
    this.currentSubcategory = null;
    this.currentGolpe = null;
    this.isMobileReadingOpen = false;
    if (this.isMobileView()) {
      this.scrollToTop();
    }
  }

  openGolpe(golpeId: string): void {
    this.currentGolpe = golpeId;
    this.isMobileReadingOpen = false;
    if (this.isMobileView()) {
      this.scrollToTop();
    }
  }

  backToGolpes(): void {
    this.currentGolpe = null;
    this.isMobileReadingOpen = false;
    if (this.isMobileView()) {
      this.scrollToTop();
    }
  }

  hasSubcategorias(sec: GuiaSeccion | null): boolean {
    if (!sec) return false;
    return false;
  }

  getGolpesList(): { id: string; titulo: string; icono: string; color: string; total: number; missionIds: string[] }[] {
    const golpes = [
      {
        id: 'joyeria',
        titulo: '1. Golpe a la Joyería (Vangelico)',
        icono: 'gem',
        color: '#38bdf8',
        missionIds: ['mision-11-caso-joyero', 'mision-12-equipo-bugstars', 'mision-13-granadas-gas-bz', 'mision-14-golpe-joyeria']
      },
      {
        id: 'merryweather',
        titulo: '2. Golpe a Merryweather',
        icono: 'anchor',
        color: '#0284c7',
        missionIds: ['mision-26-reconocimiento-del-puerto', 'mision-27-minisubmarino', 'mision-28-cargobob', 'mision-29-golpe-a-merryweather']
      },
      {
        id: 'blitz-play',
        titulo: '3. Asalto Táctico: El Buzo (Blitz Play)',
        icono: 'truck-fast',
        color: '#eab308',
        missionIds: ['mision-30-camion-de-basura', 'mision-31-grua', 'mision-32-el-buzo']
      },
      {
        id: 'paleto',
        titulo: '4. Golpe al Banco de Paleto',
        icono: 'building-columns',
        color: '#65a30d',
        missionIds: ['mision-39-el-bloqueo', 'mision-41-material-militar', 'mision-42-golpe-de-paleto']
      },
      {
        id: 'fib-raid',
        titulo: '5. Asalto a la Sede del FIB',
        icono: 'building-shield',
        color: '#a855f7',
        missionIds: ['mision-51-limpiando-el-fib', 'mision-53-arquitecto-para-todo', 'mision-55-asalto-al-fib']
      },
      {
        id: 'gran-golpe',
        titulo: '6. El Gran Golpe (Union Depository)',
        icono: 'vault',
        color: '#f59e0b',
        missionIds: ['mision-46-investigando-el-golpe', 'mision-59-perforadoras', 'mision-60-via-muerta', 'mision-61-el-gran-golpe']
      }
    ];

    return golpes.map(g => ({
      ...g,
      total: g.missionIds.length
    }));
  }

  getSubcategoriasTematicas(sec: GuiaSeccion | null): { id: string; titulo: string; badge: string; badges?: string[]; missionIds?: string[]; icono: string; color?: string; total: number }[] {
    if (!sec) return [];
    
    if (sec.id === 'extranos-locos') {
      const temas = [
        { id: 'Tonya', titulo: 'Tonya Wiggins', badge: 'Tonya', icono: 'truck-pickup', color: '#f97316' },
        { id: 'Beverly', titulo: 'Beverly Felton (Paparazzo)', badge: 'Beverly', icono: 'camera', color: '#ec4899' },
        { id: 'Hao', titulo: 'Hao (Carreras)', badge: 'Hao', icono: 'flag-checkered', color: '#f97316' },
        { id: 'Barry', titulo: 'Barry (Movimiento Verde)', badge: 'Barry', icono: 'cannabis', color: '#16a34a' },
        { id: 'Mary-Ann', titulo: 'Mary-Ann Quinn', badge: 'Mary-Ann', icono: 'person-running', color: '#2563eb' },
        { id: 'Cletus', titulo: 'Cletus Ewing (Caza)', badge: 'Cletus', icono: 'crosshairs', color: '#a16207' },
        { id: 'Dom', titulo: 'Dom Beasley (Riesgo Extremo)', badge: 'Dom', icono: 'parachute-box', color: '#eab308' },
        { id: 'Maude', titulo: 'Maude Eccles (Fianzas)', badge: 'Maude', icono: 'handcuffs', color: '#94a3b8' },
        { id: 'Patrulla', titulo: 'Patrulla Fronteriza Civil', badge: 'Patrulla', icono: 'shield-halved', color: '#65a30d' },
        { id: 'Dreyfuss', titulo: 'Peter Dreyfuss', badge: 'Dreyfuss', icono: 'star', color: '#9f1239' },
        { id: 'Epsilon', titulo: 'Programa Epsilon (Kifflom)', badge: 'Epsilon', icono: 'cross', color: '#38bdf8' },
        { id: 'Josh', titulo: 'Josh Bernstein (Inmobiliaria)', badge: 'Josh', icono: 'building', color: '#64748b' },
        { id: 'Nigel', titulo: 'Nigel y Sra. Thornhill', badge: 'Nigel', icono: 'glasses', color: '#d97706' },
        { id: 'Masacre', titulo: 'Masacres de Trevor', badge: 'Masacre', icono: 'skull', color: '#ef4444' },
        { id: 'Abigail', titulo: 'Abigail Mathers', badge: 'Abigail', icono: 'water', color: '#0284c7' },
        { id: 'Sasquatch', titulo: 'El Sasquatch (Bigfoot)', badge: 'Sasquatch', icono: 'paw', color: '#ffffff' }
      ];

      return temas.map(t => ({
        ...t,
        total: (sec.articulos || []).filter(a => a.badge === t.badge).length
      })).filter(t => t.total > 0);
    }

    if (sec.id === 'misiones-historia') {
      const temas = [
        { id: 'franklin', titulo: 'Franklin Clinton', missionIds: ['mision-02-franklin-y-lamar', 'mision-03-embargo', 'mision-05-chop', 'mision-10-el-largo-trecho', 'mision-49-carne-fresca', 'mision-57-lamar-de-problemas'], badge: 'Franklin', icono: 'car', color: '#22c55e' },
        { id: 'michael', titulo: 'Michael De Santa', missionIds: ['mision-08-nina-de-papa', 'mision-09-solicitud-de-amistad', 'mision-21-muerto-en-vida', 'mision-25-alguien-dijo-yoga', 'mision-33-el-senor-richards', 'mision-50-la-balada-de-rocco', 'mision-52-reuniendo-a-la-familia', 'mision-54-problemas-legales', 'mision-58-cataclismo'], badge: 'Michael', icono: 'user-tie', color: '#3b82f6' },
        { id: 'trevor', titulo: 'Trevor Philips', missionIds: ['mision-15-senor-philips', 'mision-16-trevor-philips-industries', 'mision-17-ron-el-nervioso', 'mision-18-laberinto-de-cristal', 'mision-19-reencuentro', 'mision-38-pasajero-clandestino', 'mision-40-depredador', 'mision-45-hang-ten'], badge: 'Trevor', icono: 'skull', color: '#f97316' },
        { id: 'golpes', titulo: 'Golpes y Atracos', badge: 'Golpes', icono: 'vault', color: '#eab308', total: 6 },
        { id: 'lester', titulo: 'Asesinatos de Lester', missionIds: ['mision-62-el-asesinato-del-hotel', 'mision-63-el-asesinato-multiple', 'mision-64-el-asesinato-del-vicio', 'mision-65-el-asesinato-del-autobus', 'mision-66-el-asesinato-de-la-obra'], badge: 'Lester', icono: 'crosshairs', color: '#a855f7' },
        { id: 'fib', titulo: 'Operaciones FIB y Contactos', missionIds: ['mision-04-complicaciones', 'mision-06-padre-e-hijo', 'mision-07-asesoramiento-matrimonial', 'mision-20-fama-o-drama', 'mision-22-tres-son-multitud', 'mision-23-de-libro', 'mision-24-safari-por-el-barrio', 'mision-34-enfrentamiento-con-la-ley', 'mision-35-el-ojo-en-el-cielo', 'mision-36-caida-libre', 'mision-37-en-el-fondo-del-mar', 'mision-43-descarrilado', 'mision-44-el-mono-se-la-gana', 'mision-47-enterrando-el-hacha', 'mision-48-secuestrador', 'mision-56-el-enredo'], badge: 'FIB', icono: 'users', color: '#06b6d4' },
        { id: 'finales', titulo: 'Finales de la Historia', missionIds: ['mision-01-prologo', 'mision-67-opcion-a', 'mision-68-opcion-b', 'mision-69-opcion-c'], badge: 'Finales', icono: 'flag-checkered', color: '#ef4444' }
      ];

      return temas.map(t => {
        if ('total' in t && t.total !== undefined) {
          return {
            id: t.id,
            titulo: t.titulo,
            badge: t.badge,
            icono: t.icono,
            color: t.color,
            total: t.total
          };
        }
        const mIds = (t as any).missionIds as string[] | undefined;
        const count = mIds 
          ? (sec.articulos || []).filter(a => mIds.includes(a.id)).length
          : 0;
        return {
          id: t.id,
          titulo: t.titulo,
          badge: t.badge,
          missionIds: mIds,
          icono: t.icono,
          color: t.color,
          total: count
        };
      }).filter(t => t.total > 0);
    }

    return [];
  }

  get articulosSubcategoriaActual(): GuiaArticuloResumen[] {
    if (!this.currentSection) return [];
    
    if (this.currentSection.id === 'golpes' || this.currentSubcategory === 'golpes') {
      if (!this.currentGolpe) return [];
      const heists = this.getGolpesList();
      const currentHeist = heists.find(h => h.id === this.currentGolpe);
      if (!currentHeist) return [];
      const articulos = this.currentSection.articulos?.length 
        ? this.currentSection.articulos 
        : (this.secciones.find(s => s.id === 'misiones-historia')?.articulos || []);
      return articulos.filter(a => currentHeist.missionIds.includes(a.id));
    }

    if (!this.currentSubcategory) return [];

    const subcats = this.getSubcategoriasTematicas(this.currentSection);
    const found = subcats.find(s => s.id === this.currentSubcategory);
    if (!found) return [];
    
    if (found.missionIds && found.missionIds.length > 0) {
      return (this.currentSection.articulos || []).filter(a => found.missionIds!.includes(a.id));
    }
    if (found.badges && found.badges.length > 0) {
      return (this.currentSection.articulos || []).filter(a => found.badges!.includes(a.badge || ''));
    }
    return (this.currentSection.articulos || []).filter(a => a.badge === this.currentSubcategory);
  }

  getSubcategoriaActualTitulo(): string {
    if (!this.currentSection) return '';
    
    if (this.currentSection.id === 'golpes' || this.currentSubcategory === 'golpes') {
      if (this.currentGolpe) {
        const heists = this.getGolpesList();
        const foundHeist = heists.find(h => h.id === this.currentGolpe);
        return foundHeist ? foundHeist.titulo : 'Golpes y Atracos';
      }
      return 'Golpes y Atracos';
    }

    if (!this.currentSubcategory) return '';

    const subcats = this.getSubcategoriasTematicas(this.currentSection);
    const found = subcats.find(s => s.id === this.currentSubcategory);
    return found ? found.titulo : this.currentSubcategory;
  }

  getSubcategoriaActualColor(): string {
    if (!this.currentSection) return '#ffb833';
    
    if (this.currentSection.id === 'golpes' || this.currentSubcategory === 'golpes') {
      if (this.currentGolpe) {
        const heists = this.getGolpesList();
        const foundHeist = heists.find(h => h.id === this.currentGolpe);
        return foundHeist?.color || '#eab308';
      }
      return '#eab308';
    }

    if (!this.currentSubcategory) return this.getSectionColor(this.currentSection?.id);
    const subcats = this.getSubcategoriasTematicas(this.currentSection);
    const found = subcats.find(s => s.id === this.currentSubcategory);
    return found?.color || this.getSectionColor(this.currentSection.id);
  }

  getSubcategoriaActualIcono(): string {
    if (!this.currentSection || !this.currentSubcategory) return this.currentSection?.icono || 'folder';
    
    if (this.currentSubcategory === 'golpes') {
      if (this.currentGolpe) {
        const heists = this.getGolpesList();
        const foundHeist = heists.find(h => h.id === this.currentGolpe);
        return foundHeist?.icono || 'vault';
      }
      return 'vault';
    }

    const subcats = this.getSubcategoriasTematicas(this.currentSection);
    const found = subcats.find(s => s.id === this.currentSubcategory);
    return found?.icono || this.currentSection?.icono || 'folder';
  }

  failedImageArticleIds: Set<string> = new Set<string>();

  getArticuloImage(art: GuiaArticulo | null): string | null {
    if (!art || this.failedImageArticleIds.has(art.id)) return null;
    
    // Si viene definida una imagen explícita en los datos
    if (art.imagen) {
      return art.imagen;
    }
    if (art.imagenPrincipalUrl) {
      return art.imagenPrincipalUrl;
    }
    
    // Convención automática para misiones principales
    if (art.categoria === 'misiones-historia' || art.id.startsWith('mision-')) {
      return `assets/images/gta5/guia/offline/misiones-principales/${art.slug}.jpg`;
    }
    
    return null;
  }

  onImageError(articuloId: string): void {
    if (this.selectedArticulo && this.selectedArticulo.id === articuloId && this.selectedArticulo.imagen && this.selectedArticulo.imagen.includes('/mapa/marcadores-mapa/')) {
      this.selectedArticulo.imagen = this.selectedArticulo.imagen.replace('/mapa/marcadores-mapa/', '/marcadores-mapa/');
      return;
    }
    this.failedImageArticleIds.add(articuloId);
  }

  getSectionColor(secId?: string): string {
    if (!secId) return '#ffb833';
    const s = secId.toLowerCase();
    if (s.includes('trofeo')) return '#ffffff';
    if (s.includes('evento') || s.includes('aleatorio')) return '#eab308';
    if (s.includes('golpe')) return '#eab308';
    if (s.includes('prologo')) return '#3b82f6';
    if (s.includes('mision')) return '#ef4444';
    if (s.includes('extrano') || s.includes('loco')) return '#f97316';
    if (s.includes('100') || s.includes('historia')) return '#22c55e';
    if (s.includes('personaje') || s.includes('protagonista')) return '#f97316';
    if (s.includes('negocio') || s.includes('economia')) return '#06b6d4';
    if (s.includes('secreto') || s.includes('misterio')) return '#a855f7';
    if (s.includes('truco') || s.includes('codigo')) return '#10b981';
    return '#ffb833';
  }

  isLightAccentSection(secId?: string): boolean {
    return this.getSectionColor(secId) === '#ffffff';
  }

  getPersonajeClass(badge?: string): string {
    if (!badge) return '';
    const b = badge.toLowerCase();
    if (b.includes('michael') && b.includes('franklin')) return 'personaje-mf';
    if (b.includes('michael') && b.includes('trevor')) return 'personaje-mt';
    if (b.includes('trevor') && b.includes('franklin')) return 'personaje-tf';
    if (b.includes('michael')) return 'personaje-michael';
    if (b.includes('franklin')) return 'personaje-franklin';
    if (b.includes('trevor')) return 'personaje-trevor';
    if (b.includes('golpe')) return 'personaje-golpe';
    if (b.includes('preparaci')) return 'personaje-preparacion';
    if (b.includes('fib')) return 'personaje-fib';
    if (b.includes('lester')) return 'personaje-lester';
    if (b.includes('devin') || b.includes('weston')) return 'personaje-devin';
    if (b.includes('final')) return 'personaje-final';
    if (b.includes('introducci') || b.includes('intrahistoria') || b.includes('truco')) return 'personaje-neutral-gris';
    return 'personaje-neutral-gris';
  }

  seleccionarArticulo(articuloId: string, openMobile: boolean = true): void {
    this.mostrarTrofeos = false;
    if (openMobile && this.isMobileView()) {
      this.isMobileReadingOpen = true;
      this.scrollToTop();
    }
    this.isLoadingArticulo = true;
    this.articuloSub?.unsubscribe();
    this.articuloSub = this.guiaService.getArticulo('gta5', articuloId).subscribe({
      next: (articulo) => {
        this.selectedArticulo = articulo;
        this.renderedContent = this.renderMarkdown(articulo.contenidoMarkdown || '', articulo.id);
        this.isLoadingArticulo = false;
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
    this.searchSub = this.guiaService.buscarArticulos('gta5', this.searchQuery).subscribe({
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

  limpiarBusquedaOffline(): void {
    this.busquedaOffline = '';
  }

  hasBuscadorSeccion(seccionId?: string): boolean {
    return seccionId === 'misiones-historia' || seccionId === 'eventos-aleatorios' || seccionId === 'extranos-locos';
  }

  getPlaceholderBuscador(seccionId?: string): string {
    if (seccionId === 'misiones-historia' || seccionId === 'extranos-locos') return 'Buscar misión o personaje...';
    if (seccionId === 'eventos-aleatorios') return 'Buscar evento aleatorio...';
    return 'Buscar en esta sección...';
  }

  get articulosFiltradosSeccion(): GuiaArticuloResumen[] {
    if (!this.currentSection) return [];
    const raw = this.currentSection.articulos || [];
    const query = (this.busquedaOffline || '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    if (!query) return raw;
    const clean = (s?: string) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    return raw.filter(a =>
      clean(a.titulo).includes(query) ||
      clean(a.subtitulo).includes(query) ||
      clean(a.badge).includes(query)
    );
  }

  private renderMarkdown(raw: string, articuloId?: string): SafeHtml {
    if (!raw) {
      return this.sanitizer.bypassSecurityTrustHtml('');
    }

    const lines = raw.split('\n');
    const out: string[] = [];
    let inList = false;
    let framesInserted = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      const isSubBullet = /^\s{2,}[\*\-]\s+(.*)$/.test(line);
      const isBullet = /^\s*[\*\-]\s+(.*)$/.test(line);
      if (!isBullet && inList) {
        out.push('</ul>');
        inList = false;
      }

      if (line.startsWith('### ')) {
        if (articuloId === 'prologo-introduccion-guia' && !framesInserted) {
          out.push(`
            <div class="gta5-protagonists-frames" aria-label="Protagonistas de GTA V">
              <div class="gta5-protagonist-frame" aria-label="Michael De Santa"><img src="assets/images/gta5/guia/offline/personajes/Michael.png" alt="Michael De Santa" loading="lazy" /><span>Michael</span></div>
              <div class="gta5-protagonist-frame" aria-label="Trevor Philips"><img src="assets/images/gta5/guia/offline/personajes/Trevor.png" alt="Trevor Philips" loading="lazy" /><span>Trevor</span></div>
              <div class="gta5-protagonist-frame" aria-label="Franklin Clinton"><img src="assets/images/gta5/guia/offline/personajes/Franklin.png" alt="Franklin Clinton" loading="lazy" /><span>Franklin</span></div>
            </div>
          `);
          framesInserted = true;
        }

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
}
