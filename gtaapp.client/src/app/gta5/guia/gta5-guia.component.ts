import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { Title, Meta, DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { GuiaService } from '../../services/guia.service';
import { CookieService } from '../../services/cookie.service';
import { GuiaManifest, GuiaSeccion, GuiaArticulo, GuiaArticuloResumen } from '../../models/guia';
import { isDevAccessAllowed } from '../../services/dev-access.guard';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-gta5-guia',
  templateUrl: './gta5-guia.component.html',
  styleUrls: ['./gta5-guia.component.css'],
  standalone: false
})
export class Gta5GuiaComponent implements OnInit, OnDestroy, AfterViewInit {
  readonly allowedProdSections: string[] = ['prologo', 'misiones-historia', 'extranos-locos'];

  manifest: GuiaManifest | null = null;
  secciones: GuiaSeccion[] = [];
  currentSection: GuiaSeccion | null = null;
  currentSubcategory: string | null = null;
  currentGolpe: string | null = null;
  selectedArticulo: GuiaArticulo | null = null;
  
  themeMode: 'night' | 'day' = 'night';
  searchQuery: string = '';
  searchResults: GuiaArticuloResumen[] = [];
  isLoading: boolean = true;
  isLoadingArticulo: boolean = false;
  renderedContent: SafeHtml = '';
  showScrollTop: boolean = false;
  toastMessage: string | null = null;
  private toastTimeout: any = null;

  isSectionLocked(seccionId: string): boolean {
    if (isDevAccessAllowed()) {
      return false;
    }
    return !this.allowedProdSections.includes(seccionId);
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
  ) {}

  ngOnDestroy(): void {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
      this.toastTimeout = null;
    }
    this.manifestSub?.unsubscribe();
    this.articuloSub?.unsubscribe();
    this.searchSub?.unsubscribe();
  }

  ngOnInit(): void {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    this.titleService.setTitle('Guía GTA V - Modo Historia al 100%, Golpes y Misterios | GTA MAPS');
    this.metaService.updateTag({
      name: 'description',
      content: 'Guía completa y enciclopedia de GTA V: requisitos del 100%, guía táctica de los 6 golpes, bolsa de valores con Lester, personajes y misterios de Los Santos.'
    });

    this.cargarGuia();
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
          this.seleccionarArticulo(this.secciones[0].articulos[0].id);
        }
      },
      error: (err) => {
        console.error('Error al cargar la guía de GTA 5:', err);
        this.isLoading = false;
      }
    });
  }

  openSection(sec: GuiaSeccion): void {
    if (this.isSectionLocked(sec.id)) {
      this.mostrarToast('Esta sección estará disponible próximamente');
      return;
    }
    this.currentSection = sec;
    this.currentSubcategory = null;
    this.currentGolpe = null;
  }

  backToSections(): void {
    this.currentSection = null;
    this.currentSubcategory = null;
    this.currentGolpe = null;
  }

  openSubcategory(subcatId: string): void {
    this.currentSubcategory = subcatId;
    this.currentGolpe = null;
  }

  backToSubcategories(): void {
    this.currentSubcategory = null;
    this.currentGolpe = null;
  }

  openGolpe(golpeId: string): void {
    this.currentGolpe = golpeId;
  }

  backToGolpes(): void {
    this.currentGolpe = null;
  }

  hasSubcategorias(sec: GuiaSeccion | null): boolean {
    if (!sec) return false;
    return sec.id === 'extranos-locos' || sec.id === 'misiones-historia';
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
    if (!this.currentSection || !this.currentSubcategory) return [];
    
    if (this.currentSubcategory === 'golpes') {
      if (!this.currentGolpe) return [];
      const heists = this.getGolpesList();
      const currentHeist = heists.find(h => h.id === this.currentGolpe);
      if (!currentHeist) return [];
      return (this.currentSection.articulos || []).filter(a => currentHeist.missionIds.includes(a.id));
    }

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
    if (!this.currentSection || !this.currentSubcategory) return '';
    
    if (this.currentSubcategory === 'golpes') {
      if (this.currentGolpe) {
        const heists = this.getGolpesList();
        const foundHeist = heists.find(h => h.id === this.currentGolpe);
        return foundHeist ? foundHeist.titulo : 'Golpes y Atracos';
      }
      return 'Golpes y Atracos';
    }

    const subcats = this.getSubcategoriasTematicas(this.currentSection);
    const found = subcats.find(s => s.id === this.currentSubcategory);
    return found ? found.titulo : this.currentSubcategory;
  }

  getSubcategoriaActualColor(): string {
    if (!this.currentSection || !this.currentSubcategory) return this.getSectionColor(this.currentSection?.id);
    
    if (this.currentSubcategory === 'golpes') {
      if (this.currentGolpe) {
        const heists = this.getGolpesList();
        const foundHeist = heists.find(h => h.id === this.currentGolpe);
        return foundHeist?.color || '#eab308';
      }
      return '#eab308';
    }

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
      return `assets/images/gta5/guia/historia/misiones-principales/${art.slug}.jpg`;
    }
    
    return null;
  }

  onImageError(articuloId: string): void {
    this.failedImageArticleIds.add(articuloId);
  }

  getSectionColor(secId?: string): string {
    if (!secId) return '#ffb833';
    const s = secId.toLowerCase();
    if (s.includes('prologo')) return '#3b82f6';
    if (s.includes('mision')) return '#ef4444';
    if (s.includes('extrano') || s.includes('loco')) return '#ffb833';
    if (s.includes('100') || s.includes('historia')) return '#22c55e';
    if (s.includes('personaje') || s.includes('protagonista')) return '#f97316';
    if (s.includes('negocio') || s.includes('economia')) return '#06b6d4';
    if (s.includes('secreto') || s.includes('misterio')) return '#a855f7';
    if (s.includes('truco') || s.includes('codigo')) return '#10b981';
    return '#ffb833';
  }

  seleccionarArticulo(articuloId: string): void {
    this.isLoadingArticulo = true;
    this.articuloSub?.unsubscribe();
    this.articuloSub = this.guiaService.getArticulo('gta5', articuloId).subscribe({
      next: (articulo) => {
        this.selectedArticulo = articulo;
        this.renderedContent = this.renderMarkdown(articulo.contenidoMarkdown || '');
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

  onSearch(): void {
    if (!this.searchQuery.trim()) {
      this.searchResults = [];
      return;
    }

    this.searchSub?.unsubscribe();
    this.searchSub = this.guiaService.buscarArticulos('gta5', this.searchQuery).subscribe({
      next: (results) => {
        this.searchResults = isDevAccessAllowed()
          ? results
          : results.filter(r => this.allowedProdSections.includes(r.categoria));
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

  private renderMarkdown(raw: string): SafeHtml {
    if (!raw) {
      return this.sanitizer.bypassSecurityTrustHtml('');
    }

    const lines = raw.split('\n');
    const out: string[] = [];
    let inList = false;

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
