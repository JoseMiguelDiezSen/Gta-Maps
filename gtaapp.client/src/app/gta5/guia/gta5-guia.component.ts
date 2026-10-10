import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { Title, Meta, DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { GuiaService } from '../../services/guia.service';
import { CookieService } from '../../services/cookie.service';
import { GuiaManifest, GuiaSeccion, GuiaArticulo, GuiaArticuloResumen } from '../../models/guia';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-gta5-guia',
  templateUrl: './gta5-guia.component.html',
  styleUrls: ['./gta5-guia.component.css'],
  standalone: false
})
export class Gta5GuiaComponent implements OnInit, OnDestroy, AfterViewInit {
  manifest: GuiaManifest | null = null;
  secciones: GuiaSeccion[] = [];
  currentSection: GuiaSeccion | null = null;
  expandedSections: Set<string> = new Set<string>();
  selectedArticulo: GuiaArticulo | null = null;
  selectedSeccionId: string = 'todas';
  
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
  private toastTimeout: any = null;

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
    this.manifestSub = this.guiaService.getManifest('gta5').subscribe({
      next: (data) => {
        this.manifest = data;
        this.secciones = data.secciones || [];
        if (this.secciones.length > 0) {
          this.expandedSections.add(this.secciones[0].id);
        }
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
    this.currentSection = sec;
    this.selectedSeccionId = sec.id;
  }

  backToSections(): void {
    this.currentSection = null;
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
    if (s.includes('mision')) return '#ffb833';
    if (s.includes('extrano') || s.includes('loco')) return '#ec4899';
    if (s.includes('100') || s.includes('historia')) return '#22c55e';
    if (s.includes('personaje') || s.includes('protagonista')) return '#f97316';
    if (s.includes('negocio') || s.includes('economia')) return '#06b6d4';
    if (s.includes('secreto') || s.includes('misterio')) return '#a855f7';
    if (s.includes('truco') || s.includes('codigo')) return '#10b981';
    return '#ffb833';
  }

  toggleSection(seccionId: string): void {
    if (this.expandedSections.has(seccionId)) {
      this.expandedSections.delete(seccionId);
    } else {
      this.expandedSections.add(seccionId);
    }
  }

  seleccionarSeccion(seccionId: string): void {
    this.selectedSeccionId = seccionId;
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
        const noEmoji = rawText.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();
        const heading = this.formatInline(noEmoji);
        const secId = `sec-${sectionCounter++}`;
        const cleanText = noEmoji.replace(/\*\*/g, '').replace(/`/g, '');
        toc.push({ id: secId, text: cleanText });
        out.push(`
          <div class="guide-heading-divider" id="${secId}">
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
