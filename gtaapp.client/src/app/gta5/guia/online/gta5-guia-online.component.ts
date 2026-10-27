import { Component, AfterViewInit, OnInit, ViewChild, ElementRef, OnDestroy, inject } from '@angular/core';
import { isDevAccessAllowed } from '../../../services/dev-access.guard';
import { CookieService } from '../../../services/cookie.service';
import { GuiaService } from '../../../services/guia.service';
import { GuiaArticulo, GuiaArticuloResumen, GuiaNegocioOnline, GuiaSeccion } from '../../../models/guia';
import { DealerCategory, GtaVehicle } from '../../../models/gta5/vehicle';
import { VehicleService } from '../../../services/gta5/vehicle.service';
import { CONCESIONARIOS_GTA5 } from '../../map/info-panel/vehiculos.config';
import { GtaWeapon } from '../../../models/gta5/weapon';
import { WeaponService } from '../../../services/gta5/weapon.service';
import { WEAPON_CATEGORIES_GTA5, WeaponCategoryConfig } from '../../map/info-panel/weapons.config';
import { LocationService } from '../../../services/gta5/location.service';
import { LocationItem } from '../../../models/gta5/location';
import { GtaMystery } from '../../../models/gta5/mystery';
import { GtaHeist, GtaMission } from '../../../models/gta5/mission';
import { MissionService } from '../../../services/gta5/mission.service';
import { Observable, shareReplay, forkJoin, map, Subscription } from 'rxjs';
import { GuiaBreadcrumbItem } from '../offline/gta5-guia-offline.component';

export interface CategoriaMisionOnline {
  id: string;
  titulo: string;
  icono: string;
  color: string;
  category?: string;
  giver?: string;
}

export interface SubcategoriaNegocioOnline {
  id: string;
  titulo: string;
  icono: string;
  color: string;
}


