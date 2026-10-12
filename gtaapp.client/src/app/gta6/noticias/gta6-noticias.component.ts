import { Component, OnInit, OnDestroy } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { NoticiaItem, CategoriaFiltroItem } from '../../models/gta6';
import { NoticiasGta6Service } from '../../services/gta6';
import { CookieService } from '../../services/cookie.service';

@Component({
  selector: 'app-gta6-noticias',
  templateUrl: './gta6-noticias.component.html',
  styleUrls: ['./gta6-noticias.component.css'],
  standalone: false
})
export class Gta6NoticiasComponent implements OnInit, OnDestroy {
  themeMode: 'night' | 'day' = 'night';
  categoriaSeleccionada: string = 'todas';
  noticiaSeleccionada: NoticiaItem | null = null;
  noticias: NoticiaItem[] = [];
  cargando: boolean = true;

  private noticiasSub?: Subscription;

  categoriasFiltro: CategoriaFiltroItem[] = [
    { id: 'todas', label: 'Todas las Novedades' },
    { id: 'mecanicas', label: 'Mecánicas & Físicas' },
    { id: 'mundo', label: 'Mundo & Leonida' },
    { id: 'filtraciones', label: 'Análisis Técnico' },
    { id: 'oficial', label: 'Comunicados Oficiales' }
  ];

  constructor(
    private titleService: Title,
    private metaService: Meta,
    private noticiasService: NoticiasGta6Service,
    public cookieService: CookieService
  ) {}

  ngOnInit(): void {

    this.cargarNoticias();
  }

  ngOnDestroy(): void {
    this.noticiasSub?.unsubscribe();
  }

  private cargarNoticias(): void {
    this.cargando = true;
    this.noticiasSub = this.noticiasService.getNoticias().subscribe({
      next: (data) => {
        this.noticias = data;
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

  filtrarCategoria(catId: string): void {
    this.categoriaSeleccionada = catId;
  }

  abrirNoticia(item: NoticiaItem): void {
    this.noticiaSeleccionada = item;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  volverAlListado(): void {
    this.noticiaSeleccionada = null;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  get noticiasFiltradas(): NoticiaItem[] {
    if (this.categoriaSeleccionada === 'todas') {
      return this.noticias;
    }
    return this.noticias.filter(n => n.categoria === this.categoriaSeleccionada);
  }

  get noticiaDestacada(): NoticiaItem | null {
    if (this.categoriaSeleccionada !== 'todas') {
      return null;
    }
    return this.noticias.find(n => n.destacada) || this.noticias[0] || null;
  }

  get noticiasSecundarias(): NoticiaItem[] {
    if (this.categoriaSeleccionada !== 'todas') {
      return this.noticiasFiltradas;
    }
    const destacada = this.noticiaDestacada;
    if (!destacada) return this.noticiasFiltradas;
    return this.noticiasFiltradas.filter(n => n.id !== destacada.id);
  }
}
