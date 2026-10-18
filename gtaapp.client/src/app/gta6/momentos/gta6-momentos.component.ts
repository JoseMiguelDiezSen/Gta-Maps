import { Component, OnInit, OnDestroy } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { MomentoItem, CategoriaFiltroMomento, CategoriaMomento } from '../../models/gta6';
import { MomentosGta6Service } from '../../services/gta6';
import { CookieService } from '../../services/cookie.service';
import { isDevAccessAllowed } from '../../services/dev-access.guard';

@Component({
  selector: 'app-gta6-momentos',
  templateUrl: './gta6-momentos.component.html',
  styleUrls: ['./gta6-momentos.component.css'],
  standalone: false
})
export class Gta6MomentosComponent implements OnInit, OnDestroy {
  readonly isDevAllowed: boolean = isDevAccessAllowed();
  mobileNavOpen: boolean = false;
  toastMessage: string | null = null;
  private toastTimeout: any = null;
  themeMode: 'night' | 'day' = 'night';
  categoriaSeleccionada: CategoriaMomento = 'todas';
  momentoSeleccionado: MomentoItem | null = null;
  momentos: MomentoItem[] = [];
  cargando: boolean = true;

  private momentosSub?: Subscription;

  categoriasFiltro: CategoriaFiltroMomento[] = [
    { id: 'todas', label: 'Todos los Momentos', icono: 'fa-solid fa-layer-group' },
    { id: 'npc', label: 'NPCs & Reacciones', icono: 'fa-solid fa-person-walking' },
    { id: 'fauna', label: 'Fauna de Leonida', icono: 'fa-solid fa-paw' },
    { id: 'policia', label: 'Policía & Persecuciones', icono: 'fa-solid fa-shield-halved' },
    { id: 'fisicas', label: 'Físicas & Curiosidades', icono: 'fa-solid fa-car-burst' },
    { id: 'mundo', label: 'Mundo Abierto', icono: 'fa-solid fa-earth-americas' }
  ];

  constructor(
    private titleService: Title,
    private metaService: Meta,
    private momentosService: MomentosGta6Service,
    public cookieService: CookieService
  ) {}

  ngOnInit(): void {
    this.cargarMomentos();
  }

  ngOnDestroy(): void {
    this.momentosSub?.unsubscribe();
  }

  private cargarMomentos(): void {
    this.cargando = true;
    this.momentosSub = this.momentosService.getMomentos().subscribe({
      next: (data) => {
        this.momentos = data;
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
      }
    });
  }

  toggleThemeMode(): void {
    this.themeMode = this.themeMode === 'night' ? 'day' : 'night';
  }

  toggleMobileNav(): void {
    this.mobileNavOpen = !this.mobileNavOpen;
  }

  closeMobileNav(): void {
    this.mobileNavOpen = false;
  }

  onGta6MapClick(event: Event): void {
    if (!this.isDevAllowed) {
      event.preventDefault();
      event.stopPropagation();
      this.mostrarToast('El mapa de GTA 6 estará disponible próximamente');
    }
  }

  private mostrarToast(msg: string): void {
    this.toastMessage = msg;
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.toastTimeout = setTimeout(() => {
      this.toastMessage = null;
    }, 3000);
  }

  filtrarCategoria(catId: CategoriaMomento): void {
    this.categoriaSeleccionada = catId;
  }

  abrirMomento(item: MomentoItem): void {
    this.momentoSeleccionado = item;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  volverAlListado(): void {
    this.momentoSeleccionado = null;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  get momentosFiltrados(): MomentoItem[] {
    if (this.categoriaSeleccionada === 'todas') {
      return this.momentos;
    }
    return this.momentos.filter(m => m.categoria === this.categoriaSeleccionada);
  }

  get momentoDestacado(): MomentoItem | null {
    if (this.categoriaSeleccionada !== 'todas') {
      return null;
    }
    return this.momentos.find(m => m.destacado) || this.momentos[0] || null;
  }

  get momentosSecundarios(): MomentoItem[] {
    if (this.categoriaSeleccionada !== 'todas') {
      return this.momentosFiltrados;
    }
    const destacado = this.momentoDestacado;
    if (!destacado) return this.momentosFiltrados;
    return this.momentosFiltrados.filter(m => m.id !== destacado.id);
  }

  formatearDuracion(segundos?: number): string {
    if (!segundos) return '';
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
}
