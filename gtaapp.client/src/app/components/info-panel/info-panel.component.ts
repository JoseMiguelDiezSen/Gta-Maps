import { Component, EventEmitter, Input, Output, effect } from '@angular/core';
import { GtaVehicle, DealerCategory } from '../../models/vehicle';
import { GtaMission } from '../../models/mission';
import { VehicleService } from '../../services/vehicle.service';
import { MissionService } from '../../services/mission.service';
import { TranslationService } from '../../i18n';

@Component({
  selector: 'app-info-panel',
  templateUrl: './info-panel.component.html',
  styleUrls: ['./info-panel.component.css'],
  standalone: false
})
export class InfoPanelComponent {
  @Input() isOpen = false;
  @Input() gameMode: 'story' | 'online' = 'online';
  @Output() closeDrawer = new EventEmitter<void>();

  // Tabs del drawer
  drawerTabs: { id: string; label: string; icon: string }[] = [
    { id: 'vehiculos', label: 'VehÃ­culos', icon: 'fa-car-side' },
    { id: 'misiones', label: 'Misiones', icon: 'fa-bullseye' },
    { id: 'item3', label: 'Item3', icon: 'fa-box' },
    { id: 'item4', label: 'Item4', icon: 'fa-crown' },
  ];
  activeDrawerTab = 'vehiculos';

  // Misiones Modo Historia
  storyMissions: GtaMission[] = [];
  missionsLoading = false;
  missionsError = false;
  missionSearchQuery = '';
  selectedCharacterFilter = 'all'; // 'all' | 'franklin' | 'michael' | 'trevor' | 'heists'
  expandedMissionId: string | null = null;

  // Vista activa del drawer: 'tabs' | 'dealer-grid' | 'vehicle-detail' | 'mission-detail'
  drawerView: 'tabs' | 'dealer-grid' | 'vehicle-detail' | 'mission-detail' = 'tabs';
  selectedMission: GtaMission | null = null;

  // Concesionario actualmente abierto en la vista de grid
  activeDealerId: string | null = null;
  activeDealerName: string = '';

  // VehÃ­culos del concesionario activo
  dealerVehicles: GtaVehicle[] = [];
  vehiclesLoading = false;
  vehiclesError = false;

  // VehÃ­culo seleccionado en el grid
  selectedVehicle: GtaVehicle | null = null;

  // Cache de vehÃ­culos por concesionario
  private vehicleCache: { [dealerId: string]: GtaVehicle[] } = {};

  // PestaÃ±a de categorÃ­a de vehÃ­culos activa ('all' o clase especÃ­fica)
  selectedVehicleClass: string = 'all';

  // DefiniciÃ³n centralizada de concesionarios
  readonly dealers: DealerCategory[] = [
    {
      id: 'legendarymotorsport',
      name: 'Legendary Motorsport',
      icon: 'fa-star',
      logoUrl: 'https://static.wikia.nocookie.net/gtawiki/images/f/fa/LegendaryMotorsport-GTAV-Logo.png/revision/latest',
      color: '#ffb833',
      gameMode: 'both',
      description: 'Superdeportivos, exÃ³ticos de competiciÃ³n y vehÃ­culos de hiperlujo.'
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
      description: 'Taller de personalizaciÃ³n radical, lowriders y conversiones tuners.'
    },
    {
      id: 'elitas',
      name: 'Elitas Travel',
      icon: 'fa-plane',
      logoUrl: '',
      color: '#8e44ad',
      gameMode: 'both',
      description: 'Aeronaves privadas, jets de negocios y helicÃ³pteros ejecutivos.'
    },
    {
      id: 'docktease',
      name: 'DockTease',
      icon: 'fa-ship',
      logoUrl: '',
      color: '#2980b9',
      gameMode: 'both',
      description: 'Embarcaciones nÃ¡uticas, yates, lanchas rÃ¡pidas y motos de agua.'
    },
    {
      id: 'warstock',
      name: 'Warstock C&C',
      icon: 'fa-bomb',
      logoUrl: '',
      color: '#c0392b',
      gameMode: 'both',
      description: 'VehÃ­culos blindados, armamento militar pesado y maquinaria tÃ¡ctica.'
    },
  ];

  constructor(
    private vehicleService: VehicleService,
    private missionService: MissionService,
    readonly translationService: TranslationService
  ) {
    effect(() => {
      // Reacciona a cambios de idioma y recarga misiones si ya estÃ¡n cargadas
      const lang = this.translationService.currentLanguage();
      if (this.storyMissions.length > 0) {
        this.loadStoryMissions(true, this.selectedMission?.id);
      }
    });
  }

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

  // -------------------------------------------------------------
  // MISIONES MODO HISTORIA
  // -------------------------------------------------------------
  loadStoryMissions(force = false, keepSelectedId?: string): void {
    if (this.storyMissions.length > 0 && !force) return;
    this.missionsLoading = true;
    this.missionsError = false;
    this.missionService.getStoryMissions().subscribe({
      next: (missions) => {
        this.storyMissions = missions;
        if (keepSelectedId) {
          this.selectedMission = missions.find(m => m.id === keepSelectedId) || null;
        }
        this.missionsLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar misiones de historia:', err);
        this.missionsLoading = false;
        this.missionsError = true;
      }
    });
  }

  toggleMissionExpand(id: string): void {
    this.expandedMissionId = this.expandedMissionId === id ? null : id;
  }

  setCharacterFilter(filter: string): void {
    this.selectedCharacterFilter = filter;
  }

