import { Component, EventEmitter, Input, Output, effect } from '@angular/core';
import { GtaVehicle, DealerCategory } from '../../models/vehicle';
import { GtaMission, GtaStrangerMission, StrangerSeriesGroup, GtaHeist } from '../../models/mission';
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

  // Tabs del drawer según el modo de juego (Golpes exclusivo de GTA Online)
  get drawerTabs(): { id: string; label: string; icon: string }[] {
    if (this.gameMode === 'online') {
      return [
        { id: 'vehiculos', label: 'Vehículos', icon: 'fa-car-side' },
        { id: 'misiones', label: 'Misiones', icon: 'fa-bullseye' },
        { id: 'item3', label: 'Item 3', icon: 'fa-box' },
        { id: 'golpes', label: 'Golpes', icon: 'fa-sack-dollar' },
      ];
    }
    return [
      { id: 'vehiculos', label: 'Vehículos', icon: 'fa-car-side' },
      { id: 'misiones', label: 'Misiones', icon: 'fa-bullseye' },
      { id: 'strangers', label: 'Extraños y Locos', icon: 'fa-mask' },
      { id: 'item4', label: 'Item4', icon: 'fa-crown' },
    ];
  }
  activeDrawerTab = 'vehiculos';

  // Golpes GTA Online (Heists)
  onlineHeists: GtaHeist[] = [];
  heistsLoading = false;
  heistsError = false;
  heistSearchQuery = '';
  selectedHeistCategoryFilter = 'all'; // 'all' | 'classic' | 'doomsday' | 'casino' | 'cayo_perico' | 'raid'
  selectedHeist: GtaHeist | null = null;

  // Misiones GTA Online (Contactos y Operaciones)
  onlineMissions: GtaMission[] = [];
  onlineMissionsLoading = false;
  onlineMissionsError = false;
  onlineMissionSearchQuery = '';
  selectedOnlineContactFilter = 'all'; // 'all' | 'gerald' | 'simeon' | 'lamar' | 'lester' | 'madrazo' | 'trevor' | 'agatha' | 'special'
  selectedOnlineCategoryFilter = 'all';

  // Misiones Modo Historia (Campaña Principal)
  storyMissions: GtaMission[] = [];
  missionsLoading = false;
  missionsError = false;
  missionSearchQuery = '';
  selectedCharacterFilter = 'all'; // 'all' | 'franklin' | 'michael' | 'trevor' | 'heists'
  expandedMissionId: string | null = null;

  // Extraños y Locos Modo Historia (Secundarias / Strangers & Freaks)
  strangerMissions: GtaStrangerMission[] = [];
  strangersLoading = false;
  strangersError = false;
  strangerSearchQuery = '';
  selectedStrangerCharacterFilter = 'all'; // 'all' | 'franklin' | 'michael' | 'trevor'
  selectedStrangerSeriesFilter = 'all'; // 'all' | id de serie
  strangerOnly100Filter = false;
  strangerSeriesViewMode: 'series' | 'list' = 'series';
  selectedStranger: GtaStrangerMission | null = null;
  expandedStrangerSeries: { [seriesId: string]: boolean } = {};

  // Vista activa del drawer: 'tabs' | 'dealer-grid' | 'vehicle-detail' | 'mission-detail' | 'stranger-detail' | 'heist-detail'
  drawerView: 'tabs' | 'dealer-grid' | 'vehicle-detail' | 'mission-detail' | 'stranger-detail' | 'heist-detail' = 'tabs';
  selectedMission: GtaMission | null = null;

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
      logoUrl: 'assets/data-images/vehicle_shops/LegendaryMotorsport-GTAV-Logo.png',
      color: '#ffb833',
      gameMode: 'both',
      description: 'Superdeportivos, exóticos de competición y vehículos de hiperlujo.'
    },
    {
      id: 'superautos',
      name: 'Southern San Andreas',
      icon: 'fa-car',
      logoUrl: 'assets/data-images/vehicle_shops/SSASA-Logo_2.png',
      color: '#3498db',
      gameMode: 'both',
      description: 'Muscle cars, compactos, sedanes, SUVs, todoterrenos y motos.'
    },
    {
      id: 'bennys',
      name: "Benny's Original MW",
      icon: 'fa-wrench',
      logoUrl: 'assets/data-images/vehicle_shops/BennysOriginalMotorWorks-GTAO-Logo.png',
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
    {
      id: 'pedal_and_metal',
      name: 'Pedal and Metal Cycles',
      icon: 'fa-bicycle',
      logoUrl: '',
      color: '#27ae60',
      gameMode: 'both',
      description: 'Bicicletas, ciclomotores y vehículos de pedal de Los Santos.'
    },
    {
      id: 'arena_war',
      name: 'Arena War',
      icon: 'fa-skull-crossbones',
      logoUrl: '',
      color: '#e74c3c',
      gameMode: 'online',
      description: 'Vehículos modificados de combate para la Arena de Los Santos.'
    },
    {
      id: 'especiales',
      name: 'Vehículos Especiales',
      icon: 'fa-wand-magic-sparkles',
      logoUrl: '',
      color: '#9b59b6',
      gameMode: 'both',
      description: 'Vehículos únicos, de misión, de evento o de acceso especial.'
    },
    {
      id: 'pegasus',
      name: 'Pegasus',
      icon: 'fa-horse',
      logoUrl: '',
      color: '#1abc9c',
      gameMode: 'online',
      description: 'Vehículos almacenados en Pegasus: solicítelos por teléfono desde cualquier lugar.'
    },
  ];

  constructor(
    private vehicleService: VehicleService,
    private missionService: MissionService,
    readonly translationService: TranslationService
  ) {
    effect(() => {
      // Reacciona a cambios de idioma y recarga misiones si ya están cargadas en modo historia o golpes en online
      const lang = this.translationService.currentLanguage();
      if (this.gameMode === 'story') {
        if (this.storyMissions.length > 0) {
          this.loadStoryMissions(true, this.selectedMission?.id);
        }
        if (this.strangerMissions.length > 0) {
          this.loadStrangerMissions(true, this.selectedStranger?.id);
        }
      } else {
        if (this.onlineMissions.length > 0) {
          this.loadOnlineMissions(true, this.selectedMission?.id);
        }
        if (this.onlineHeists.length > 0) {
          this.loadOnlineHeists(true, this.selectedHeist?.id);
        }
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
    if (this.drawerView === 'dealer-grid' || this.drawerView === 'vehicle-detail' || this.drawerView === 'mission-detail' || this.drawerView === 'stranger-detail' || this.drawerView === 'heist-detail') {
      this.drawerView = 'tabs';
      this.activeDealerId = null;
      this.selectedVehicle = null;
      this.selectedMission = null;
      this.selectedStranger = null;
      this.selectedHeist = null;
    }
    if (this.gameMode === 'story') {
      if (tabId === 'misiones' && this.storyMissions.length === 0) {
        this.loadStoryMissions();
      }
      if (tabId === 'strangers' && this.strangerMissions.length === 0) {
        this.loadStrangerMissions();
      }
    } else {
      if (tabId === 'misiones' && this.onlineMissions.length === 0) {
        this.loadOnlineMissions();
      }
      if (tabId === 'golpes' && this.onlineHeists.length === 0) {
        this.loadOnlineHeists();
      }
    }
  }

  // -------------------------------------------------------------
  // MISIONES GTA ONLINE (CONTACTOS Y OPERACIONES)
  // -------------------------------------------------------------
  loadOnlineMissions(force = false, keepSelectedId?: string): void {
    if (this.onlineMissions.length > 0 && !force) return;
    this.onlineMissionsLoading = true;
    this.onlineMissionsError = false;
    this.missionService.getOnlineMissions().subscribe({
      next: (missions) => {
        this.onlineMissions = missions;
        if (keepSelectedId) {
          this.selectedMission = missions.find(m => m.id === keepSelectedId) || null;
        }
        this.onlineMissionsLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar misiones de GTA Online:', err);
        this.onlineMissionsLoading = false;
        this.onlineMissionsError = true;
      }
    });
  }

  setOnlineContactFilter(filter: string): void {
    this.selectedOnlineContactFilter = filter;
  }

  setOnlineCategoryFilter(category: string): void {
    this.selectedOnlineCategoryFilter = category;
  }

  get onlineContactsList(): { id: string; name: string; count: number; icon: string; color: string }[] {
    return [
      { id: 'all', name: 'Todos', count: this.onlineMissions.length, icon: 'fa-globe', color: '#ffb833' },
      { id: 'gerald', name: 'Gerald', count: this.getOnlineContactCount('gerald'), icon: 'fa-pills', color: '#9b59b6' },
      { id: 'simeon', name: 'Simeon', count: this.getOnlineContactCount('simeon'), icon: 'fa-car', color: '#f1c40f' },
      { id: 'lamar', name: 'Lamar', count: this.getOnlineContactCount('lamar'), icon: 'fa-cannabis', color: '#2ecc71' },
      { id: 'lester', name: 'Lester', count: this.getOnlineContactCount('lester'), icon: 'fa-laptop-code', color: '#3498db' },
      { id: 'madrazo', name: 'Madrazo', count: this.getOnlineContactCount('madrazo'), icon: 'fa-crosshairs', color: '#e74c3c' },
      { id: 'trevor', name: 'Trevor / Ron', count: this.getOnlineContactCount('trevor'), icon: 'fa-skull', color: '#e67e22' },
      { id: 'agatha', name: 'Agatha Baker', count: this.getOnlineContactCount('agatha'), icon: 'fa-gem', color: '#d4af37' },
      { id: 'special', name: 'Operaciones Especiales', count: this.getOnlineContactCount('special'), icon: 'fa-shield-halved', color: '#1abc9c' }
    ];
  }

  getOnlineContactCount(filter: string): number {
    const f = filter.toLowerCase();
    if (f === 'all') return this.onlineMissions.length;
    if (f === 'trevor') {
      return this.onlineMissions.filter(m => m.character.toLowerCase().includes('trevor') || m.character.toLowerCase().includes('ron')).length;
    }
    if (f === 'special') {
      return this.onlineMissions.filter(m =>
        m.character.toLowerCase().includes('brendan') ||
        m.character.toLowerCase().includes('agente 14') ||
        m.character.toLowerCase().includes('securoserv') ||
        m.character.toLowerCase().includes('franklin') ||
        m.character.toLowerCase().includes('dax') ||
        m.character.toLowerCase().includes('vincent')
      ).length;
    }
    return this.onlineMissions.filter(m => m.character.toLowerCase().includes(f)).length;
  }

  get onlineCategories(): string[] {
    const set = new Set<string>();
    for (const m of this.onlineMissions) {
      if (m.category) set.add(m.category);
    }
    return Array.from(set).sort();
  }

  get filteredOnlineMissions(): GtaMission[] {
    let list = this.onlineMissions;
    const cf = this.selectedOnlineContactFilter.toLowerCase();
    if (cf !== 'all') {
      if (cf === 'trevor') {
        list = list.filter(m => m.character.toLowerCase().includes('trevor') || m.character.toLowerCase().includes('ron'));
      } else if (cf === 'special') {
        list = list.filter(m =>
          m.character.toLowerCase().includes('brendan') ||
          m.character.toLowerCase().includes('agente 14') ||
          m.character.toLowerCase().includes('securoserv') ||
          m.character.toLowerCase().includes('franklin') ||
          m.character.toLowerCase().includes('dax') ||
          m.character.toLowerCase().includes('vincent')
        );
      } else {
        list = list.filter(m => m.character.toLowerCase().includes(cf));
      }
    }

    if (this.selectedOnlineCategoryFilter !== 'all') {
      list = list.filter(m => m.category === this.selectedOnlineCategoryFilter);
    }

    const q = this.onlineMissionSearchQuery.trim().toLowerCase();
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

  getOnlineContactBadgeClass(char: string): string {
    const c = char.toLowerCase();
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

  openMissionDetail(mission: GtaMission): void {
    this.selectedMission = mission;
    this.drawerView = 'mission-detail';
  }

  closeMissionDetail(): void {
    this.selectedMission = null;
    this.drawerView = 'tabs';
  }

  get currentMissionsList(): GtaMission[] {
    return this.gameMode === 'story' ? this.storyMissions : this.onlineMissions;
  }

  get previousMission(): GtaMission | null {
    if (!this.selectedMission || this.currentMissionsList.length === 0) return null;
    const idx = this.currentMissionsList.findIndex(m => m.id === this.selectedMission!.id);
    return idx > 0 ? this.currentMissionsList[idx - 1] : null;
  }

  get nextMission(): GtaMission | null {
    if (!this.selectedMission || this.currentMissionsList.length === 0) return null;
    const idx = this.currentMissionsList.findIndex(m => m.id === this.selectedMission!.id);
    return (idx >= 0 && idx < this.currentMissionsList.length - 1) ? this.currentMissionsList[idx + 1] : null;
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

  // -------------------------------------------------------------
  // EXTRAÑOS Y LOCOS (STRANGERS AND FREAKS) MODO HISTORIA
  // -------------------------------------------------------------
  loadStrangerMissions(force = false, keepSelectedId?: string): void {
    if (this.strangerMissions.length > 0 && !force) return;
    this.strangersLoading = true;
    this.strangersError = false;
    this.missionService.getStoryStrangers().subscribe({
      next: (missions) => {
        this.strangerMissions = missions;
        if (keepSelectedId) {
          this.selectedStranger = missions.find(m => m.id === keepSelectedId) || null;
        }
        // Las categorías de series comienzan contraídas por defecto
        this.strangersLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar misiones de extraños y locos:', err);
        this.strangersLoading = false;
        this.strangersError = true;
      }
    });
  }

  setStrangerCharacterFilter(filter: string): void {
    this.selectedStrangerCharacterFilter = filter;
  }

  setStrangerSeriesFilter(seriesId: string): void {
    this.selectedStrangerSeriesFilter = seriesId;
    if (seriesId && seriesId !== 'all') {
      this.expandedStrangerSeries[seriesId] = true;
    }
  }

  toggleStranger100Filter(): void {
    this.strangerOnly100Filter = !this.strangerOnly100Filter;
  }

  setStrangerViewMode(mode: 'series' | 'list'): void {
    this.strangerSeriesViewMode = mode;
  }

  toggleStrangerSeriesExpand(seriesId: string): void {
    this.expandedStrangerSeries[seriesId] = !this.isStrangerSeriesExpanded(seriesId);
  }

  isStrangerSeriesExpanded(seriesId: string): boolean {
    return !!this.expandedStrangerSeries[seriesId];
  }

  openStrangerDetail(mission: GtaStrangerMission): void {
    this.selectedStranger = mission;
    this.drawerView = 'stranger-detail';
  }

  closeStrangerDetail(): void {
    this.selectedStranger = null;
    this.drawerView = 'tabs';
  }

  get strangerSeriesList(): { id: string; name: string; count: number; icon: string; color: string }[] {
    const map = new Map<string, { id: string; name: string; count: number; icon: string; color: string }>();
    for (const m of this.strangerMissions) {
      if (!map.has(m.series)) {
        map.set(m.series, {
          id: m.series,
          name: m.seriesName,
          count: 0,
          icon: m.seriesIcon || 'fa-user-ninja',
          color: m.seriesColor || '#ffb833'
        });
      }
      map.get(m.series)!.count++;
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }

  get filteredStrangerMissions(): GtaStrangerMission[] {
    let list = this.strangerMissions;
    const charFilter = this.selectedStrangerCharacterFilter.toLowerCase();
    if (charFilter !== 'all') {
      list = list.filter(m => m.character.toLowerCase().includes(charFilter));
    }
    if (this.selectedStrangerSeriesFilter !== 'all') {
      list = list.filter(m => m.series === this.selectedStrangerSeriesFilter);
    }
    if (this.strangerOnly100Filter) {
      list = list.filter(m => m.requiredFor100);
    }
    const q = this.strangerSearchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(m =>
        m.title.toLowerCase().includes(q) ||
        (m.titleEn && m.titleEn.toLowerCase().includes(q)) ||
        m.seriesName.toLowerCase().includes(q) ||
        m.giver.toLowerCase().includes(q) ||
        m.character.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q)
      );
    }
    return list;
  }

  get filteredStrangerSeriesGroups(): StrangerSeriesGroup[] {
    const missions = this.filteredStrangerMissions;
    const map = new Map<string, StrangerSeriesGroup>();
    for (const m of missions) {
      if (!map.has(m.series)) {
        map.set(m.series, {
          id: m.series,
          name: m.seriesName,
          icon: m.seriesIcon || 'fa-user-ninja',
          color: m.seriesColor || '#ffb833',
          missions: [],
          total: m.seriesTotal
        });
      }
      map.get(m.series)!.missions.push(m);
    }
    return Array.from(map.values());
  }

  getStrangerCharacterMissionCount(filter: string): number {
    const f = filter.toLowerCase();
    if (f === 'all') return this.strangerMissions.length;
    return this.strangerMissions.filter(m => m.character.toLowerCase().includes(f)).length;
  }

  getStranger100MissionCount(): number {
    return this.strangerMissions.filter(m => m.requiredFor100).length;
  }

  get previousStranger(): GtaStrangerMission | null {
    if (!this.selectedStranger || this.strangerMissions.length === 0) return null;
    const idx = this.strangerMissions.findIndex(m => m.id === this.selectedStranger!.id);
    return idx > 0 ? this.strangerMissions[idx - 1] : null;
  }

  get nextStranger(): GtaStrangerMission | null {
    if (!this.selectedStranger || this.strangerMissions.length === 0) return null;
    const idx = this.strangerMissions.findIndex(m => m.id === this.selectedStranger!.id);
    return (idx >= 0 && idx < this.strangerMissions.length - 1) ? this.strangerMissions[idx + 1] : null;
  }

  selectPreviousStranger(): void {
    const prev = this.previousStranger;
    if (prev) this.selectedStranger = prev;
  }

  selectNextStranger(): void {
    const next = this.nextStranger;
    if (next) this.selectedStranger = next;
  }

  getStrangerAccentColor(m: GtaStrangerMission | null): string {
    if (!m) return '#ffb833';
    return m.seriesColor || '#ffb833';
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
    } else if (this.drawerView === 'mission-detail') {
      this.closeMissionDetail();
    } else if (this.drawerView === 'stranger-detail') {
      this.closeStrangerDetail();
    } else if (this.drawerView === 'heist-detail') {
      this.closeHeistDetail();
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
    if (c.includes('súper') || c.includes('super')) return 'fa-bolt';
    if (c.includes('deportivo') || c.includes('sport')) return 'fa-car-side';
    if (c.includes('clásico')) return 'fa-award';
    if (c.includes('muscle')) return 'fa-gauge-high';
    if (c.includes('moto') || c.includes('cycle') || c === 'motocicleta') return 'fa-motorcycle';
    if (c === 'cycle' || c.includes('biciclet') || c.includes('pedal')) return 'fa-bicycle';
    if (c.includes('suv') || c.includes('camioneta')) return 'fa-truck-pickup';
    if (c.includes('todoterreno') || c.includes('offroad')) return 'fa-mountain';
    if (c.includes('sedán') || c.includes('sedan') || c.includes('cupé') || c.includes('compacto')) return 'fa-car';
    if (c.includes('military') || c.includes('militar') || c === 'emergency') return 'fa-shield-halved';
    if (c === 'rail' || c.includes('tren') || c.includes('ferrov')) return 'fa-train';
    if (c === 'industrial' || c.includes('indust')) return 'fa-industry';
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

  /** Resolves the description for a dealer card.
   *  Uses i18n keys for the original 6 dealers and falls back
   *  to the static description property for newer ones. */
  getDealerDesc(dealer: DealerCategory): string {
    const i18nKeyMap: { [id: string]: string } = {
      legendarymotorsport: 'transports.dealers.legendaryDesc',
      superautos: 'transports.dealers.superautosDesc',
      bennys: 'transports.dealers.bennysDesc',
      elitas: 'transports.dealers.elitasDesc',
      docktease: 'transports.dealers.dockteaseDesc',
      warstock: 'transports.dealers.warstockDesc',
      pegasus: 'transports.dealers.pegasusDesc',
      pedal_and_metal: 'transports.dealers.pedalAndMetalDesc',
      arena_war: 'transports.dealers.arenaWarDesc',
      especiales: 'transports.dealers.especialesDesc',
    };
    const key = i18nKeyMap[dealer.id];
    if (key) {
      const translated = this.translationService.t(key);
      if (translated && !translated.startsWith('transports.')) return translated;
    }
    return dealer.description;
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

  // -------------------------------------------------------------
  // GOLPES MODO ONLINE (HEISTS)
  // -------------------------------------------------------------
  loadOnlineHeists(force = false, keepSelectedId?: string): void {
    if (this.onlineHeists.length > 0 && !force) return;
    this.heistsLoading = true;
    this.heistsError = false;
    this.missionService.getOnlineHeists().subscribe({
      next: (heists) => {
        this.onlineHeists = heists;
        if (keepSelectedId) {
          this.selectedHeist = heists.find(h => h.id === keepSelectedId) || null;
        }
        this.heistsLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar golpes de GTA Online:', err);
        this.heistsLoading = false;
        this.heistsError = true;
      }
    });
  }

  setHeistCategoryFilter(cat: string): void {
    this.selectedHeistCategoryFilter = cat;
  }

  get filteredOnlineHeists(): GtaHeist[] {
    let list = this.onlineHeists;
    const cat = this.selectedHeistCategoryFilter.toLowerCase();
    if (cat !== 'all') {
      list = list.filter(h => h.category.toLowerCase() === cat);
    }
    const q = this.heistSearchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(h =>
        h.title.toLowerCase().includes(q) ||
        (h.titleEn && h.titleEn.toLowerCase().includes(q)) ||
        h.giver.toLowerCase().includes(q) ||
        h.target.toLowerCase().includes(q) ||
        h.propertyRequired.toLowerCase().includes(q) ||
        h.description.toLowerCase().includes(q) ||
        h.categoryLabel.toLowerCase().includes(q)
      );
    }
    return list;
  }

  getHeistCategoryCount(cat: string): number {
    if (cat === 'all') return this.onlineHeists.length;
    return this.onlineHeists.filter(h => h.category.toLowerCase() === cat.toLowerCase()).length;
  }

  openHeistDetail(heist: GtaHeist): void {
    this.selectedHeist = heist;
    this.drawerView = 'heist-detail';
  }

  closeHeistDetail(): void {
    this.selectedHeist = null;
    this.drawerView = 'tabs';
  }

  get previousHeist(): GtaHeist | null {
    if (!this.selectedHeist || this.onlineHeists.length === 0) return null;
    const idx = this.onlineHeists.findIndex(h => h.id === this.selectedHeist!.id);
    return idx > 0 ? this.onlineHeists[idx - 1] : null;
  }

  get nextHeist(): GtaHeist | null {
    if (!this.selectedHeist || this.onlineHeists.length === 0) return null;
    const idx = this.onlineHeists.findIndex(h => h.id === this.selectedHeist!.id);
    return (idx >= 0 && idx < this.onlineHeists.length - 1) ? this.onlineHeists[idx + 1] : null;
  }

  selectPreviousHeist(): void {
    const prev = this.previousHeist;
    if (prev) this.selectedHeist = prev;
  }

  selectNextHeist(): void {
    const next = this.nextHeist;
    if (next) this.selectedHeist = next;
  }

  getHeistAccentColor(h: GtaHeist | null): string {
    if (!h) return '#ffb833';
    return h.badgeColor || '#ffb833';
  }
}

