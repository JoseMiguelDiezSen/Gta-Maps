import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { VideoItem, CategoriaFiltroVideo, CategoriaVideo } from '../../models/gta6';
import { VideosGta6Service } from '../../services/gta6';
import { CookieService } from '../../services/cookie.service';
import { isDevAccessAllowed } from '../../services/dev-access.guard';

@Component({
  selector: 'app-gta6-videos',
  templateUrl: './gta6-videos.component.html',
  styleUrls: ['./gta6-videos.component.css'],
  standalone: false
})
export class Gta6VideosComponent implements OnInit, OnDestroy {
  readonly isDevAllowed: boolean = isDevAccessAllowed();
  mobileNavOpen: boolean = false;
  toastMessage: string | null = null;
  private toastTimeout: ReturnType<typeof setTimeout> | null = null;
  themeMode: 'night' | 'day' = 'night';
  categoriaSeleccionada: CategoriaVideo = 'todas';
  videoSeleccionado: VideoItem | null = null;
  videos: VideoItem[] = [];
  cargando: boolean = true;

  private videosSub?: Subscription;

  categoriasFiltro: CategoriaFiltroVideo[] = [
    { id: 'todas', label: 'Todos los Vídeos', icono: 'fa-solid fa-layer-group' },
    { id: 'npc', label: 'NPCs & Reacciones', icono: 'fa-solid fa-person-walking' },
    { id: 'fauna', label: 'Fauna de Leonida', icono: 'fa-solid fa-paw' },
    { id: 'policia', label: 'Policía & Persecuciones', icono: 'fa-solid fa-shield-halved' },
    { id: 'fisicas', label: 'Físicas & Curiosidades', icono: 'fa-solid fa-car-burst' },
    { id: 'mundo', label: 'Mundo Abierto', icono: 'fa-solid fa-earth-americas' }
  ];

  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  private readonly videosService = inject(VideosGta6Service);
  public readonly cookieService = inject(CookieService);

  constructor() {}

  ngOnInit(): void {
    this.cargarVideos();
  }

  ngOnDestroy(): void {
    this.videosSub?.unsubscribe();
  }

  private cargarVideos(): void {
    this.cargando = true;
    this.videosSub = this.videosService.getVideos().subscribe({
      next: (data) => {
        this.videos = data;
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

  filtrarCategoria(catId: CategoriaVideo): void {
    this.categoriaSeleccionada = catId;
  }

  abrirVideo(item: VideoItem): void {
    this.videoSeleccionado = item;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  volverAlListado(): void {
    this.videoSeleccionado = null;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  get videosFiltrados(): VideoItem[] {
    if (this.categoriaSeleccionada === 'todas') {
      return this.videos;
    }
    return this.videos.filter(v => v.categoria === this.categoriaSeleccionada);
  }

  get videoDestacado(): VideoItem | null {
    if (this.categoriaSeleccionada !== 'todas') {
      return null;
    }
    return this.videos.find(v => v.destacado) || this.videos[0] || null;
  }

  get videosSecundarios(): VideoItem[] {
    if (this.categoriaSeleccionada !== 'todas') {
      return this.videosFiltrados;
    }
    const destacado = this.videoDestacado;
    if (!destacado) return this.videosFiltrados;
    return this.videosFiltrados.filter(v => v.id !== destacado.id);
  }

  formatearDuracion(segundos?: number): string {
    if (!segundos) return '';
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
}
