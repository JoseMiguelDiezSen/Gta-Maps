import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { Title, Meta, DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { GuiaService } from '../../services/guia.service';
import { CookieService } from '../../services/cookie.service';
import { GuiaManifest, GuiaSeccion, GuiaArticulo, GuiaArticuloResumen } from '../../models/guia';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-gta6-guia',
  templateUrl: './gta6-guia.component.html',
  styleUrls: ['./gta6-guia.component.css'],
  standalone: false
})
export class Gta6GuiaComponent implements OnInit, OnDestroy, AfterViewInit {
  manifest: GuiaManifest | null = null;
  secciones: GuiaSeccion[] = [];
  currentSection: GuiaSeccion | null = null;
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
    this.titleService.setTitle('Guía GTA VI - Base de Datos, Jason & Lucia y Estado de Leonida | GTA MAPS');
    this.metaService.updateTag({
      name: 'description',
      content: 'Enciclopedia interactiva de GTA VI: distritos de Vice City, estado de Leonida, análisis de Jason & Lucia, inventario en maleteros y mecánicas.'
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
    this.currentSection = sec;
    this.selectedSeccionId = sec.id;
  }

  backToSections(): void {
    this.currentSection = null;
  }

  getSectionColor(secId?: string): string {
    if (!secId) return '#ec4899';
    const s = secId.toLowerCase();
    if (s.includes('protagonista')) return '#ec4899';
    if (s.includes('mundo') || s.includes('leonida')) return '#38bdf8';
    if (s.includes('mecanica')) return '#a855f7';
    if (s.includes('policial') || s.includes('ia-')) return '#f97316';
    return '#ec4899';
  }

  seleccionarArticulo(articuloId: string): void {
    this.isLoadingArticulo = true;
    this.articuloSub?.unsubscribe();
    this.articuloSub = this.guiaService.getArticulo('gta6', articuloId).subscribe({
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
