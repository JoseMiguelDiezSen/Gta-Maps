import { Component, EventEmitter, Input, Output, OnChanges, OnDestroy, SimpleChanges, effect } from '@angular/core';
import { Subscription } from 'rxjs';
import { GtaVehicle, DealerCategory } from '../../models/gta5/vehicle';
import { GtaMission, GtaStrangerMission, StrangerSeriesGroup, GtaHeist } from '../../models/gta5/mission';
import { GtaMystery } from '../../models/gta5/mystery';
import { GtaWeapon } from '../../models/gta5/weapon';
import { VehicleService } from '../../services/gta5/vehicle.service';
import { MissionService } from '../../services/gta5/mission.service';
import { WeaponService } from '../../services/gta5/weapon.service';
import { TranslationService } from '../../i18n';
import { CONCESIONARIOS_GTA5, SPECIAL_DEALER_IDS } from './vehiculos.config';

@Component({
  selector: 'app-info-panel',
  templateUrl: './info-panel.component.html',
  styleUrls: ['./info-panel.component.css'],
  standalone: false
})
export class InfoPanelComponent implements OnChanges, OnDestroy {
  @Input() isOpen = false;
  @Input() gameMode: 'story' | 'online' = 'online';
  @Output() closeDrawer = new EventEmitter<void>();
  @Output() locateOnMap = new EventEmitter<any>();

  // Subscripciones RxJS para evitar fugas y peticiones huérfanas
  private vehiclesSub?: Subscription;
  private missionsSub?: Subscription;
  private strangersSub?: Subscription;
  private heistsSub?: Subscription;
  private mysteriesSub?: Subscription;
  private weaponsSub?: Subscription;

  // Cache fields to prevent NG0103 Infinite Change Detection
  private _cachedTabsKey = '';
  private _cachedDrawerTabs: { id: string; label: string; icon: string }[] = [];

  private _cachedVisDealersKey = '';
  private _cachedVisDealers: DealerCategory[] = [];
  private _cachedDealCatKey = '';
  private _cachedDealCat: { id: string; name: string; count: number; icon: string }[] = [];
  private _cachedFDVKey = '';
  private _cachedFDV: GtaVehicle[] = [];
  private _cachedFSMKey = '';
  private _cachedFSM: GtaMission[] = [];
  private _cachedOCLKey = '';
  private _cachedOCL: { id: string; name: string; count: number; icon: string; color: string }[] = [];
  private _cachedOCatKey = '';
  private _cachedOCat: string[] = [];
  private _cachedFOMKey = '';
  private _cachedFOM: GtaMission[] = [];
  private _cachedSSLKey = '';
  private _cachedSSL: { id: string; name: string; count: number; icon: string; color: string }[] = [];
  private _cachedFStMKey = '';
  private _cachedFStM: GtaStrangerMission[] = [];
  private _cachedFSSGKey = '';
  private _cachedFSSG: StrangerSeriesGroup[] = [];
  private _cachedFOHKey = '';
  private _cachedFOH: GtaHeist[] = [];
  private _cachedFOMysKey = '';
  private _cachedFOMys: GtaMystery[] = [];
  private _cachedFWKey = '';
  private _cachedFW: GtaWeapon[] = [];
  private _cachedWCLKey = '';
  private _cachedWCL: { id: string; name: string; count: number; icon: string }[] = [];
  private _cachedDealerDesc: { [id: string]: string } = {};

