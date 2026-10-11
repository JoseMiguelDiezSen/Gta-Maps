import { Component, OnInit } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';

export interface NoticiaItem {
  id: string;
  slug: string;
  titulo: string;
  subtitulo: string;
  categoria: 'oficial' | 'mecanicas' | 'mundo' | 'filtraciones';
  badge: string;
  fecha: string;
  tiempoLecturaMinutos: number;
  imagenUrl?: string;
  destacada?: boolean;
}

@Component({
  selector: 'app-gta6-noticias',
  templateUrl: './gta6-noticias.component.html',
  styleUrls: ['./gta6-noticias.component.css'],
  standalone: false
})
export class Gta6NoticiasComponent implements OnInit {
  themeMode: 'night' | 'day' = 'night';
  categoriaSeleccionada: string = 'todas';

  categoriasFiltro = [
    { id: 'todas', label: 'Todas las Novedades' },
    { id: 'oficial', label: 'Comunicados Oficiales' },
    { id: 'mecanicas', label: 'Mecánicas & Físicas' },
    { id: 'mundo', label: 'Mundo & Leonida' },
    { id: 'filtraciones', label: 'Análisis Técnico' }
  ];

  noticias: NoticiaItem[] = [
    {
      id: 'noticia-1',
      slug: 'fuerzas-del-orden-ia-policial',
      titulo: 'IA Policial Avanzada y Redes Sociales en Leonida',
      subtitulo: 'Análisis técnico de los protocolos de contención, reconocimiento de matrículas y testigos grabando con teléfonos.',
      categoria: 'mecanicas',
      badge: 'IA & Sistemas',
      fecha: '11 Oct 2026',
      tiempoLecturaMinutos: 5,
      destacada: true
    },
    {
      id: 'noticia-2',
      slug: 'inventario-realista-maleteros-armas',
      titulo: 'Sistema de Inventario Físico y Maleteros Vehiculares',
      subtitulo: 'Evolución del modelo de armero móvil: límite de armas portables y equipamiento estratégico estilo RDR2.',
      categoria: 'mecanicas',
      badge: 'Jugabilidad',
      fecha: '10 Oct 2026',
      tiempoLecturaMinutos: 6
    },
    {
      id: 'noticia-3',
      slug: 'geografia-leonida-distritos-vice-city',
      titulo: 'Vice City, Humedales de Grassrivers y Leonard County',
      subtitulo: 'Primer vistazo a las regiones confirmadas de Leonida: ecosistemas tropicales, lanchas y fauna hostil.',
      categoria: 'mundo',
      badge: 'Geografía',
      fecha: '08 Oct 2026',
      tiempoLecturaMinutos: 7
    },
    {
      id: 'noticia-4',
      slug: 'fisicas-vehiculos-clima-extremo',
      titulo: 'Física de Tracción, Aquaplaning e Interiores Interactivos',
      subtitulo: 'Comportamiento todoterreno sobre fango y asfalto mojado bajo tormentas tropicales de Leonida.',
      categoria: 'mecanicas',
      badge: 'Motor Físico',
      fecha: '05 Oct 2026',
      tiempoLecturaMinutos: 4
    }
  ];

  constructor(
    private titleService: Title,
    private metaService: Meta
  ) {}

  ngOnInit(): void {
    this.titleService.setTitle('Noticias & Actualidad GTA VI - Estado de Leonida | GTA MAPS');
    this.metaService.updateTag({
      name: 'description',
      content: 'Últimas noticias, comunicados oficiales y análisis técnico de Grand Theft Auto VI y el Estado de Leonida.'
    });
  }

  toggleThemeMode(): void {
    this.themeMode = this.themeMode === 'night' ? 'day' : 'night';
  }

  filtrarCategoria(catId: string): void {
    this.categoriaSeleccionada = catId;
  }

  get noticiasFiltradas(): NoticiaItem[] {
    if (this.categoriaSeleccionada === 'todas') {
      return this.noticias;
    }
    return this.noticias.filter(n => n.categoria === this.categoriaSeleccionada);
  }
}
