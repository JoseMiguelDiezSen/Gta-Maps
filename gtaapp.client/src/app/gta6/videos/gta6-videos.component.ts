import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Title, Meta, DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { VideoItem, CategoriaFiltroVideo, CategoriaVideo } from '../../models/gta6';
import { VideosGta6Service } from '../../services/gta6';
import { CookieService } from '../../services/cookie.service';

@Component({
  selector: 'app-gta6-videos',
  templateUrl: './gta6-videos.component.html',
  styleUrls: ['./gta6-videos.component.css'],
  standalone: false
})
export class Gta6VideosComponent implements OnInit, OnDestroy {
  toastMessage: string | null = null;
  private toastTimeout: ReturnType<typeof setTimeout> | null = null;
  themeMode: 'night' | 'day' = 'night';
  categoriaSeleccionada: CategoriaVideo = 'historia';
  videoSeleccionado: VideoItem | null = null;
  videos: VideoItem[] = [];
  cargando: boolean = true;

  private videosSub?: Subscription;

  categoriasFiltro: CategoriaFiltroVideo[] = [
    { id: 'historia', labelKey: 'videos.filterHistoria', icono: 'fa-solid fa-book-open' },
    { id: 'online', labelKey: 'videos.filterOnline', icono: 'fa-solid fa-globe' }
  ];

  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  private readonly videosService = inject(VideosGta6Service);
  private readonly sanitizer = inject(DomSanitizer);
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

  onGta6MapBlocked(): void {
    this.mostrarToast('El mapa de GTA 6 estará disponible próximamente');
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
    return this.videos.filter(v => v.categoria === this.categoriaSeleccionada);
  }

  get videoDestacado(): VideoItem | null {
    return this.videosFiltrados.find(v => v.destacado) || this.videosFiltrados[0] || null;
  }

  get videosSecundarios(): VideoItem[] {
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

  isYouTube(url?: string): boolean {
    return !!url && (url.includes('youtube.com') || url.includes('youtu.be'));
  }

  getSafeVideoUrl(url?: string): SafeResourceUrl {
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : '';
  }
}
