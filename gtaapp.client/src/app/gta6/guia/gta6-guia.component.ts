import { Component, OnInit } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { GuiaService } from '../../services/guia.service';
import { GuiaManifest, GuiaSeccion, GuiaArticulo, GuiaArticuloResumen } from '../../models/guia';

@Component({
  selector: 'app-gta6-guia',
  templateUrl: './gta6-guia.component.html',
  styleUrls: ['./gta6-guia.component.css'],
  standalone: false
})
export class Gta6GuiaComponent implements OnInit {
  manifest: GuiaManifest | null = null;
  secciones: GuiaSeccion[] = [];
  selectedArticulo: GuiaArticulo | null = null;
  selectedSeccionId: string = 'todas';
  
  searchQuery: string = '';
  searchResults: GuiaArticuloResumen[] = [];
  isLoading: boolean = true;
  isLoadingArticulo: boolean = false;

  constructor(
    private guiaService: GuiaService,
    private titleService: Title,
    private metaService: Meta
  ) {}

  ngOnInit(): void {
    this.titleService.setTitle('Base de Datos & Guía Oficial GTA VI - Vice City y Estado de Leonida | GTA MAPS');
    this.metaService.updateTag({
      name: 'description',
      content: 'Enciclopedia interactiva de GTA VI: análisis de regiones de Leonida, Jason & Lucia, vehículos, armas e inventario físico confirmado.'
    });

    this.cargarGuia();
  }

  cargarGuia(): void {
    this.isLoading = true;
    this.guiaService.getManifest('gta6').subscribe({
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

  seleccionarArticulo(articuloId: string): void {
    this.isLoadingArticulo = true;
    this.guiaService.getArticulo('gta6', articuloId).subscribe({
      next: (articulo) => {
        this.selectedArticulo = articulo;
        this.isLoadingArticulo = false;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: (err) => {
        console.error(`Error al cargar el artículo ${articuloId}:`, err);
        this.isLoadingArticulo = false;
      }
    });
  }

  onSearch(): void {
    if (!this.searchQuery.trim()) {
      this.searchResults = [];
      return;
    }

    this.guiaService.buscarArticulos('gta6', this.searchQuery).subscribe({
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
}
