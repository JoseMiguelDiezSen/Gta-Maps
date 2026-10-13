import { Component, AfterViewInit, OnInit, ViewChild, ElementRef } from '@angular/core';
import { isDevAccessAllowed } from '../../../services/dev-access.guard';
import { CookieService } from '../../../services/cookie.service';
import { GuiaArticulo, GuiaArticuloResumen, GuiaSeccion } from '../../../models/guia';
import { DealerCategory, GtaVehicle } from '../../../models/gta5/vehicle';
import { VehicleService } from '../../../services/gta5/vehicle.service';
import { CONCESIONARIOS_GTA5 } from '../../../components/gta5-info-panel/vehiculos.config';
import { LocationService } from '../../../services/gta5/location.service';
import { LocationItem } from '../../../models/gta5/location';
import { Observable, shareReplay } from 'rxjs';

@Component({
  selector: 'app-gta5-guia-online',
  templateUrl: './gta5-guia-online.component.html',
  styleUrls: ['../offline/gta5-guia-offline.component.css', './gta5-guia-online.component.css'],
  standalone: false
})
export class Gta5GuiaOnlineComponent implements OnInit, AfterViewInit {
  readonly isDevAllowed: boolean = isDevAccessAllowed();
  themeMode: 'night' | 'day' = 'night';
  readonly concesionarios: DealerCategory[] = CONCESIONARIOS_GTA5;

  readonly secciones: GuiaSeccion[] = [
    {
      id: 'prologo',
      titulo: 'Prólogo',
      icono: 'book-open',
      descripcion: '',
      orden: 0,
      articulos: [
        { id: 'prologo', slug: 'prologo', titulo: 'Prólogo', subtitulo: '', categoria: 'prologo', tiempoLecturaMinutos: 0 }
      ]
    },
    { id: 'misiones-principales', titulo: 'Misiones Principales', icono: 'gun', descripcion: '', orden: 1, articulos: [] },
    { id: 'golpes', titulo: 'Golpes', icono: 'vault', descripcion: '', orden: 2, articulos: [] },
    { id: 'personajes', titulo: 'Personajes', icono: 'users', descripcion: '', orden: 3, articulos: [] },
    { id: 'vehiculos', titulo: 'Vehículos', icono: 'car', descripcion: '', orden: 4, articulos: [] },
    { id: 'armas', titulo: 'Armas', icono: 'crosshairs', descripcion: '', orden: 5, articulos: [] },
    { id: 'misterios', titulo: 'Misterios', icono: 'ghost', descripcion: '', orden: 6, articulos: [] }
  ];

  currentSection: GuiaSeccion | null = null;
  selectedArticulo: GuiaArticulo | null = null;
  searchQuery: string = '';
  searchResults: GuiaArticuloResumen[] = [];
  showScrollTop: boolean = false;

  @ViewChild('wikiShell') wikiShellRef?: ElementRef<HTMLDivElement>;

  readonly personajes$: Observable<LocationItem[]>;
  readonly embarcacionesDocktease$: Observable<GtaVehicle[]>;

  concesionarioSeleccionado: DealerCategory | null = null;
  vehiculosConcesionario$: Observable<GtaVehicle[]> | null = null;
  vehiculoSeleccionado: GtaVehicle | null = null;

  constructor(
    public cookieService: CookieService,
    private locationService: LocationService,
    private vehicleService: VehicleService
  ) {
    this.personajes$ = this.locationService
      .getProperties('online', 'character')
      .pipe(shareReplay(1));
    this.embarcacionesDocktease$ = this.vehicleService
      .getVehicles('docktease', undefined, undefined, 'online')
      .pipe(shareReplay(1));
  }

  ngOnInit(): void {
    this.seleccionarArticulo(this.secciones[0].articulos[0].id);
  }

  ngAfterViewInit(): void {
    if (this.wikiShellRef?.nativeElement) {
      this.wikiShellRef.nativeElement.scrollTop = 0;
    }
  }

  toggleThemeMode(): void {
    this.themeMode = this.themeMode === 'night' ? 'day' : 'night';
  }

  onGta6MapClick(event: Event): void {
    if (!this.isDevAllowed) {
      event.preventDefault();
    }
  }

  openSection(seccion: GuiaSeccion): void {
    this.currentSection = seccion;
    this.limpiarConcesionario();
  }

  backToSections(): void {
    this.currentSection = null;
    this.limpiarConcesionario();
  }

  seleccionarConcesionario(concesionario: DealerCategory): void {
    if (concesionario.id !== 'docktease') return;
    this.concesionarioSeleccionado = concesionario;
    this.vehiculosConcesionario$ = this.embarcacionesDocktease$;
  }

  seleccionarVehiculo(vehiculo: GtaVehicle): void {
    this.vehiculoSeleccionado = vehiculo;
  }

  volverAlGridVehiculos(): void {
    this.vehiculoSeleccionado = null;
  }

  private limpiarConcesionario(): void {
    this.concesionarioSeleccionado = null;
    this.vehiculosConcesionario$ = null;
    this.vehiculoSeleccionado = null;
  }

  seleccionarArticulo(articuloId: string): void {
    const resumen = this.secciones
      .flatMap(seccion => seccion.articulos)
      .find(articulo => articulo.id === articuloId);
    if (!resumen) return;
    this.selectedArticulo = {
      ...resumen,
      contenidoMarkdown: '',
      tags: [],
      ultimaActualizacion: '',
      relacionados: []
    };
  }

  onSearch(): void {
    const consulta = this.searchQuery.trim().toLowerCase();
    if (!consulta) {
      this.searchResults = [];
      return;
    }
    this.searchResults = this.secciones
      .flatMap(seccion => seccion.articulos)
      .filter(articulo => articulo.titulo.toLowerCase().includes(consulta));
  }

  limpiarBusqueda(): void {
    this.searchQuery = '';
    this.searchResults = [];
  }

  getSeccionContador(seccion: GuiaSeccion): number {
    if (seccion.id === 'vehiculos') {
      return this.concesionarios.length;
    }
    return seccion.articulos.length;
  }

  getSectionColor(seccionId?: string): string {
    if (!seccionId) return '#ffb833';
    const id = seccionId.toLowerCase();
    if (id.includes('prologo')) return '#3b82f6';
    if (id.includes('mision')) return '#ef4444';
    if (id.includes('golpe')) return '#eab308';
    if (id.includes('personaje')) return '#f97316';
    if (id.includes('misterio')) return '#a855f7';
    return '#ffb833';
  }

  onShellScroll(): void {
    const shell = this.wikiShellRef?.nativeElement;
    if (!shell) return;
    this.showScrollTop = shell.scrollTop > 400;
  }

  scrollToTop(): void {
    this.wikiShellRef?.nativeElement.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
