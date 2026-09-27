import { Component, EventEmitter, Input, Output } from '@angular/core';
import { GtaVehicle, DealerCategory } from '../../models/vehicle';
import { VehicleService } from '../../services/vehicle.service';
import { TranslationService } from '../../i18n';

@Component({
  selector: 'app-vehicle-drawer',
  templateUrl: './vehicle-drawer.component.html',
  styleUrls: ['./vehicle-drawer.component.css'],
  standalone: false
})
export class VehicleDrawerComponent {
  @Input() isOpen = false;
  @Input() gameMode: 'story' | 'online' = 'online';
  @Output() closeDrawer = new EventEmitter<void>();

  // Tabs del drawer
  drawerTabs: { id: string; label: string; icon: string }[] = [
    { id: 'vehiculos', label: 'Vehículos', icon: 'fa-car-side' },
    { id: 'misiones', label: 'Misiones', icon: 'fa-bullseye' },
    { id: 'item3', label: 'Item3', icon: 'fa-box' },
    { id: 'item4', label: 'Item4', icon: 'fa-crown' },
  ];
  activeDrawerTab = 'vehiculos';

  // Vista activa del drawer: 'tabs' | 'dealer-grid'
  drawerView: 'tabs' | 'dealer-grid' = 'tabs';

  // Concesionario actualmente abierto en la vista de grid
  activeDealerId: string | null = null;
  activeDealerName: string = '';

  // Vehículos del concesionario activo
  dealerVehicles: GtaVehicle[] = [];
  vehiclesLoading = false;
  vehiclesError = false;

  // Vehículo seleccionado en el grid
  selectedVehicle: GtaVehicle | null = null;

  // Cache de vehículos por concesionario
  private vehicleCache: { [dealerId: string]: GtaVehicle[] } = {};

  // Pestaña de categoría de vehículos activa ('all' o clase específica)
  selectedVehicleClass: string = 'all';

  // Definición centralizada de concesionarios
  readonly dealers: DealerCategory[] = [
    {
      id: 'legendarymotorsport',
      name: 'Legendary Motorsport',
      icon: 'fa-star',
      logoUrl: 'https://static.wikia.nocookie.net/gtawiki/images/f/fa/LegendaryMotorsport-GTAV-Logo.png/revision/latest',
      color: '#ffb833',
      gameMode: 'both',
      description: 'Superdeportivos, exóticos de competición y vehículos de hiperlujo.'
    },
    {
      id: 'superautos',
      name: 'Southern San Andreas',
      icon: 'fa-car',
      logoUrl: 'https://static.wikia.nocookie.net/degta/images/1/10/SSASA-Logo_2.png/revision/latest',
      color: '#3498db',
      gameMode: 'both',
      description: 'Muscle cars, compactos, sedanes, SUVs, todoterrenos y motos.'
    },
    {
      id: 'bennys',
      name: "Benny's Original MW",
      icon: 'fa-wrench',
      logoUrl: 'https://static.wikia.nocookie.net/public-5city/images/3/31/Benny%27s_logo.png/revision/latest',
      color: '#e67e22',
      gameMode: 'online',
      description: 'Taller de personalización radical, lowriders y conversiones tuners.'
    },
    {
      id: 'elitas',
      name: 'Elitas Travel',
      icon: 'fa-plane',
      logoUrl: '',
      color: '#8e44ad',
      gameMode: 'both',
      description: 'Aeronaves privadas, jets de negocios y helicópteros ejecutivos.'
    },
    {
      id: 'docktease',
      name: 'DockTease',
      icon: 'fa-ship',
      logoUrl: '',
      color: '#2980b9',
      gameMode: 'both',
      description: 'Embarcaciones náuticas, yates, lanchas rápidas y motos de agua.'
    },
    {
      id: 'warstock',
      name: 'Warstock C&C',
      icon: 'fa-bomb',
      logoUrl: '',
      color: '#c0392b',
      gameMode: 'both',
      description: 'Vehículos blindados, armamento militar pesado y maquinaria táctica.'
    },
  ];

  constructor(
    private vehicleService: VehicleService,
    readonly translationService: TranslationService
  ) {}

  get visibleDealers(): DealerCategory[] {
    return this.dealers.filter(d => d.gameMode === 'both' || d.gameMode === this.gameMode);
  }

  get dealerCategories(): { id: string; name: string; count: number; icon: string }[] {
    if (!this.dealerVehicles || this.dealerVehicles.length === 0) return [];

    const counts: { [cls: string]: number } = {};
    for (const v of this.dealerVehicles) {
      const cls = v.class || 'Otros';
      counts[cls] = (counts[cls] || 0) + 1;
    }

    const list = Object.keys(counts)
      .sort((a, b) => counts[b] - counts[a])
      .map(cls => ({
        id: cls,
        name: cls,
        count: counts[cls],
        icon: this.getCategoryTabIcon(cls)
      }));

    return [
      { id: 'all', name: 'Todos', count: this.dealerVehicles.length, icon: 'fa-layer-group' },
      ...list
    ];
  }

