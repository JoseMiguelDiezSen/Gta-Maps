import { Component, OnInit } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { GuiaService } from '../../services/guia.service';
import { GuiaManifest, GuiaSeccion, GuiaArticulo, GuiaArticuloResumen } from '../../models/guia';

@Component({
  selector: 'app-gta5-guia',
  templateUrl: './gta5-guia.component.html',
  styleUrls: ['./gta5-guia.component.css']
})
export class Gta5GuiaComponent implements OnInit {
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
    this.titleService.setTitle('Guía Oficial & Wiki GTA V - Modo Historia al 100%, Golpes y Misterios | GTA MAPS');
    this.metaService.updateTag({
      name: 'description',
      content: 'Guía completa y enciclopedia de GTA V: requisitos del 100%, guía de golpes, bolsa de valores con Lester, personajes y misterios de Los Santos.'
    });

    this.cargarGuia();
  }

  cargarGuia(): void {
    this.isLoading = true;
    this.guiaService.getManifest('gta5').subscribe({
      next: (data) => {
        this.manifest = data;
        this.secciones = data.secciones || [];
        this.isLoading = false;
        
        // Cargar por defecto el primer artículo si existe
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

  seleccionarSeccion(seccionId: string): void {
    this.selectedSeccionId = seccionId;
  }

  seleccionarArticulo(articuloId: string): void {
    this.isLoadingArticulo = true;
    this.guiaService.getArticulo('gta5', articuloId).subscribe({
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

    this.guiaService.buscarArticulos('gta5', this.searchQuery).subscribe({
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