  get filteredStoryMissions(): GtaMission[] {
    let list = this.storyMissions;
    const filter = this.selectedCharacterFilter.toLowerCase();
    if (filter !== 'all') {
      if (filter === 'heists') {
        list = list.filter(m => m.category.toLowerCase().includes('golpe') || m.category.toLowerCase().includes('heist'));
      } else {
        list = list.filter(m => m.character.toLowerCase().includes(filter));
      }
    }
    const q = this.missionSearchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(m =>
        m.title.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.giver.toLowerCase().includes(q) ||
        m.character.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q)
      );
    }
    return list;
  }

  getCharacterMissionCount(filter: string): number {
    const f = filter.toLowerCase();
    if (f === 'all') return this.storyMissions.length;
    if (f === 'heists') {
      return this.storyMissions.filter(m => m.category.toLowerCase().includes('golpe') || m.category.toLowerCase().includes('heist')).length;
    }
    return this.storyMissions.filter(m => m.character.toLowerCase().includes(f)).length;
  }

  getCharacterBadgeClass(char: string): string {
    const c = char.toLowerCase();
    if (c.includes('michael') && c.includes('trevor') && c.includes('franklin')) return 'badge-trio';
    if (c.includes('michael') && c.includes('trevor')) return 'badge-duo-mt';
    if (c.includes('michael') && c.includes('franklin')) return 'badge-duo-mf';
    if (c.includes('franklin') && c.includes('trevor')) return 'badge-duo-ft';
    if (c.includes('franklin')) return 'badge-franklin';
    if (c.includes('michael')) return 'badge-michael';
    if (c.includes('trevor')) return 'badge-trevor';
    return 'badge-neutral';
  }

  setDrawerTab(tabId: string): void {
    this.activeDrawerTab = tabId;
    if (this.drawerView === 'dealer-grid' || this.drawerView === 'vehicle-detail' || this.drawerView === 'mission-detail') {
      this.drawerView = 'tabs';
      this.activeDealerId = null;
      this.selectedVehicle = null;
      this.selectedMission = null;
    }
    if (tabId === 'misiones' && this.storyMissions.length === 0) {
      this.loadStoryMissions();
    }
  }

  openMissionDetail(mission: GtaMission): void {
    this.selectedMission = mission;
    this.drawerView = 'mission-detail';
  }

  closeMissionDetail(): void {
    this.selectedMission = null;
    this.drawerView = 'tabs';
  }

  get previousMission(): GtaMission | null {
    if (!this.selectedMission || this.storyMissions.length === 0) return null;
    const idx = this.storyMissions.findIndex(m => m.id === this.selectedMission!.id);
    return idx > 0 ? this.storyMissions[idx - 1] : null;
  }

  get nextMission(): GtaMission | null {
    if (!this.selectedMission || this.storyMissions.length === 0) return null;
    const idx = this.storyMissions.findIndex(m => m.id === this.selectedMission!.id);
    return (idx >= 0 && idx < this.storyMissions.length - 1) ? this.storyMissions[idx + 1] : null;
  }

  selectPreviousMission(): void {
    const prev = this.previousMission;
    if (prev) this.selectedMission = prev;
  }

  selectNextMission(): void {
    const next = this.nextMission;
    if (next) this.selectedMission = next;
  }

  getMissionAccentColor(m: GtaMission | null): string {
    if (!m) return '#ffb833';
    const c = m.character.toLowerCase();
    const cat = m.category.toLowerCase();
    if (cat.includes('golpe') || cat.includes('heist') || cat.includes('final')) return '#f1c40f';
    if (c.includes('franklin') && !c.includes('michael') && !c.includes('trevor')) return '#2ecc71';
    if (c.includes('michael') && !c.includes('franklin') && !c.includes('trevor')) return '#3498db';
    if (c.includes('trevor') && !c.includes('franklin') && !c.includes('michael')) return '#e67e22';
    return '#ffb833';
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

  backToDealerGrid(): void {
    this.drawerView = 'dealer-grid';
    this.selectedVehicle = null;
  }

  onBreadcrumbBack(): void {
    if (this.drawerView === 'vehicle-detail') {
      this.backToDealerGrid();
    } else if (this.drawerView === 'dealer-grid') {
      this.closeDealerGrid();
    }
  }

  selectVehicle(v: GtaVehicle): void {
    this.selectedVehicle = v;
    this.drawerView = 'vehicle-detail';
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
    if (c.includes('sÃºper') || c.includes('super')) return 'fa-bolt';
    if (c.includes('deportivo') || c.includes('sport')) return 'fa-car-side';
    if (c.includes('clÃ¡sico')) return 'fa-award';
    if (c.includes('muscle')) return 'fa-gauge-high';
    if (c.includes('moto') || c.includes('cycle')) return 'fa-motorcycle';
    if (c.includes('suv') || c.includes('camioneta')) return 'fa-truck-pickup';
    if (c.includes('todoterreno') || c.includes('offroad')) return 'fa-mountain';
    if (c.includes('sedÃ¡n') || c.includes('sedan') || c.includes('cupÃ©') || c.includes('compacto')) return 'fa-car';
    if (c.includes('militar') || c.includes('emergency')) return 'fa-shield-halved';
    if (c.includes('heli')) return 'fa-helicopter';
    if (c.includes('aviÃ³n') || c.includes('plane')) return 'fa-plane';
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
    if (cat.includes('plane') || cat.includes('aviÃ³n')) return 'fa-plane';
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
        console.error('Error al cargar catÃ¡logo de vehÃ­culos:', err);
        this.vehiclesLoading = false;
        this.vehiclesError = true;
      }
    });
  }
}