@Component({
  selector: 'app-gta5-guia-online',
  templateUrl: './gta5-guia-online.component.html',
  styleUrls: [
    '../offline/gta5-guia-offline.component.css',
    './gta5-guia-online.component.css'
  ],
  standalone: false
})
export class Gta5GuiaOnlineComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly isDevAllowed: boolean = isDevAccessAllowed();
  themeMode: 'night' | 'day' = 'night';
  readonly concesionarios: DealerCategory[] = CONCESIONARIOS_GTA5;
  readonly weaponCategories: WeaponCategoryConfig[] = WEAPON_CATEGORIES_GTA5;

  readonly secciones: GuiaSeccion[] = [
    {
      id: 'prologo',
      titulo: 'Inicio',
      icono: 'book-open',
      descripcion: '',
      orden: 0,
      articulos: [
        { id: 'online-introduccion', slug: 'introduccion-gta-online', titulo: 'Introducción a GTA Online', subtitulo: 'El barrio sin ley: mundo abierto, progresión y reglas de la calle', categoria: 'prologo', badge: 'Introducción', tiempoLecturaMinutos: 4 },
        { id: 'online-personaje', slug: 'tu-personaje-criminal', titulo: 'Tu Personaje: El Criminal', subtitulo: 'Creación, apariencia y las dos formas de vivir en Los Santos', categoria: 'prologo', badge: 'Personaje', tiempoLecturaMinutos: 5 },
        { id: 'online-los-santos', slug: 'los-santos-en-linea', titulo: 'Los Santos en Línea', subtitulo: 'El mundo abierto que nunca duerme: sesiones, bandas y propiedades', categoria: 'prologo', badge: 'Ciudad', tiempoLecturaMinutos: 5 },
        { id: 'online-golpes', slug: 'golpes-online', titulo: 'Golpes Online: Los Grandes Atracos', subtitulo: 'Planificación, tripulación de hasta 4 y botín millonario', categoria: 'prologo', badge: 'Golpes', tiempoLecturaMinutos: 6 },
        { id: 'online-negocios', slug: 'negocios-y-dinero', titulo: 'Negocios, Propiedades y Dinero Sucio', subtitulo: 'Monta tus negocios, invierte y haz que el dinero trabaje para ti', categoria: 'prologo', badge: 'Negocios', tiempoLecturaMinutos: 6 },
        { id: 'online-actividades', slug: 'modos-y-actividades', titulo: 'Modos, Carreras y Actividades', subtitulo: 'Competición, modos JcJ y todo el caos del modo libre', categoria: 'prologo', badge: 'Actividades', tiempoLecturaMinutos: 6 },
        { id: 'online-progresion', slug: 'progresion-y-respeto', titulo: 'Progresión: Niveles, RP y Respeto', subtitulo: 'Cómo subir de nivel, reinvertir y hacerte un nombre en la calle', categoria: 'prologo', badge: 'Progresión', tiempoLecturaMinutos: 5 }
      ]
    },
    { id: 'misiones-principales', titulo: 'Misiones Principales', icono: 'gun', descripcion: '', orden: 1, articulos: [] },
    {
      id: 'negocios',
      titulo: 'Negocios',
      icono: 'briefcase',
      descripcion: 'Propiedades criminales, locales y rendimiento económico en Los Santos',
      orden: 2,
      articulos: []
    },
    { id: 'golpes', titulo: 'Golpes', icono: 'vault', descripcion: '', orden: 3, articulos: [] },
    { id: 'personajes', titulo: 'Personajes', icono: 'users', descripcion: '', orden: 4, articulos: [] },
    { id: 'vehiculos', titulo: 'Vehículos', icono: 'car', descripcion: '', orden: 5, articulos: [] },
    { id: 'armas', titulo: 'Armas', icono: 'crosshairs', descripcion: '', orden: 6, articulos: [] },
    { id: 'misterios', titulo: 'Misterios', icono: 'ghost', descripcion: '', orden: 7, articulos: [] }
  ];

  currentSection: GuiaSeccion | null = null;
  selectedArticulo: GuiaArticulo | null = null;
  renderedContent: string = '';
  searchQuery: string = '';
  searchResults: GuiaArticuloResumen[] = [];
  showScrollTop: boolean = false;
  mobileNavOpen: boolean = false;

  private readonly onlineArticulosContenido = new Map<string, GuiaArticulo>();

  @ViewChild('wikiShell') wikiShellRef?: ElementRef<HTMLDivElement>;

  readonly personajes$: Observable<LocationItem[]>;
  readonly dealerCounts$: Observable<Record<string, number>>;
  readonly weaponCounts$: Observable<Record<string, number>>;
  readonly misterios$: Observable<GtaMystery[]>;
  readonly golpes$: Observable<GtaHeist[]>;
  readonly misionesOnline$: Observable<GtaMission[]>;
  readonly negociosOnline$: Observable<GuiaNegocioOnline[]>;
  negociosOnline: GuiaNegocioOnline[] = [];

  concesionarioSeleccionado: DealerCategory | null = null;
  vehiculosConcesionario$: Observable<GtaVehicle[]> | null = null;
  vehiculosConcesionario: GtaVehicle[] = [];
  busquedaVehiculos: string = '';
  vehiculoSeleccionado: GtaVehicle | null = null;
  private vehiculosSub?: Subscription;

  categoriaArmaSeleccionada: WeaponCategoryConfig | null = null;
  armasCategoria$: Observable<GtaWeapon[]> | null = null;
  armaSeleccionada: GtaWeapon | null = null;

  misterioSeleccionado: GtaMystery | null = null;
  misterios: GtaMystery[] = [];
  golpeSeleccionado: GtaHeist | null = null;
  golpes: GtaHeist[] = [];
  golpeAbierto: boolean = false;
  faseSeleccionadaIndex: number | null = null;

  misionesOnline: GtaMission[] = [];
  misionSeleccionada: GtaMission | null = null;
  categoriaMisionSeleccionada: CategoriaMisionOnline | null = null;
  busquedaMisiones: string = '';
  filtroContactoMisiones: string = 'todos';

  readonly categoriasMisiones: CategoriaMisionOnline[] = [
    { id: 'lamar-clasico', titulo: 'Lamar Davis', icono: 'user', color: '#eab308', category: 'Contacto Clásico', giver: 'Lamar Davis' },
    { id: 'simeon-clasico', titulo: 'Simeon Yetarian', icono: 'car', color: '#3b82f6', category: 'Contacto Clásico', giver: 'Simeon Yetarian' },
    { id: 'gerald-clasico', titulo: 'Gerald', icono: 'capsules', color: '#a855f7', category: 'Contacto Clásico', giver: 'Gerald' },
    { id: 'ron-clasico', titulo: 'Ron Jakowski', icono: 'tower-broadcast', color: '#f97316', category: 'Contacto Clásico', giver: 'Ron Jakowski' },
    { id: 'trevor-clasico', titulo: 'Trevor Philips', icono: 'skull', color: '#ef4444', category: 'Contacto Clásico', giver: 'Trevor Philips' },
    { id: 'lester-clasico', titulo: 'Lester Crest', icono: 'laptop-code', color: '#22c55e', category: 'Contacto Clásico', giver: 'Lester Crest' },
    { id: 'madrazo-clasico', titulo: 'Martín Madrazo', icono: 'briefcase', color: '#78716c', category: 'Contacto Clásico', giver: 'Martín Madrazo' },
    { id: 'lowriders', titulo: 'Lamar: Lowriders', icono: 'car-side', color: '#f59e0b', category: 'Misiones de Lowriders' },
    { id: 'securoserv', titulo: 'SecuroServ: Vehículos Especiales', icono: 'shield-halved', color: '#06b6d4', category: 'Vehículos Especiales' },
    { id: 'agente14', titulo: 'Agente 14: Operaciones Móviles', icono: 'truck-monster', color: '#84cc16', category: 'Operaciones Móviles' },
    { id: 'repo', titulo: 'Simeon: Embargos Premium', icono: 'key', color: '#60a5fa', category: 'Embargos Premium Deluxe' },
    { id: 'dispatch', titulo: 'Madrazo: Asesinatos Dispatch', icono: 'crosshairs', color: '#dc2626', category: 'Asesinatos Dispatch' },
    { id: 'casino', titulo: 'Agatha Baker: Diamond Casino', icono: 'gem', color: '#ec4899', category: 'The Diamond Casino' },
    { id: 'ultima-jugada', titulo: 'Gerald: Última Jugada', icono: 'box', color: '#c084fc', category: 'Última Jugada' },
    { id: 'superyate', titulo: 'Capitán Darcy: Superyate Galaxy', icono: 'anchor', color: '#38bdf8', category: 'Superyate Galaxy' },
    { id: 'dr-dre', titulo: 'Franklin: El Contrato Dr. Dre', icono: 'headphones', color: '#10b981', category: 'The Contract (VIP Dr. Dre)' },
    { id: 'drug-wars', titulo: 'Dax: Drug Wars (Dosis)', icono: 'pills', color: '#f43f5e', category: 'Los Santos Drug Wars' },
    { id: 'cluckin-bell', titulo: "Vincent: Asalto a Cluckin' Bell", icono: 'drumstick-bite', color: '#f97316', category: "Asalto a Cluckin' Bell" }
  ];

  subcategoriaNegocioSeleccionada: SubcategoriaNegocioOnline | null = null;
  negocioSeleccionado: GuiaNegocioOnline | null = null;

  readonly subcategoriasNegocios: SubcategoriaNegocioOnline[] = [
    { id: 'warehouse', titulo: 'Almacenes de Mercancía Especial', icono: 'box', color: '#16a085' },
    { id: 'vehicle_warehouse', titulo: 'Importación y Exportación', icono: 'car', color: '#38bdf8' },
    { id: 'nightclub', titulo: 'Club Nocturno', icono: 'martini-glass', color: '#a855f7' },
    { id: 'arcade', titulo: 'Salas Recreativas', icono: 'gamepad', color: '#ec4899' },
    { id: 'coke_lockup', titulo: 'Laboratorio de Cocaína', icono: 'flask', color: '#ffffff' },
    { id: 'meth_lab', titulo: 'Laboratorio de Meta', icono: 'vial', color: '#eab308' },
    { id: 'cash_factory', titulo: 'Fábrica de Dinero', icono: 'money-bill-wave', color: '#22c55e' },
    { id: 'weed_farm', titulo: 'Cultivo de Cannabis', icono: 'cannabis', color: '#10b981' },
    { id: 'doc_forgery', titulo: 'Falsificación de Documentos', icono: 'id-card', color: '#f97316' }
  ];

  public readonly cookieService = inject(CookieService);
  private readonly locationService = inject(LocationService);
  private readonly vehicleService = inject(VehicleService);
  private readonly weaponService = inject(WeaponService);
  private readonly missionService = inject(MissionService);
  private readonly guiaService = inject(GuiaService);

  constructor() {
    this.personajes$ = this.locationService
      .getProperties('online', 'character')
      .pipe(shareReplay(1));

    this.misterios$ = this.guiaService
      .getMisteriosGuiaOnline()
      .pipe(shareReplay(1));

    this.misterios$.subscribe(list => {
      this.misterios = list || [];
    });

    this.golpes$ = this.guiaService
      .getGolpesGuiaOnline()
      .pipe(shareReplay(1));

    this.misionesOnline$ = this.guiaService
      .getMisionesGuiaOnline()
      .pipe(shareReplay(1));

    this.negociosOnline$ = this.guiaService
      .getNegociosGuiaOnline()
      .pipe(shareReplay(1));

    this.negociosOnline$.subscribe(list => {
      this.negociosOnline = list || [];
    });

    this.dealerCounts$ = forkJoin(
      this.concesionarios.map(d =>
        this.guiaService.getVehiculosGuiaOnline(d.id).pipe(
          map(list => ({ id: d.id, count: list.length }))
        )
      )
    ).pipe(
      map(results => {
        const counts: Record<string, number> = {};
        for (const r of results) {
          counts[r.id] = r.count;
        }
        return counts;
      }),
      shareReplay(1)
    );

    this.weaponCounts$ = this.guiaService.getArmasGuiaOnline().pipe(
      map(weapons => {
        const counts: Record<string, number> = {};
        for (const cat of this.weaponCategories) {
          counts[cat.id] = 0;
        }
        for (const w of weapons) {
          const cat = (w.category || '').toLowerCase();
          counts[cat] = (counts[cat] || 0) + 1;
        }
        return counts;
      }),
      shareReplay(1)
    );

    this.guiaService.getOnlinePrologoArticulos().subscribe(articulos => {
      for (const articulo of articulos) {
        this.onlineArticulosContenido.set(articulo.id, articulo);
      }
      if (this.selectedArticulo) {
        this.seleccionarArticulo(this.selectedArticulo.id);
      }
    });
  }

  ngOnInit(): void {
    this.seleccionarArticulo(this.secciones[0].articulos[0].id);
    this.golpes$.subscribe(list => {
      this.golpes = list;
    });
    this.misionesOnline$.subscribe(list => {
      this.misionesOnline = list;
    });
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

  toggleMobileNav(): void {
    this.mobileNavOpen = !this.mobileNavOpen;
  }

  closeMobileNav(): void {
    this.mobileNavOpen = false;
  }

  openSection(seccion: GuiaSeccion): void {
    this.currentSection = seccion;
    this.limpiarConcesionario();
    this.limpiarArma();
    this.limpiarMisterio();
    this.limpiarGolpe();
    this.limpiarMision();
    this.limpiarNegocio();
    if (seccion.id === 'negocios') {
      this.subcategoriaNegocioSeleccionada = null;
      if (this.negociosOnline.length > 0 && !this.negocioSeleccionado) {
        this.negocioSeleccionado = this.negociosOnline[0];
      } else {
        this.negociosOnline$.subscribe(list => {
          if (list && list.length > 0 && !this.negocioSeleccionado) {
            this.negocioSeleccionado = list[0];
          }
        });
      }
    }
    if (seccion.id === 'misterios') {
      this.misterios$.subscribe(list => {
        if (list && list.length > 0 && !this.misterioSeleccionado) {
          this.misterioSeleccionado = list[0];
        }
      });
    }
    if (seccion.id === 'golpes') {
      this.golpeAbierto = false;
      this.faseSeleccionadaIndex = null;
      this.golpes$.subscribe(list => {
        if (list && list.length > 0 && !this.golpeSeleccionado) {
          this.golpeSeleccionado = list[0];
        }
      });
    }
    if (seccion.id === 'misiones-principales') {
      this.categoriaMisionSeleccionada = null;
      this.expandedGruposMisiones.clear();
      this.expandedGruposMisiones.add('lamar-clasico');
      if (this.misionesOnline.length > 0 && !this.misionSeleccionada) {
        this.seleccionarMision(this.misionesOnline[0]);
      } else {
        this.misionesOnline$.subscribe(list => {
          if (list && list.length > 0 && !this.misionSeleccionada) {
            this.seleccionarMision(list[0]);
          }
        });
      }
    }
    if (seccion.id === 'armas') {
      if (this.weaponCategories.length > 0 && !this.categoriaArmaSeleccionada) {
        this.seleccionarCategoriaArma(this.weaponCategories[0]);
      }
    }
    if (seccion.id === 'vehiculos') {
      if (this.concesionarios.length > 0 && !this.concesionarioSeleccionado) {
        this.seleccionarConcesionario(this.concesionarios[0]);
      }
    }
  }

  backToSections(): void {
    this.currentSection = null;
    this.limpiarConcesionario();
    this.limpiarArma();
    this.limpiarMisterio();
    this.limpiarGolpe();
    this.limpiarMision();
    this.limpiarNegocio();
  }

  seleccionarSubcategoriaNegocio(subcat: SubcategoriaNegocioOnline): void {
    this.subcategoriaNegocioSeleccionada = subcat;
    const negocios = this.getNegociosDeSubcategoria(subcat);
    this.negocioSeleccionado = negocios.length > 0 ? negocios[0] : null;
  }

  volverASubcategoriasNegocios(): void {
    this.subcategoriaNegocioSeleccionada = null;
  }

  seleccionarNegocio(negocio: GuiaNegocioOnline): void {
    this.negocioSeleccionado = negocio;
  }

  getNegociosDeSubcategoria(subcat: SubcategoriaNegocioOnline | null): GuiaNegocioOnline[] {
    if (!subcat) return this.negociosOnline;
    return this.negociosOnline.filter(n => n.category === subcat.id);
  }

  getContadorNegociosSubcategoria(subcat: SubcategoriaNegocioOnline): number {
    return this.negociosOnline.filter(n => n.category === subcat.id).length;
  }

  get previousNegocio(): GuiaNegocioOnline | null {
    if (!this.negocioSeleccionado) return null;
    const list = this.getNegociosDeSubcategoria(this.subcategoriaNegocioSeleccionada);
    const idx = list.findIndex(n => n.id === this.negocioSeleccionado?.id);
    return idx > 0 ? list[idx - 1] : null;
  }

  get nextNegocio(): GuiaNegocioOnline | null {
    if (!this.negocioSeleccionado) return null;
    const list = this.getNegociosDeSubcategoria(this.subcategoriaNegocioSeleccionada);
    const idx = list.findIndex(n => n.id === this.negocioSeleccionado?.id);
    return (idx >= 0 && idx < list.length - 1) ? list[idx + 1] : null;
  }

  private limpiarNegocio(): void {
    this.subcategoriaNegocioSeleccionada = null;
    this.negocioSeleccionado = null;
  }

  seleccionarGolpe(g: GtaHeist): void {
    this.golpeSeleccionado = g;
    this.golpeAbierto = true;
    this.faseSeleccionadaIndex = null;
  }

  volverAGolpes(): void {
    this.golpeAbierto = false;
    this.faseSeleccionadaIndex = null;
  }

  seleccionarFaseGolpe(idx: number): void {
    this.faseSeleccionadaIndex = idx;
    const el = document.getElementById('setup-mission-' + idx);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  private limpiarGolpe(): void {
    this.golpeSeleccionado = null;
    this.golpeAbierto = false;
    this.faseSeleccionadaIndex = null;
  }

  getHeistAccentColor(h: GtaHeist | null): string {
    return h?.badgeColor || '#ffb833';
  }

  seleccionarMisterio(m: GtaMystery): void {
    this.misterioSeleccionado = m;
  }

  volverAlGridMisterios(): void {
    this.misterioSeleccionado = null;
  }

  getMysteryImage(m: GtaMystery | null | undefined): string {
    if (!m || !m.thumbnail) return '';
    const src = m.thumbnail.trim();
    if (src.includes('misterios/') || src.includes('mysteries/')) {
      const fileName = src.substring(src.lastIndexOf('/') + 1);
      return `/assets/images/gta5/guia/online/misterios/${fileName}`;
    }
    return src.startsWith('/') ? src : '/' + src;
  }

  private limpiarMisterio(): void {
    this.misterioSeleccionado = null;
  }

  seleccionarConcesionario(concesionario: DealerCategory): void {
    this.concesionarioSeleccionado = concesionario;
    this.vehiculoSeleccionado = null;
    this.busquedaVehiculos = '';
    this.vehiculosConcesionario = [];
    this.vehiculosSub?.unsubscribe();
    this.vehiculosConcesionario$ = this.guiaService
      .getVehiculosGuiaOnline(concesionario.id)
      .pipe(shareReplay(1));
    this.vehiculosSub = this.vehiculosConcesionario$.subscribe(list => {
      this.vehiculosConcesionario = list || [];
    });
  }

  get vehiculosFiltrados(): GtaVehicle[] {
    const list = this.vehiculosConcesionario || [];
    const rawQuery = (this.busquedaVehiculos || '').trim();
    if (!rawQuery) {
      return list;
    }
    const cleanStr = (s?: string) =>
      (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const query = cleanStr(rawQuery);
    return list.filter(v =>
      cleanStr(v.name).includes(query) ||
      cleanStr(v.manufacturer).includes(query) ||
      cleanStr(v.class).includes(query)
    );
  }

  limpiarBusquedaVehiculos(): void {
    this.busquedaVehiculos = '';
  }

  getPlaceholderBuscadorVehiculos(): string {
    const dealerId = this.concesionarioSeleccionado?.id;
    if (dealerId === 'docktease') return 'Buscar embarcación...';
    if (dealerId === 'elitas') return 'Buscar aeronave...';
    if (dealerId === 'pedal_and_metal') return 'Buscar bicicleta...';
    if (dealerId === 'warstock') return 'Buscar vehículo militar...';
    return 'Buscar vehículo...';
  }

  getBadgeLabelVehiculos(): string {
    const dealerId = this.concesionarioSeleccionado?.id;
    if (dealerId === 'docktease') return 'embarcaciones';
    if (dealerId === 'elitas') return 'aeronaves';
    if (dealerId === 'pedal_and_metal') return 'bicicletas';
    return 'vehículos';
  }

  seleccionarVehiculo(vehiculo: GtaVehicle): void {
    this.vehiculoSeleccionado = vehiculo;
  }

  volverAlGridVehiculos(): void {
    this.vehiculoSeleccionado = null;
  }

  getVehicleIcon(v: GtaVehicle | null): string {
    if (!v) return 'fa-car';
    const cat = (v.category || v.class || '').toLowerCase();
    if (cat.includes('motor') || cat.includes('moto')) return 'fa-motorcycle';
    if (cat.includes('heli')) return 'fa-helicopter';
    if (cat.includes('plane') || cat.includes('avión') || cat.includes('avion')) return 'fa-plane';
    if (cat.includes('boat') || cat.includes('embarc') || cat.includes('barco')) return 'fa-ship';
    if (cat.includes('cycle') || cat.includes('bici')) return 'fa-bicycle';
    if (cat.includes('militar') || cat.includes('indust') || cat.includes('offroad') || cat.includes('todoterreno')) return 'fa-truck-monster';
    return 'fa-car';
  }

  private limpiarConcesionario(): void {
    this.concesionarioSeleccionado = null;
    this.vehiculosConcesionario$ = null;
    this.vehiculosConcesionario = [];
    this.vehiculoSeleccionado = null;
    this.busquedaVehiculos = '';
    this.vehiculosSub?.unsubscribe();
  }

  seleccionarCategoriaArma(cat: WeaponCategoryConfig): void {
    this.categoriaArmaSeleccionada = cat;
    this.armaSeleccionada = null;
    this.armasCategoria$ = this.guiaService
      .getArmasGuiaOnline(cat.id)
      .pipe(shareReplay(1));
  }

  seleccionarArma(arma: GtaWeapon): void {
    this.armaSeleccionada = arma;
  }

  volverAlGridArmas(): void {
    this.armaSeleccionada = null;
  }

  getWeaponIcon(arma: GtaWeapon | null): string {
    if (!arma) return 'fa-gun';
    return arma.icon || 'fa-gun';
  }

  private limpiarArma(): void {
    this.categoriaArmaSeleccionada = null;
    this.armasCategoria$ = null;
    this.armaSeleccionada = null;
  }

  seleccionarArticulo(articuloId: string): void {
    const resumen = this.secciones
      .flatMap(seccion => seccion.articulos)
      .find(articulo => articulo.id === articuloId);
    if (!resumen) return;
    const contenido = this.onlineArticulosContenido.get(articuloId);
    this.selectedArticulo = {
      ...resumen,
      contenidoMarkdown: contenido?.contenidoMarkdown ?? '',
      tags: contenido?.tags ?? [],
      ultimaActualizacion: contenido?.ultimaActualizacion ?? '',
      relacionados: contenido?.relacionados ?? []
    };
    this.renderedContent = this.renderMarkdown(this.selectedArticulo.contenidoMarkdown);
  }

  private renderMarkdown(raw: string): string {
    if (!raw) {
      return '';
    }

    const root = document.createElement('div');
    const lines = raw.split('\n');
    let currentList: HTMLUListElement | null = null;

    for (const line of lines) {
      const isSubBullet = /^\s{2,}[-*]\s+/.test(line);
      const isBullet = /^\s*[-*]\s+/.test(line);
      if (!isBullet && !line.startsWith('> ') && currentList) {
        root.appendChild(currentList);
        currentList = null;
      }

      if (line.startsWith('### ')) {
        const rawText = line.substring(4).trim();
        const noEmoji = rawText.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();
        const divider = document.createElement('div');
        divider.className = 'guide-heading-divider';
        const leftLine = document.createElement('div');
        leftLine.className = 'guide-heading-line';
        const h3 = document.createElement('h3');
        h3.className = 'guide-heading-title';
        this.appendInline(h3, noEmoji);
        const rightLine = document.createElement('div');
        rightLine.className = 'guide-heading-line guide-heading-line--right';
        divider.appendChild(leftLine);
        divider.appendChild(h3);
        divider.appendChild(rightLine);
        root.appendChild(divider);
      } else if (line.startsWith('## ')) {
        const rawText = line.substring(3).trim();
        const noEmoji = rawText.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();
        const h2 = document.createElement('h2');
        h2.className = 'guide-h2';
        this.appendInline(h2, noEmoji);
        root.appendChild(h2);
      } else if (line.startsWith('> ')) {
        if (!currentList) {
          currentList = document.createElement('ul');
          currentList.className = 'guide-list';
        }
        const li = document.createElement('li');
        li.className = 'guide-list-item';
        const bullet = document.createElement('span');
        bullet.className = 'guide-list-bullet';
        bullet.textContent = '\u203A';
        const textSpan = document.createElement('span');
        textSpan.className = 'guide-list-text';
        this.appendInline(textSpan, line.substring(2).trim());
        li.appendChild(bullet);
        li.appendChild(textSpan);
        currentList.appendChild(li);
      } else if (line.trim() === '---') {
        continue;
      } else if (isBullet) {
        if (!currentList) {
          currentList = document.createElement('ul');
          currentList.className = 'guide-list';
        }
        const match = line.match(/^\s*[-*]\s+(.*)/);
        const li = document.createElement('li');
        li.className = isSubBullet ? 'guide-list-item guide-list-subitem' : 'guide-list-item';
        const bullet = document.createElement('span');
        bullet.className = 'guide-list-bullet';
        bullet.textContent = '\u203A';
        const textSpan = document.createElement('span');
        textSpan.className = 'guide-list-text';
        if (match) {
          this.appendInline(textSpan, match[1]);
        }
        li.appendChild(bullet);
        li.appendChild(textSpan);
        currentList.appendChild(li);
      } else if (line.trim().length > 0) {
        const p = document.createElement('p');
        p.className = 'guide-p';
        this.appendInline(p, line);
        root.appendChild(p);
      }
    }

    if (currentList) {
      root.appendChild(currentList);
    }

    return Array.from(root.childNodes).map(node => new XMLSerializer().serializeToString(node)).join('');
  }

  private appendInline(parent: HTMLElement, text: string): void {
    if (!text) return;
    const tokenRegex = /(\*\*.*?\*\*|\*[^*]+\*|`[^`]+`)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = tokenRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parent.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
      }
      const token = match[0];
      if (token.startsWith('**') && token.endsWith('**')) {
        const strong = document.createElement('strong');
        strong.className = 'guide-strong';
        strong.textContent = token.slice(2, -2);
        parent.appendChild(strong);
      } else if (token.startsWith('*') && token.endsWith('*')) {
        const em = document.createElement('em');
        em.className = 'guide-em';
        em.textContent = token.slice(1, -1);
        parent.appendChild(em);
      } else if (token.startsWith('`') && token.endsWith('`')) {
        const code = document.createElement('span');
        code.className = 'guide-chip-code';
        code.textContent = token.slice(1, -1);
        parent.appendChild(code);
      }
      lastIndex = tokenRegex.lastIndex;
    }
    if (lastIndex < text.length) {
      parent.appendChild(document.createTextNode(text.slice(lastIndex)));
    }
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
    if (seccion.id === 'armas') {
      return this.weaponCategories.length;
    }
    if (seccion.id === 'misiones-principales') {
      return this.misionesOnline.length;
    }
    if (seccion.id === 'negocios') {
      return this.negociosOnline.length;
    }
    return seccion.articulos.length;
  }

  expandedGruposMisiones: Set<string> = new Set<string>();

  toggleGrupoMision(catId: string): void {
    if (this.expandedGruposMisiones.has(catId)) {
      this.expandedGruposMisiones.delete(catId);
    } else {
      this.expandedGruposMisiones.add(catId);
    }
  }

  isGrupoMisionExpanded(catId: string): boolean {
    if (this.busquedaMisiones) return true;
    return this.expandedGruposMisiones.has(catId);
  }

  trackByCategoriaId(index: number, item: { id: string }): string {
    return item.id;
  }

  trackByMisionId(index: number, item: GtaMission): string {
    return item.id;
  }

  getGruposMisionesOnline(): {
    id: string;
    titulo: string;
    icono: string;
    color: string;
    total: number;
    misiones: GtaMission[];
  }[] {
    const rawQuery = (this.busquedaMisiones || '').trim();
    const cleanStr = (s?: string) =>
      (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const query = cleanStr(rawQuery);

    return this.categoriasMisiones.map(cat => {
      let misiones = this.getMisionesDeCategoria(cat);
      if (query) {
        misiones = misiones.filter(m =>
          cleanStr(m.title).includes(query) ||
          cleanStr(m.character).includes(query) ||
          cleanStr(m.giver).includes(query) ||
          cleanStr(m.category).includes(query)
        );
      }
      return {
        id: cat.id,
        titulo: cat.titulo,
        icono: cat.icono,
        color: cat.color,
        total: misiones.length,
        misiones
      };
    }).filter(g => g.misiones.length > 0);
  }

  seleccionarCategoriaMision(cat: CategoriaMisionOnline): void {
    this.categoriaMisionSeleccionada = cat;
    this.busquedaMisiones = '';
    const misiones = this.getMisionesDeCategoria(cat);
    this.misionSeleccionada = misiones.length > 0 ? misiones[0] : null;
  }

  volverACategoriasMisiones(): void {
    this.categoriaMisionSeleccionada = null;
    this.busquedaMisiones = '';
  }

  getMisionesDeCategoria(cat: CategoriaMisionOnline | null): GtaMission[] {
    if (!cat) return this.misionesOnline;
    return this.misionesOnline.filter(m => {
      if (cat.category && cat.giver) {
        return m.category === cat.category && (m.giver === cat.giver || m.character === cat.giver);
      }
      if (cat.category) {
        return m.category === cat.category;
      }
      return false;
    });
  }

  get misionesOnlineFiltradasGlobal(): GtaMission[] {
    const rawQuery = this.busquedaMisiones.trim();
    if (!rawQuery) {
      return [];
    }
    const cleanStr = (s?: string) =>
      (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const query = cleanStr(rawQuery);

    return this.misionesOnline.filter(m =>
      cleanStr(m.title).includes(query) ||
      cleanStr(m.character).includes(query) ||
      cleanStr(m.giver).includes(query) ||
      cleanStr(m.category).includes(query)
    );
  }

  seleccionarMision(m: GtaMission): void {
    this.misionSeleccionada = m;
    const cat = this.categoriasMisiones.find(c => {
      if (c.category && c.giver) {
        return m.category === c.category && (m.giver === c.giver || m.character === c.giver);
      }
      return m.category === c.category;
    });
    if (cat) {
      this.categoriaMisionSeleccionada = cat;
      this.expandedGruposMisiones.add(cat.id);
    }
  }

  limpiarMision(): void {
    this.categoriaMisionSeleccionada = null;
    this.misionSeleccionada = null;
    this.busquedaMisiones = '';
  }

  limpiarBusquedaMisiones(): void {
    this.busquedaMisiones = '';
  }

  renderMissionMarkdown(m: GtaMission | null | undefined): string {
    if (!m || !m.contenidoMarkdown) {
      return '';
    }
    return this.renderMarkdown(m.contenidoMarkdown);
  }

  get activeMissionsList(): GtaMission[] {
    if (this.categoriaMisionSeleccionada) {
      return this.getMisionesDeCategoria(this.categoriaMisionSeleccionada);
    }
    if (this.busquedaMisiones.trim()) {
      return this.misionesOnlineFiltradasGlobal;
    }
    return this.misionesOnline;
  }

  get filteredOnlineMissions(): GtaMission[] {
    return this.activeMissionsList;
  }

  get uniqueOnlineContacts(): { name: string; count: number }[] {
    const map = new Map<string, number>();
    for (const m of this.misionesOnline) {
      const name = m.character || m.giver;
      if (name) {
        map.set(name, (map.get(name) || 0) + 1);
      }
    }
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }

  get previousMission(): GtaMission | null {
    if (!this.misionSeleccionada) return null;
    const list = this.filteredOnlineMissions;
    const idx = list.findIndex(m => m.id === this.misionSeleccionada!.id);
    return idx > 0 ? list[idx - 1] : null;
  }

  get nextMission(): GtaMission | null {
    if (!this.misionSeleccionada) return null;
    const list = this.filteredOnlineMissions;
    const idx = list.findIndex(m => m.id === this.misionSeleccionada!.id);
    return (idx >= 0 && idx < list.length - 1) ? list[idx + 1] : null;
  }

  selectPreviousMission(): void {
    const prev = this.previousMission;
    if (prev) this.misionSeleccionada = prev;
  }

  selectNextMission(): void {
    const next = this.nextMission;
    if (next) this.misionSeleccionada = next;
  }

  get currentMysteryItem(): GtaMystery | null {
    return this.misterioSeleccionado || (this.misterios.length > 0 ? this.misterios[0] : null);
  }

  get previousMystery(): GtaMystery | null {
    const current = this.currentMysteryItem;
    if (!current || this.misterios.length === 0) return null;
    const idx = this.misterios.findIndex(m => m.id === current.id);
    return idx > 0 ? this.misterios[idx - 1] : null;
  }

  get nextMystery(): GtaMystery | null {
    const current = this.currentMysteryItem;
    if (!current || this.misterios.length === 0) return null;
    const idx = this.misterios.findIndex(m => m.id === current.id);
    return (idx >= 0 && idx < this.misterios.length - 1) ? this.misterios[idx + 1] : null;
  }

  selectPreviousMystery(): void {
    const prev = this.previousMystery;
    if (prev) {
      this.misterioSeleccionado = prev;
      this.scrollToTop();
    }
  }

  selectNextMystery(): void {
    const next = this.nextMystery;
    if (next) {
      this.misterioSeleccionado = next;
      this.scrollToTop();
    }
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

  get breadcrumbs(): GuiaBreadcrumbItem[] {
    const items: GuiaBreadcrumbItem[] = [];

    // 1. Vehículos
    if (this.concesionarioSeleccionado || this.currentSection?.id === 'vehiculos') {
      const secVehiculos = this.secciones.find(s => s.id === 'vehiculos');
      items.push({
        label: secVehiculos?.titulo || 'Vehículos',
        clickable: !!this.concesionarioSeleccionado,
        action: () => {
          if (secVehiculos) this.openSection(secVehiculos);
          this.limpiarConcesionario();
        }
      });
      if (this.concesionarioSeleccionado) {
        items.push({
          label: this.concesionarioSeleccionado.name,
          clickable: !!this.vehiculoSeleccionado,
          action: () => {
            this.volverAlGridVehiculos();
          }
        });
      }
      if (this.vehiculoSeleccionado) {
        items.push({
          label: this.vehiculoSeleccionado.name,
          clickable: false
        });
      }
      return items;
    }

    // 2. Armas
    if (this.categoriaArmaSeleccionada && this.currentSection?.id === 'armas') {
      const secArmas = this.secciones.find(s => s.id === 'armas');
      items.push({
        label: secArmas?.titulo || 'Armas',
        clickable: !!this.categoriaArmaSeleccionada,
        action: () => {
          if (secArmas) this.openSection(secArmas);
          this.limpiarArma();
        }
      });
      if (this.categoriaArmaSeleccionada) {
        items.push({
          label: this.categoriaArmaSeleccionada.name,
          clickable: !!this.armaSeleccionada,
          action: () => {
            this.volverAlGridArmas();
          }
        });
      }
      if (this.armaSeleccionada) {
        items.push({
          label: this.armaSeleccionada.name,
          clickable: false
        });
      }
      return items;
    }

    // 3. Misterios
    if (this.currentSection?.id === 'misterios') {
      const secMisterios = this.secciones.find(s => s.id === 'misterios');
      const mis = this.currentMysteryItem;
      items.push({
        label: secMisterios?.titulo || 'Misterios',
        clickable: false
      });
      if (mis) {
        items.push({
          label: this.cleanBreadcrumbTitle(mis.title),
          clickable: false
        });
      }
      return items;
    }

    // 4. Golpes
    if (this.currentSection?.id === 'golpes') {
      const secGolpes = this.secciones.find(s => s.id === 'golpes');
      const golpe = this.golpeSeleccionado || (this.golpes.length > 0 ? this.golpes[0] : null);
      items.push({
        label: secGolpes?.titulo || 'Golpes',
        clickable: this.golpeAbierto,
        action: () => {
          this.volverAGolpes();
        }
      });
      if (golpe) {
        items.push({
          label: this.cleanBreadcrumbTitle(golpe.title),
          clickable: this.faseSeleccionadaIndex !== null,
          action: () => {
            this.faseSeleccionadaIndex = null;
          }
        });
      }
      if (golpe && this.faseSeleccionadaIndex !== null && golpe.setupMissions?.[this.faseSeleccionadaIndex]) {
        items.push({
          label: golpe.setupMissions[this.faseSeleccionadaIndex].name,
          clickable: false
        });
      }
      return items;
    }

    // 5. Misiones Principales
    if (this.currentSection?.id === 'misiones-principales') {
      const secMisiones = this.secciones.find(s => s.id === 'misiones-principales');
      items.push({
        label: secMisiones?.titulo || 'Misiones Principales',
        clickable: !!this.categoriaMisionSeleccionada,
        action: () => {
          this.volverACategoriasMisiones();
        }
      });
      if (this.categoriaMisionSeleccionada) {
        items.push({
          label: this.categoriaMisionSeleccionada.titulo,
          clickable: !!this.misionSeleccionada,
          action: () => {
            // Permanece en la categoría actual
          }
        });
      }
      if (this.misionSeleccionada) {
        items.push({
          label: this.cleanBreadcrumbTitle(this.misionSeleccionada.title),
          clickable: false
        });
      }
      return items;
    }

    // 6. Negocios y Propiedades Criminales
    if (this.currentSection?.id === 'negocios') {
      const secNegocios = this.secciones.find(s => s.id === 'negocios');
      items.push({
        label: secNegocios?.titulo || 'Negocios',
        clickable: !!this.subcategoriaNegocioSeleccionada,
        action: () => {
          this.volverASubcategoriasNegocios();
        }
      });
      if (this.subcategoriaNegocioSeleccionada) {
        items.push({
          label: this.subcategoriaNegocioSeleccionada.titulo,
          clickable: !!this.negocioSeleccionado,
          action: () => {
            // Permanece en la subcategoría actual
          }
        });
      }
      if (this.negocioSeleccionado) {
        items.push({
          label: this.negocioSeleccionado.name,
          clickable: false
        });
      }
      return items;
    }

    // 7. Lector del Artículo Seleccionado (Prólogo u otros artículos generales)
    if (this.selectedArticulo) {
      const art = this.selectedArticulo;
      let sec = this.currentSection;
      if (!sec) {
        sec = this.secciones.find(s => s.articulos?.some(a => a.id === art.id))
          || this.secciones.find(s => s.id === art.categoria)
          || null;
      }
      if (sec) {
        items.push({
          label: sec.titulo,
          clickable: true,
          action: () => {
            this.openSection(sec!);
          }
        });
      }
      items.push({
        label: this.cleanBreadcrumbTitle(art.titulo),
        clickable: false
      });
      return items;
    }

    return items;
  }

  getCleanMissionTitle(title?: string): string {
    if (!title) return '';
    const clean = title.replace(/^\d+\.\s*/, '').trim();
    const idx = clean.lastIndexOf('(');
    const hasTag = idx > 0 && clean.endsWith(')') && /^(?:Tonya|Beverly|Hao|Barry|Mary-Ann|Cletus|Dom|Maude|Patrulla|Peter Dreyfuss|Epsilon|Josh|Nigel|Abigail|Sasquatch)/i.test(clean.slice(idx + 1, -1));
    return hasTag ? clean.slice(0, idx).trim() : clean;
  }

  cleanBreadcrumbTitle(title?: string): string {
    return this.getCleanMissionTitle(title);
  }

  getOnlineContactBadgeClass(char: string): string {
    const c = (char || '').toLowerCase();
    if (c.includes('gerald')) return 'badge-gerald';
    if (c.includes('simeon')) return 'badge-simeon';
    if (c.includes('lamar')) return 'badge-lamar';
    if (c.includes('lester')) return 'badge-lester';
    if (c.includes('madrazo')) return 'badge-madrazo';
    if (c.includes('trevor') || c.includes('ron')) return 'badge-trevor';
    if (c.includes('agatha')) return 'badge-agatha';
    if (c.includes('brendan')) return 'badge-darcy';
    if (c.includes('franklin')) return 'badge-franklin';
    if (c.includes('dax')) return 'badge-dax';
    if (c.includes('vincent')) return 'badge-vincent';
    if (c.includes('agente') || c.includes('securoserv')) return 'badge-tactical';
    return 'badge-neutral';
  }

  getMissionAccentColor(m: GtaMission | null): string {
    if (!m) return '#ffb833';
    const c = (m.character || '').toLowerCase();
    const cat = (m.category || '').toLowerCase();
    if (c.includes('lucia')) return '#ff4fe0';
    if (c.includes('jason')) return '#00cec9';
    if (c.includes('gerald')) return '#9b59b6';
    if (c.includes('simeon')) return '#f1c40f';
    if (c.includes('lamar')) return '#2ecc71';
    if (c.includes('lester')) return '#3498db';
    if (c.includes('madrazo')) return '#e74c3c';
    if (c.includes('trevor') || c.includes('ron')) return '#e67e22';
    if (c.includes('agatha')) return '#d4af37';
    if (c.includes('brendan')) return '#2980b9';
    if (c.includes('franklin')) return '#27ae60';
    if (c.includes('dax')) return '#e91e63';
    if (c.includes('vincent')) return '#ff5722';
    if (cat.includes('golpe') || cat.includes('heist') || cat.includes('final')) return '#f1c40f';
    if (c.includes('franklin') && !c.includes('michael') && !c.includes('trevor')) return '#2ecc71';
    if (c.includes('michael') && !c.includes('franklin') && !c.includes('trevor')) return '#3498db';
    if (c.includes('trevor') && !c.includes('franklin') && !c.includes('michael')) return '#e67e22';
    return '#ffb833';
  }

  getMissionIcon(m: GtaMission | null): string {
    if (!m) return 'fa-crosshairs';
    const c = (m.character || '').toLowerCase();
    const cat = (m.category || '').toLowerCase();
    if (cat.includes('golpe') || cat.includes('heist')) return 'fa-sack-dollar';
    if (c.includes('lucia')) return 'fa-gem';
    if (c.includes('jason')) return 'fa-shield-halved';
    if (c.includes('gerald')) return 'fa-pills';
    if (c.includes('simeon')) return 'fa-car';
    if (c.includes('lamar')) return 'fa-cannabis';
    if (c.includes('lester')) return 'fa-laptop-code';
    if (c.includes('madrazo')) return 'fa-crosshairs';
    if (c.includes('trevor') || c.includes('ron')) return 'fa-skull';
    if (c.includes('agatha')) return 'fa-gem';
    if (c.includes('franklin')) return 'fa-car';
    if (c.includes('michael')) return 'fa-gun';
    if (c.includes('vincent')) return 'fa-shield-halved';
    if (c.includes('dax')) return 'fa-flask';
    if (c.includes('brendan') || c.includes('agente 14') || c.includes('securoserv')) return 'fa-user-secret';
    return 'fa-crosshairs';
  }

  getSectionColor(seccionId?: string): string {
    if (!seccionId) return '#ffb833';
    const id = seccionId.toLowerCase();
    if (id.includes('prologo')) return '#3b82f6';
    if (id.includes('mision')) return '#ef4444';
    if (id.includes('negocio')) return '#10b981';
    if (id.includes('golpe')) return '#eab308';
    if (id.includes('personaje')) return '#f97316';
    if (id.includes('vehiculo')) return '#38bdf8';
    if (id.includes('arma')) return '#e11d48';
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

  ngOnDestroy(): void {
    this.vehiculosSub?.unsubscribe();
  }
}
