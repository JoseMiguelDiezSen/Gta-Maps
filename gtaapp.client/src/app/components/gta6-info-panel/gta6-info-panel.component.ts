import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { TranslationService } from '../../i18n';
import { Gta6DealerCategory, Gta6Vehicle } from '../../models/gta6/vehicle';
import { Gta6Mission, Gta6Heist } from '../../models/gta6/mission';
import { Gta6Mystery } from '../../models/gta6/mystery';
import { Gta6Weapon } from '../../models/gta6/weapon';
import {
  GTA6_DEALERS_EN,
  GTA6_DEALERS_ES,
  GTA6_VEHICLES_BY_DEALER,
  GTA6_STORY_MISSIONS_EN,
  GTA6_STORY_MISSIONS_ES,
  GTA6_HEISTS_EN,
  GTA6_HEISTS_ES,
  GTA6_MYSTERIES_EN,
  GTA6_MYSTERIES_ES,
  GTA6_WEAPONS_EN,
  GTA6_WEAPONS_ES
} from './gta6.config';

@Component({
  selector: 'app-gta6-info-panel',
  templateUrl: './gta6-info-panel.component.html',
  styleUrls: [
    '../info-panel/info-panel.layout.css',
    '../info-panel/info-panel.vehiculos.css',
    '../info-panel/info-panel.misiones.css',
    '../info-panel/info-panel.golpes.css',
    '../info-panel/info-panel.misterios.css',
    './gta6-info-panel.component.css'
  ],
  standalone: false
})
export class Gta6InfoPanelComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() gameMode: 'story' | 'online' = 'online';
  @Output() closeDrawer = new EventEmitter<void>();

  drawerView: string = 'tabs';
  activeDrawerTab = 'vehiculos';

  activeDealerId: string | null = null;
  activeDealerName: string = '';

  selectedVehicle: Gta6Vehicle | null = null;
  selectedVehicleClass: string = 'all';
  selectedVehicleSort: string = 'none';
  dealerVehicleSearchQuery: string = '';

  selectedMission: Gta6Mission | null = null;
  selectedMissionChar: string = 'all';
  missionSearchQuery = '';

  selectedHeist: Gta6Heist | null = null;
  heistSearchQuery = '';

  selectedMystery: Gta6Mystery | null = null;
  selectedMysteryCat: string = 'all';
  mysterySearchQuery = '';

  selectedWeapon: Gta6Weapon | null = null;
  selectedWeaponCat: string = 'all';
  weaponSearchQuery = '';

  constructor(public translationService: TranslationService) {}

  get isEs(): boolean {
    return (this.translationService.currentLang || 'es') === 'es';
  }

  get dealers(): Gta6DealerCategory[] {
    return this.isEs ? GTA6_DEALERS_ES : GTA6_DEALERS_EN;
  }

  get storyMissions(): Gta6Mission[] {
    return this.isEs ? GTA6_STORY_MISSIONS_ES : GTA6_STORY_MISSIONS_EN;
  }

  get heists(): Gta6Heist[] {
    return this.isEs ? GTA6_HEISTS_ES : GTA6_HEISTS_EN;
  }

  get mysteries(): Gta6Mystery[] {
    return this.isEs ? GTA6_MYSTERIES_ES : GTA6_MYSTERIES_EN;
  }

  get weapons(): Gta6Weapon[] {
    return this.isEs ? GTA6_WEAPONS_ES : GTA6_WEAPONS_EN;
  }

  get dealerVehicles(): Gta6Vehicle[] {
    if (!this.activeDealerId) return [];
    return GTA6_VEHICLES_BY_DEALER[this.activeDealerId] || [];
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['gameMode']) {
      this.drawerView = 'tabs';
      this.selectedVehicle = null;
      this.selectedMission = null;
      this.selectedHeist = null;
      this.selectedMystery = null;
      this.selectedWeapon = null;
    }
  }

  get drawerTabs(): { id: string; label: string; icon: string }[] {
    return [
      { id: 'vehiculos', label: this.translationService.t('transports.tabs.vehicles') || 'Vehículos', icon: 'fa-car-side' },
      { id: 'armas', label: this.translationService.t('transports.tabs.armas') || 'Armas', icon: 'fa-gun' },
      { id: 'misiones', label: this.translationService.t('transports.tabs.missions') || 'Misiones', icon: 'fa-bullseye' },
      { id: 'golpes', label: this.translationService.t('transports.tabs.golpes') || 'Golpes', icon: 'fa-sack-dollar' },
      { id: 'misterios', label: this.translationService.t('transports.tabs.misterios') || 'Misterios', icon: 'fa-user-secret' }
    ];
  }

  setDrawerTab(tabId: string): void {
    this.activeDrawerTab = tabId;
    this.drawerView = 'tabs';
    this.selectedVehicle = null;
    this.selectedMission = null;
    this.selectedHeist = null;
    this.selectedMystery = null;
    this.selectedWeapon = null;
  }

  openDealerGrid(dealerId: string, dealerName: string): void {
    this.activeDealerId = dealerId;
    this.activeDealerName = dealerName;
    this.selectedVehicle = null;
    this.selectedVehicleClass = 'all';
    this.selectedVehicleSort = 'none';
    this.dealerVehicleSearchQuery = '';
    this.drawerView = 'dealer-grid';
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

  get dealerCategories(): { id: string; name: string; count: number }[] {
    const vehicles = this.dealerVehicles;
    const counts: Record<string, number> = {};
    for (const v of vehicles) {
      const cls = v.class || 'Otros';
      counts[cls] = (counts[cls] || 0) + 1;
    }
    const list = Object.entries(counts).map(([name, count]) => ({ id: name, name, count }));
    list.sort((a, b) => a.name.localeCompare(b.name));
    return [{ id: 'all', name: this.translationService.t('common.all') || 'Todos', count: vehicles.length }, ...list];
  }

  get filteredDealerVehicles(): Gta6Vehicle[] {
    let list = [...this.dealerVehicles];
    if (this.selectedVehicleClass !== 'all') {
      list = list.filter(v => v.class === this.selectedVehicleClass);
    }
    const q = this.dealerVehicleSearchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(v =>
        (v.name && v.name.toLowerCase().includes(q)) ||
        (v.manufacturer && v.manufacturer.toLowerCase().includes(q)) ||
        (v.class && v.class.toLowerCase().includes(q))
      );
    }
    if (this.selectedVehicleSort === 'speed') {
      list.sort((a, b) => (b.topSpeedMph || b.speed || 0) - (a.topSpeedMph || a.speed || 0));
    } else if (this.selectedVehicleSort === 'acceleration') {
      list.sort((a, b) => (b.acceleration || 0) - (a.acceleration || 0));
    } else if (this.selectedVehicleSort === 'braking') {
      list.sort((a, b) => (b.braking || 0) - (a.braking || 0));
    } else if (this.selectedVehicleSort === 'handling') {
      list.sort((a, b) => (b.handling || 0) - (a.handling || 0));
    }
    return list;
  }

  setVehicleCategory(cat: string): void {
    this.selectedVehicleClass = cat;
  }

  setVehicleSort(sort: string): void {
    this.selectedVehicleSort = sort;
  }

  selectVehicle(v: Gta6Vehicle): void {
    this.selectedVehicle = v;
    this.drawerView = 'vehicle-detail';
  }

  getVehicleIcon(v: Gta6Vehicle): string {
    const cat = (v.category || '').toLowerCase();
    if (cat.includes('plane') || cat.includes('avion')) return 'fa-plane';
    if (cat.includes('heli')) return 'fa-helicopter';
    if (cat.includes('boat') || cat.includes('barco') || cat.includes('marine')) return 'fa-ship';
    if (cat.includes('bike') || cat.includes('moto')) return 'fa-motorcycle';
    return 'fa-car-side';
  }

  onVehicleImgError(v: Gta6Vehicle): void {
    v.imgFailed = true;
  }

  formatPrice(price?: number): string {
    if (!price && price !== 0) return '$0';
    return '$' + price.toLocaleString();
  }

  // Misiones
  get missionCharacters(): string[] {
    const chars = new Set<string>();
    for (const m of this.storyMissions) {
      if (m.protagonist) chars.add(m.protagonist);
    }
    return ['all', ...Array.from(chars)];
  }

  get filteredStoryMissions(): Gta6Mission[] {
    let list = [...this.storyMissions];
    if (this.selectedMissionChar !== 'all') {
      list = list.filter(m => m.protagonist === this.selectedMissionChar);
    }
    const q = this.missionSearchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(m =>
        (m.title && m.title.toLowerCase().includes(q)) ||
        (m.description && m.description.toLowerCase().includes(q)) ||
        (m.protagonist && m.protagonist.toLowerCase().includes(q))
      );
    }
    return list;
  }

  setMissionChar(c: string): void {
    this.selectedMissionChar = c;
  }

  selectMission(m: Gta6Mission): void {
    this.selectedMission = m;
    this.drawerView = 'mission-detail';
  }

  closeMissionDetail(): void {
    this.drawerView = 'tabs';
    this.selectedMission = null;
  }

  // Golpes
  get filteredHeists(): Gta6Heist[] {
    const q = this.heistSearchQuery.trim().toLowerCase();
    if (!q) return this.heists;
    return this.heists.filter(h =>
      (h.title && h.title.toLowerCase().includes(q)) ||
      (h.description && h.description.toLowerCase().includes(q))
    );
  }

  selectHeist(h: Gta6Heist): void {
    this.selectedHeist = h;
    this.drawerView = 'heist-detail';
  }

  closeHeistDetail(): void {
    this.drawerView = 'tabs';
    this.selectedHeist = null;
  }

  // Armas
  get weaponCategories(): string[] {
    const cats = new Set<string>();
    for (const w of this.weapons) {
      if (w.category) cats.add(w.category);
    }
    return ['all', ...Array.from(cats)];
  }

  get filteredWeapons(): Gta6Weapon[] {
    let list = [...this.weapons];
    if (this.selectedWeaponCat !== 'all') {
      list = list.filter(w => w.category === this.selectedWeaponCat);
    }
    const q = this.weaponSearchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(w =>
        (w.name && w.name.toLowerCase().includes(q)) ||
        (w.description && w.description.toLowerCase().includes(q)) ||
        (w.category && w.category.toLowerCase().includes(q))
      );
    }
    return list;
  }

  setWeaponCat(cat: string): void {
    this.selectedWeaponCat = cat;
  }

  selectWeapon(w: Gta6Weapon): void {
    this.selectedWeapon = w;
    this.drawerView = 'weapon-detail';
  }

  closeWeaponDetail(): void {
    this.drawerView = 'tabs';
    this.selectedWeapon = null;
  }

  // Misterios
  get mysteryCategories(): string[] {
    const cats = new Set<string>();
    for (const mys of this.mysteries) {
      if (mys.category) cats.add(mys.category);
    }
    return ['all', ...Array.from(cats)];
  }

  get filteredMysteries(): Gta6Mystery[] {
    let list = [...this.mysteries];
    if (this.selectedMysteryCat !== 'all') {
      list = list.filter(m => m.category === this.selectedMysteryCat);
    }
    const q = this.mysterySearchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(m =>
        (m.title && m.title.toLowerCase().includes(q)) ||
        (m.descriptionSnippet && m.descriptionSnippet.toLowerCase().includes(q)) ||
        (m.locationName && m.locationName.toLowerCase().includes(q))
      );
    }
    return list;
  }

  setMysteryCat(cat: string): void {
    this.selectedMysteryCat = cat;
  }

  selectMystery(mys: Gta6Mystery): void {
    this.selectedMystery = mys;
    this.drawerView = 'mystery-detail';
  }

  closeMysteryDetail(): void {
    this.drawerView = 'tabs';
    this.selectedMystery = null;
  }

  onBreadcrumbBack(): void {
    if (this.drawerView === 'vehicle-detail') {
      this.backToDealerGrid();
    } else if (this.drawerView === 'dealer-grid') {
      this.closeDealerGrid();
    } else if (this.drawerView === 'mission-detail') {
      this.closeMissionDetail();
    } else if (this.drawerView === 'heist-detail') {
      this.closeHeistDetail();
    } else if (this.drawerView === 'weapon-detail') {
      this.closeWeaponDetail();
    } else if (this.drawerView === 'mystery-detail') {
      this.closeMysteryDetail();
    } else {
      this.drawerView = 'tabs';
    }
  }

  onClose(): void {
    this.closeDrawer.emit();
  }
}