  // Tabs del drawer traducidas dinámicamente según idioma activo y modo de juego
  get drawerTabs(): { id: string; label: string; icon: string }[] {
    const key = `${this.gameMode}_${this.translationService.currentLang}`;
    if (this._cachedTabsKey !== key) {
      this._cachedTabsKey = key;
      const isOnline = this.gameMode === 'online';
      this._cachedDrawerTabs = isOnline ? [
        { id: 'vehiculos', label: this.translationService.t('transports.tabs.vehicles') || 'Vehículos', icon: 'fa-car-side' },
        { id: 'armas', label: this.translationService.t('transports.tabs.armas') || 'Armas', icon: 'fa-gun' },
        { id: 'misiones', label: this.translationService.t('transports.tabs.missions') || 'Misiones', icon: 'fa-bullseye' },
        { id: 'golpes', label: this.translationService.t('transports.tabs.golpes') || 'Golpes', icon: 'fa-sack-dollar' },
        { id: 'misterios', label: this.translationService.t('transports.tabs.misterios') || 'Misterios', icon: 'fa-user-secret' }
      ] : [
        { id: 'vehiculos', label: this.translationService.t('transports.tabs.vehicles') || 'Vehículos', icon: 'fa-car-side' },
        { id: 'armas', label: this.translationService.t('transports.tabs.armas') || 'Armas', icon: 'fa-gun' },
        { id: 'misiones', label: this.translationService.t('transports.tabs.missions') || 'Misiones', icon: 'fa-bullseye' },
        { id: 'strangers', label: this.translationService.t('transports.tabs.strangers') || 'Extraños y Locos', icon: 'fa-mask' },
        { id: 'misterios', label: this.translationService.t('transports.tabs.misterios') || 'Misterios', icon: 'fa-user-secret' }
      ];
    }
    return this._cachedDrawerTabs;
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

  // Misterios GTA Online / San Andreas
  onlineMysteries: GtaMystery[] = [];
  mysteriesLoading = false;
  mysteriesError = false;
  mysterySearchQuery = '';
  selectedMysteryCategoryFilter = 'all'; // 'all' | 'paranormal' | 'conspiracy' | 'crimes' | 'easter_egg'
  selectedMystery: GtaMystery | null = null;

  // Armas GTA V / GTA Online
  weapons: GtaWeapon[] = [];
  weaponsLoading = false;
  weaponsError = false;
  weaponSearchQuery = '';
  selectedWeaponCategory = 'all';
  selectedWeaponSort: 'none' | 'damage' | 'fireRate' | 'accuracy' | 'range' | 'price' = 'none';
  selectedWeapon: GtaWeapon | null = null;

  // Vista activa del drawer: 'tabs' | 'dealer-grid' | 'vehicle-detail' | 'mission-detail' | 'stranger-detail' | 'heist-detail' | 'mystery-detail' | 'weapon-detail'
  drawerView: 'tabs' | 'dealer-grid' | 'vehicle-detail' | 'mission-detail' | 'stranger-detail' | 'heist-detail' | 'mystery-detail' | 'weapon-detail' = 'tabs';
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

  // Criterio de ordenación / filtro por estadísticas de vehículo ('none' | 'acceleration' | 'speed' | 'braking' | 'handling')
  selectedVehicleSort: 'none' | 'acceleration' | 'speed' | 'braking' | 'handling' = 'none';

  // Buscador de vehículos dentro del catálogo del concesionario
  dealerVehicleSearchQuery: string = '';

  // Definición centralizada de concesionarios (extraída a vehiculos.config.ts)
  readonly dealers: DealerCategory[] = CONCESIONARIOS_GTA5;

  constructor(
    private vehicleService: VehicleService,
    private missionService: MissionService,
    private weaponService: WeaponService,
    readonly translationService: TranslationService
  ) {
    effect(() => {
      // Reset cached values on language switch
      this.vehicleCache = {};
      this._cachedVisDealersKey = '';
      this._cachedDealCatKey = '';
      this._cachedFDVKey = '';

      if (this.activeDealerId) {
        this.loadDealerVehicles(this.activeDealerId);
      }

      if (this.gameMode === 'story') {
        if (this.storyMissions.length > 0) this.loadStoryMissions(true, this.selectedMission?.id);
        if (this.strangerMissions.length > 0) this.loadStrangerMissions(true, this.selectedStranger?.id);
        if (this.onlineMysteries.length > 0) this.loadOnlineMysteries(true, this.selectedMystery?.id);
        if (this.weapons.length > 0) this.loadWeapons(true, this.selectedWeapon?.id);
      } else {
        if (this.onlineMissions.length > 0) this.loadOnlineMissions(true, this.selectedMission?.id);
        if (this.onlineHeists.length > 0 || this.activeDrawerTab === 'golpes' || this.drawerView === 'heist-detail') {
          this.loadOnlineHeists(true, this.selectedHeist?.id);
        }
        if (this.onlineMysteries.length > 0) this.loadOnlineMysteries(true, this.selectedMystery?.id);
        if (this.weapons.length > 0) this.loadWeapons(true, this.selectedWeapon?.id);
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['gameMode']) {
      this.onlineMysteries = [];
      this.selectedMystery = null;
      this.weapons = [];
      this.selectedWeapon = null;
      this.storyMissions = [];
      this.onlineMissions = [];
      this.onlineHeists = [];
      this.dealerVehicles = [];
      this.activeDealerId = null;
      this.selectedVehicle = null;
      this._cachedVisDealersKey = '';

      if (this.activeDrawerTab === 'misterios') this.loadOnlineMysteries(true);
      if (this.activeDrawerTab === 'armas') this.loadWeapons(true);
      if (this.activeDrawerTab === 'misiones') {
        if (this.gameMode === 'story') this.loadStoryMissions(true);
        else this.loadOnlineMissions(true);
      }
      if (this.activeDrawerTab === 'golpes') this.loadOnlineHeists(true);
    }
    if (changes['isOpen'] && changes['isOpen'].currentValue) {
      if (this.activeDrawerTab === 'misterios' && this.onlineMysteries.length === 0) this.loadOnlineMysteries();
      if (this.activeDrawerTab === 'armas' && this.weapons.length === 0) this.loadWeapons();
      if (this.activeDrawerTab === 'misiones') {
        if (this.gameMode === 'story' && this.storyMissions.length === 0) this.loadStoryMissions();
        else if (this.gameMode === 'online' && this.onlineMissions.length === 0) this.loadOnlineMissions();
      }
      if (this.activeDrawerTab === 'golpes' && this.onlineHeists.length === 0) this.loadOnlineHeists();
    }
  }

  get visibleDealers(): DealerCategory[] {
    if (this.game === 'gta6') {
      const isEs = this.translationService.currentLanguage() === 'es';
      return isEs ? GTA6_DEALERS_ES : GTA6_DEALERS_EN;
    }
    if (this._cachedVisDealersKey !== this.gameMode) {
      this._cachedVisDealersKey = this.gameMode;
      this._cachedVisDealers = this.dealers.filter(d => d.gameMode === 'both' || d.gameMode === this.gameMode);
    }
    return this._cachedVisDealers;
  }

  get dealerCategories(): { id: string; name: string; count: number; icon: string }[] {
    const key = `${this.dealerVehicles ? this.dealerVehicles.length : 0}_${this.dealerVehicles && this.dealerVehicles[0] ? this.dealerVehicles[0].id : ''}`;
    if (this._cachedDealCatKey !== key) {
      this._cachedDealCatKey = key;
      if (!this.dealerVehicles || this.dealerVehicles.length === 0) {
        this._cachedDealCat = [];
      } else {
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

        this._cachedDealCat = [
          { id: 'all', name: 'Todos', count: this.dealerVehicles.length, icon: 'fa-layer-group' },
          ...list
        ];
      }
    }
    return this._cachedDealCat;
  }

  get filteredDealerVehicles(): GtaVehicle[] {
    const key = `${this.dealerVehicles ? this.dealerVehicles.length : 0}_${this.selectedVehicleClass}_${this.dealerVehicleSearchQuery}_${this.selectedVehicleSort}`;
    if (this._cachedFDVKey !== key) {
      this._cachedFDVKey = key;
      let list = this.dealerVehicles;
      if (this.selectedVehicleClass !== 'all') {
        list = list.filter(v => (v.class || 'Otros') === this.selectedVehicleClass);
      }
      const q = this.dealerVehicleSearchQuery.trim().toLowerCase();
      if (q) {
        list = list.filter(v =>
          (v.name && v.name.toLowerCase().includes(q)) ||
          (v.manufacturer && v.manufacturer.toLowerCase().includes(q)) ||
          (v.class && v.class.toLowerCase().includes(q))
        );
      }
      if (this.selectedVehicleSort !== 'none') {
        const sortKey = this.selectedVehicleSort;
        list = [...list].sort((a, b) => {
          const statA = (a as any)[sortKey] ?? 0;
          const statB = (b as any)[sortKey] ?? 0;
          if (statB !== statA) {
            return statB - statA;
          }
          return (a.name || '').localeCompare(b.name || '');
        });
      }
      this._cachedFDV = list;
    }
    return this._cachedFDV;
  }

  // -------------------------------------------------------------
  // MISIONES MODO HISTORIA
  // -------------------------------------------------------------
  loadStoryMissions(force = false, keepSelectedId?: string): void {
    if (this.storyMissions.length > 0 && !force) return;
    this.missionsLoading = true;
    this.missionsError = false;
    this.missionsSub?.unsubscribe();
    this.missionsSub = this.missionService.getStoryMissions().subscribe({
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
    const key = `${this.storyMissions ? this.storyMissions.length : 0}_${this.selectedCharacterFilter}_${this.missionSearchQuery}`;
    if (this._cachedFSMKey !== key) {
      this._cachedFSMKey = key;
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
      this._cachedFSM = list;
    }
    return this._cachedFSM;
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
    if (c.includes('lucia') && c.includes('jason')) return 'badge-duo-gta6';
    if (c.includes('lucia')) return 'badge-lucia';
    if (c.includes('jason')) return 'badge-jason';
    if (c.includes('franklin')) return 'badge-franklin';
    if (c.includes('michael')) return 'badge-michael';
    if (c.includes('trevor')) return 'badge-trevor';
    return 'badge-neutral';
  }

  setDrawerTab(tabId: string): void {
    this.activeDrawerTab = tabId;
    if (this.drawerView === 'dealer-grid' || this.drawerView === 'vehicle-detail' || this.drawerView === 'mission-detail' || this.drawerView === 'stranger-detail' || this.drawerView === 'heist-detail' || this.drawerView === 'mystery-detail' || this.drawerView === 'weapon-detail') {
      this.drawerView = 'tabs';
      this.activeDealerId = null;
      this.selectedVehicle = null;
      this.selectedMission = null;
      this.selectedStranger = null;
      this.selectedHeist = null;
      this.selectedMystery = null;
      this.selectedWeapon = null;
    }
    if (tabId === 'armas' && this.weapons.length === 0) {
      this.loadWeapons();
    }
    if (this.gameMode === 'story') {
      if (tabId === 'misiones' && this.storyMissions.length === 0) {
        this.loadStoryMissions();
      }
      if (tabId === 'strangers' && this.strangerMissions.length === 0) {
        this.loadStrangerMissions();
      }
      if (tabId === 'misterios' && this.onlineMysteries.length === 0) {
        this.loadOnlineMysteries();
      }
    } else {
      if (tabId === 'misiones' && this.onlineMissions.length === 0) {
        this.loadOnlineMissions();
      }
      if (tabId === 'golpes' && this.onlineHeists.length === 0) {
        this.loadOnlineHeists();
      }
      if (tabId === 'misterios' && this.onlineMysteries.length === 0) {
        this.loadOnlineMysteries();
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
    this.missionsSub?.unsubscribe();
    this.missionsSub = this.missionService.getOnlineMissions().subscribe({
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
    const key = `${this.onlineMissions ? this.onlineMissions.length : 0}`;
    if (this._cachedOCLKey !== key) {
      this._cachedOCLKey = key;
      this._cachedOCL = [
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
    return this._cachedOCL;
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
    const key = `${this.onlineMissions ? this.onlineMissions.length : 0}`;
    if (this._cachedOCatKey !== key) {
      this._cachedOCatKey = key;
      const set = new Set<string>();
      for (const m of this.onlineMissions) {
        if (m.category) set.add(m.category);
      }
      this._cachedOCat = Array.from(set).sort();
    }
    return this._cachedOCat;
  }

  get filteredOnlineMissions(): GtaMission[] {
    const key = `${this.onlineMissions ? this.onlineMissions.length : 0}_${this.selectedOnlineContactFilter}_${this.selectedOnlineCategoryFilter}_${this.onlineMissionSearchQuery}`;
    if (this._cachedFOMKey !== key) {
      this._cachedFOMKey = key;
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
      this._cachedFOM = list;
    }
    return this._cachedFOM;
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
    const c = m.character.toLowerCase();
    const cat = m.category.toLowerCase();
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

  // -------------------------------------------------------------
  // EXTRAÑOS Y LOCOS (STRANGERS AND FREAKS) MODO HISTORIA
  // -------------------------------------------------------------
  loadStrangerMissions(force = false, keepSelectedId?: string): void {
    if (this.strangerMissions.length > 0 && !force) return;
    this.strangersLoading = true;
    this.strangersError = false;
    this.strangersSub?.unsubscribe();
    this.strangersSub = this.missionService.getStoryStrangers().subscribe({
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
    const key = `${this.strangerMissions ? this.strangerMissions.length : 0}`;
    if (this._cachedSSLKey !== key) {
      this._cachedSSLKey = key;
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
      this._cachedSSL = Array.from(map.values()).sort((a, b) => b.count - a.count);
    }
    return this._cachedSSL;
  }

  get filteredStrangerMissions(): GtaStrangerMission[] {
    const key = `${this.strangerMissions ? this.strangerMissions.length : 0}_${this.selectedStrangerCharacterFilter}_${this.selectedStrangerSeriesFilter}_${this.strangerOnly100Filter}_${this.strangerSearchQuery}`;
    if (this._cachedFStMKey !== key) {
      this._cachedFStMKey = key;
      let list = this.strangerMissions;
      const charFilter = this.selectedStrangerCharacterFilter.toLowerCase();
      if (charFilter !== 'all') {
        if (charFilter === '100') {
          list = list.filter(m => m.requiredFor100);
        } else {
          list = list.filter(m => m.character.toLowerCase().includes(charFilter));
        }
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
      this._cachedFStM = list;
    }
    return this._cachedFStM;
  }

  get filteredStrangerSeriesGroups(): StrangerSeriesGroup[] {
    const missions = this.filteredStrangerMissions;
    const key = `${missions.length}_${missions[0] ? missions[0].id : ''}`;
    if (this._cachedFSSGKey !== key) {
      this._cachedFSSGKey = key;
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
      this._cachedFSSG = Array.from(map.values());
    }
    return this._cachedFSSG;
  }

  getStrangerCharacterMissionCount(filter: string): number {
    const f = filter.toLowerCase();
    if (f === 'all') return this.strangerMissions.length;
    if (f === '100') return this.strangerMissions.filter(m => m.requiredFor100).length;
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
    this.selectedVehicleSort = 'none';
    this.dealerVehicleSearchQuery = '';
    this.drawerView = 'dealer-grid';
    this.loadDealerVehicles(dealerId);
  }

  closeDealerGrid(): void {
    this.drawerView = 'tabs';
    this.activeDealerId = null;
    this.selectedVehicle = null;
    this.selectedVehicleSort = 'none';
    this.dealerVehicleSearchQuery = '';
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
    } else if (this.drawerView === 'mystery-detail') {
      this.closeMysteryDetail();
    } else if (this.drawerView === 'weapon-detail') {
      this.closeWeaponDetail();
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

  setVehicleSort(sort: 'none' | 'acceleration' | 'speed' | 'braking' | 'handling'): void {
    this.selectedVehicleSort = sort;
  }

  onDealerLogoError(dealer: DealerCategory): void {
    dealer.logoFailed = true;
  }

  onVehicleImgError(v: GtaVehicle): void {
    v.imgFailed = true;
  }

  formatPrice(price: number): string {
    if (!price || price <= 0) {
      const lang = this.translationService.currentLanguage();
      if (lang === 'en') return 'Price not available';
      if (lang === 'pt') return 'Preço não disponível';
      return 'Precio no disponible';
    }
    const lang = this.translationService.currentLanguage();
    const locale = lang === 'en' ? 'en-US' : lang === 'pt' ? 'pt-BR' : 'es-ES';
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
    const lang = this.translationService.currentLang;
    const cacheKey = `${dealer.id}_${lang}`;
    if (this._cachedDealerDesc[cacheKey]) {
      return this._cachedDealerDesc[cacheKey];
    }
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
    let result = dealer.description;
    if (key) {
      const translated = this.translationService.t(key);
      if (translated && !translated.startsWith('transports.')) {
        result = translated;
      }
    }
    this._cachedDealerDesc[cacheKey] = result;
    return result;
  }

  isSpecialDivider(d: DealerCategory): boolean {
    const specials = this.visibleDealers.filter(x => (SPECIAL_DEALER_IDS as readonly string[]).includes(x.id));
    return specials.length > 0 && specials[0].id === d.id;
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

    this.vehiclesSub?.unsubscribe();
    this.vehiclesSub = this.vehicleService.getVehicles().subscribe({
      next: (vehicles) => {
        this.vehicleCache = {};
        for (const v of vehicles) {
          let d = v.dealership || 'superautos';
          if (d === 'especiales') d = 'pegasus';
          if (!this.vehicleCache[d]) {
            this.vehicleCache[d] = [];
          }
          this.vehicleCache[d].push(v);
        }
        this.dealerVehicles = this.vehicleCache[dealerId] || [];
        if (this.selectedVehicle) {
          const fresh = vehicles.find(v => v.id === this.selectedVehicle!.id);
          if (fresh) this.selectedVehicle = fresh;
        }
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
    this.heistsSub?.unsubscribe();
    this.heistsSub = this.missionService.getOnlineHeists().subscribe({
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
    const key = `${this.onlineHeists ? this.onlineHeists.length : 0}_${this.selectedHeistCategoryFilter}_${this.heistSearchQuery}`;
    if (this._cachedFOHKey !== key) {
      this._cachedFOHKey = key;
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
      this._cachedFOH = list;
    }
    return this._cachedFOH;
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

  // -------------------------------------------------------------
  // MISTERIOS Y LEYENDAS URBANAS (GTA ONLINE)
  // -------------------------------------------------------------
  loadOnlineMysteries(force = false, keepSelectedId?: string): void {
    if (this.onlineMysteries.length > 0 && !force) return;
    this.mysteriesLoading = true;
    this.mysteriesError = false;

    const mysteries$ = this.gameMode === 'story'
      ? this.missionService.getStoryMysteries()
      : this.missionService.getOnlineMysteries();

    this.mysteriesSub?.unsubscribe();
    this.mysteriesSub = mysteries$.subscribe({
      next: (mysteries) => {
        this.onlineMysteries = mysteries;
        if (keepSelectedId) {
          this.selectedMystery = mysteries.find(m => m.id === keepSelectedId) || null;
        }
        this.mysteriesLoading = false;
      },
      error: (err) => {
        console.error(`Error al cargar misterios (${this.gameMode}):`, err);
        this.mysteriesLoading = false;
        this.mysteriesError = true;
      }
    });
  }

  setMysteryCategoryFilter(cat: string): void {
    this.selectedMysteryCategoryFilter = cat;
  }

  get filteredOnlineMysteries(): GtaMystery[] {
    const key = `${this.onlineMysteries ? this.onlineMysteries.length : 0}_${this.selectedMysteryCategoryFilter}_${this.mysterySearchQuery}`;
    if (this._cachedFOMysKey !== key) {
      this._cachedFOMysKey = key;
      let list = this.onlineMysteries;
      const cat = this.selectedMysteryCategoryFilter.toLowerCase();
      if (cat !== 'all') {
        list = list.filter(m => m.category.toLowerCase() === cat);
      }
      const q = this.mysterySearchQuery.trim().toLowerCase();
      if (q) {
        list = list.filter(m =>
          m.title.toLowerCase().includes(q) ||
          (m.titleEn && m.titleEn.toLowerCase().includes(q)) ||
          m.location.toLowerCase().includes(q) ||
          m.zone.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q) ||
          m.lore.toLowerCase().includes(q)
        );
      }
      this._cachedFOMys = list;
    }
    return this._cachedFOMys;
  }

  getMysteryCategoryCount(cat: string): number {
    if (cat === 'all') return this.onlineMysteries.length;
    return this.onlineMysteries.filter(m => m.category.toLowerCase() === cat.toLowerCase()).length;
  }

  openMysteryDetail(mystery: GtaMystery): void {
    this.selectedMystery = mystery;
    this.drawerView = 'mystery-detail';
  }

  closeMysteryDetail(): void {
    this.selectedMystery = null;
    this.drawerView = 'tabs';
  }

  get previousMystery(): GtaMystery | null {
    if (!this.selectedMystery || this.onlineMysteries.length === 0) return null;
    const idx = this.onlineMysteries.findIndex(m => m.id === this.selectedMystery!.id);
    return idx > 0 ? this.onlineMysteries[idx - 1] : null;
  }

  get nextMystery(): GtaMystery | null {
    if (!this.selectedMystery || this.onlineMysteries.length === 0) return null;
    const idx = this.onlineMysteries.findIndex(m => m.id === this.selectedMystery!.id);
    return (idx >= 0 && idx < this.onlineMysteries.length - 1) ? this.onlineMysteries[idx + 1] : null;
  }

  selectPreviousMystery(): void {
    const prev = this.previousMystery;
    if (prev) this.selectedMystery = prev;
  }

  selectNextMystery(): void {
    const next = this.nextMystery;
    if (next) this.selectedMystery = next;
  }

  onLocateMystery(mystery: GtaMystery, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.locateOnMap.emit(mystery);
  }

  getMysteryImage(m: GtaMystery | null | undefined): string {
    if (!m || !m.thumbnail) return '';
    const src = m.thumbnail.trim();
    return src.startsWith('/') ? src : '/' + src;
  }

  getMysteryAccentColor(m: GtaMystery | null): string {
    if (!m) return '#a855f7';
    return m.badgeColor || '#a855f7';
  }

  // -------------------------------------------------------------
  // ARMAS (WEAPONS CATALOG)
  // -------------------------------------------------------------
  loadWeapons(force = false, keepSelectedId?: string): void {
    if (this.weapons.length > 0 && !force) return;
    this.weaponsLoading = true;
    this.weaponsError = false;

    this.weaponsSub?.unsubscribe();
    this.weaponsSub = this.weaponService.getWeapons(this.gameMode).subscribe({
      next: (weapons) => {
        this.weapons = weapons;
        if (keepSelectedId) {
          this.selectedWeapon = weapons.find(w => w.id === keepSelectedId) || null;
        }
        this.weaponsLoading = false;
      },
      error: (err) => {
        console.error(`Error al cargar arsenal de armas (${this.gameMode}):`, err);
        this.weaponsLoading = false;
        this.weaponsError = true;
      }
    });
  }

  setWeaponCategory(cat: string): void {
    this.selectedWeaponCategory = cat;
  }

  setWeaponSort(sort: 'none' | 'damage' | 'fireRate' | 'accuracy' | 'range' | 'price'): void {
    this.selectedWeaponSort = sort;
  }

  onWeaponImgError(w: GtaWeapon): void {
    w.imgFailed = true;
  }

  selectWeapon(weapon: GtaWeapon): void {
    this.openWeaponDetail(weapon);
  }

  openWeaponDetail(weapon: GtaWeapon): void {
    this.selectedWeapon = weapon;
    this.drawerView = 'weapon-detail';
  }

  closeWeaponDetail(): void {
    this.selectedWeapon = null;
    this.drawerView = 'tabs';
  }

  get filteredWeapons(): GtaWeapon[] {
    const key = `${this.weapons ? this.weapons.length : 0}_${this.selectedWeaponCategory}_${this.weaponSearchQuery}_${this.selectedWeaponSort}`;
    if (this._cachedFWKey !== key) {
      this._cachedFWKey = key;
      let list = this.weapons;
      const cat = this.selectedWeaponCategory.toLowerCase();
      if (cat !== 'all') {
        list = list.filter(w => (w.category || '').toLowerCase() === cat);
      }
      const q = this.weaponSearchQuery.trim().toLowerCase();
      if (q) {
        list = list.filter(w =>
          (w.name && w.name.toLowerCase().includes(q)) ||
          (w.nameEn && w.nameEn.toLowerCase().includes(q)) ||
          (w.manufacturer && w.manufacturer.toLowerCase().includes(q)) ||
          (w.realCounterpart && w.realCounterpart.toLowerCase().includes(q)) ||
          (w.categoryLabel && w.categoryLabel.toLowerCase().includes(q)) ||
          (w.description && w.description.toLowerCase().includes(q))
        );
      }
      if (this.selectedWeaponSort !== 'none') {
        const sortKey = this.selectedWeaponSort;
        list = [...list].sort((a, b) => {
          const statA = (a as any)[sortKey] ?? 0;
          const statB = (b as any)[sortKey] ?? 0;
          if (statB !== statA) {
            return statB - statA;
          }
          return (a.name || '').localeCompare(b.name || '');
        });
      }
      this._cachedFW = list;
    }
    return this._cachedFW;
  }

  get weaponCategoryList(): { id: string; name: string; count: number; icon: string }[] {
    const lang = this.translationService.currentLang;
    const key = `${this.weapons ? this.weapons.length : 0}_${lang}`;
    if (this._cachedWCLKey !== key) {
      this._cachedWCLKey = key;
      const counts: { [cat: string]: number } = {};
      for (const w of this.weapons) {
        const cat = w.category || 'other';
        counts[cat] = (counts[cat] || 0) + 1;
      }
      const categories: { id: string; nameKey: string; icon: string }[] = [
        { id: 'all', nameKey: 'transports.weapons.categories.all', icon: 'fa-layer-group' },
        { id: 'pistols', nameKey: 'transports.weapons.categories.pistols', icon: 'fa-gun' },
        { id: 'smgs', nameKey: 'transports.weapons.categories.smgs', icon: 'fa-shield-halved' },
        { id: 'rifles', nameKey: 'transports.weapons.categories.rifles', icon: 'fa-crosshairs' },
        { id: 'shotguns', nameKey: 'transports.weapons.categories.shotguns', icon: 'fa-fire' },
        { id: 'snipers', nameKey: 'transports.weapons.categories.snipers', icon: 'fa-bullseye' },
        { id: 'heavy', nameKey: 'transports.weapons.categories.heavy', icon: 'fa-bomb' },
        { id: 'melee', nameKey: 'transports.weapons.categories.melee', icon: 'fa-hand-back-fist' },
        { id: 'throwables', nameKey: 'transports.weapons.categories.throwables', icon: 'fa-burst' },
      ];
      this._cachedWCL = categories.map(c => ({
        id: c.id,
        name: this.translationService.t(c.nameKey) || c.id,
        count: c.id === 'all' ? this.weapons.length : (counts[c.id] || 0),
        icon: c.icon
      })).filter(c => c.id === 'all' || c.count > 0);
    }
    return this._cachedWCL;
  }

  getWeaponCategoryCount(cat: string): number {
    if (cat === 'all') return this.weapons.length;
    return this.weapons.filter(w => (w.category || '').toLowerCase() === cat.toLowerCase()).length;
  }

  get previousWeapon(): GtaWeapon | null {
    if (!this.selectedWeapon || this.filteredWeapons.length === 0) return null;
    const idx = this.filteredWeapons.findIndex(w => w.id === this.selectedWeapon!.id);
    return idx > 0 ? this.filteredWeapons[idx - 1] : null;
  }

  get nextWeapon(): GtaWeapon | null {
    if (!this.selectedWeapon || this.filteredWeapons.length === 0) return null;
    const idx = this.filteredWeapons.findIndex(w => w.id === this.selectedWeapon!.id);
    return (idx >= 0 && idx < this.filteredWeapons.length - 1) ? this.filteredWeapons[idx + 1] : null;
  }

  selectPreviousWeapon(): void {
    const prev = this.previousWeapon;
    if (prev) this.selectedWeapon = prev;
  }

  selectNextWeapon(): void {
    const next = this.nextWeapon;
    if (next) this.selectedWeapon = next;
  }

  getWeaponAccentColor(w: GtaWeapon | null): string {
    if (!w) return '#ffb833';
    return w.badgeColor || '#ffb833';
  }

  getWeaponIcon(w: GtaWeapon | null): string {
    if (!w) return 'fa-gun';
    return w.icon || 'fa-gun';
  }

  ngOnDestroy(): void {
    this.vehiclesSub?.unsubscribe();
    this.missionsSub?.unsubscribe();
    this.strangersSub?.unsubscribe();
    this.heistsSub?.unsubscribe();
    this.mysteriesSub?.unsubscribe();
    this.weaponsSub?.unsubscribe();
  }
}