  get filteredDealerVehicles(): GtaVehicle[] {
    if (this.selectedVehicleClass === 'all') {
      return this.dealerVehicles;
    }
    return this.dealerVehicles.filter(v => (v.class || 'Otros') === this.selectedVehicleClass);
  }

  setDrawerTab(tabId: string): void {
    this.activeDrawerTab = tabId;
    if (this.drawerView === 'dealer-grid') {
      this.drawerView = 'tabs';
      this.activeDealerId = null;
    }
  }

  openDealerGrid(dealerId: string, dealerName: string): void {
    this.activeDealerId = dealerId;
    this.activeDealerName = dealerName;
    this.selectedVehicle = null;
    this.selectedVehicleClass = 'all';
    this.drawerView = 'dealer-grid';
    this.loadDealerVehicles(dealerId);
  }

  closeDealerGrid(): void {
    this.drawerView = 'tabs';
    this.activeDealerId = null;
    this.selectedVehicle = null;
  }

  selectVehicle(v: GtaVehicle): void {
    this.selectedVehicle = this.selectedVehicle?.id === v.id ? null : v;
  }

  setVehicleCategory(catId: string): void {
    this.selectedVehicleClass = catId;
    if (this.selectedVehicle && catId !== 'all') {
      const curClass = this.selectedVehicle.class || 'Otros';
      if (curClass !== catId) {
        this.selectedVehicle = null;
      }
    }
  }

  onDealerLogoError(dealer: DealerCategory): void {
    dealer.logoFailed = true;
  }

  onVehicleImgError(v: GtaVehicle): void {
    v.imgFailed = true;
  }

  formatPrice(price: number): string {
    if (!price || price <= 0) {
      return this.translationService.currentLanguage() === 'en' ? 'Price not available' : 'Precio no disponible';
    }
    const locale = this.translationService.currentLanguage() === 'en' ? 'en-US' : 'es-ES';
    return '$' + price.toLocaleString(locale);
  }

  getCategoryTabIcon(cls: string): string {
    const c = cls.toLowerCase();
    if (c.includes('súper') || c.includes('super')) return 'fa-bolt';
    if (c.includes('deportivo') || c.includes('sport')) return 'fa-car-side';
    if (c.includes('clásico')) return 'fa-award';
    if (c.includes('muscle')) return 'fa-gauge-high';
    if (c.includes('moto') || c.includes('cycle')) return 'fa-motorcycle';
    if (c.includes('suv') || c.includes('camioneta')) return 'fa-truck-pickup';
    if (c.includes('todoterreno') || c.includes('offroad')) return 'fa-mountain';
    if (c.includes('sedán') || c.includes('sedan') || c.includes('cupé') || c.includes('compacto')) return 'fa-car';
    if (c.includes('militar') || c.includes('emergency')) return 'fa-shield-halved';
    if (c.includes('heli')) return 'fa-helicopter';
    if (c.includes('avión') || c.includes('plane')) return 'fa-plane';
    if (c.includes('embarc') || c.includes('boat')) return 'fa-ship';
    if (c.includes('furgoneta') || c.includes('van')) return 'fa-van-shuttle';
    if (c.includes('servicio') || c.includes('utilitario') || c.includes('comercial') || c.includes('indust')) return 'fa-truck';
    return 'fa-tag';
  }

  getVehicleIcon(v: GtaVehicle | null): string {
    if (!v) return 'fa-car';
    const cat = (v.category || v.class || '').toLowerCase();
    if (cat.includes('motor')) return 'fa-motorcycle';
    if (cat.includes('heli')) return 'fa-helicopter';
    if (cat.includes('plane') || cat.includes('avión')) return 'fa-plane';
    if (cat.includes('boat') || cat.includes('embarc')) return 'fa-ship';
    if (cat.includes('militar') || cat.includes('indust') || cat.includes('offroad') || cat.includes('todoterreno')) return 'fa-truck-monster';
    return 'fa-car';
  }

  onClose(): void {
    this.closeDrawer.emit();
  }

  private loadDealerVehicles(dealerId: string): void {
    if (this.vehicleCache[dealerId]) {
      this.dealerVehicles = this.vehicleCache[dealerId];
      return;
    }

    this.vehiclesLoading = true;
    this.vehiclesError = false;
    this.dealerVehicles = [];

    this.vehicleService.getVehicles().subscribe({
      next: (vehicles) => {
        this.vehicleCache = {};
        for (const v of vehicles) {
          const d = v.dealership || 'superautos';
          if (!this.vehicleCache[d]) {
            this.vehicleCache[d] = [];
          }
          this.vehicleCache[d].push(v);
        }
        this.dealerVehicles = this.vehicleCache[dealerId] || [];
        this.vehiclesLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar catálogo de vehículos:', err);
        this.vehiclesLoading = false;
        this.vehiclesError = true;
      }
    });
  }
}
