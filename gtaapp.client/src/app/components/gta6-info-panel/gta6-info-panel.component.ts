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
  styleUrls: ['./gta6-info-panel.component.css'],
  standalone: false
})
export class Gta6InfoPanelComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() gameMode: 'story' | 'online' = 'online';
  @Output() closeDrawer = new EventEmitter<void>();
  @Output() locateOnMap = new EventEmitter<any>();

  drawerView: string = 'tabs';
  activeDrawerTab = 'vehiculos';

  // Concesionarios y Vehículos
  activeDealerId: string | null = null;
  activeDealerName: string = '';
  selectedVehicle: Gta6Vehicle | null = null;
  selectedVehicleClass: string = 'all';
  selectedVehicleSort: string = 'none';
  dealerVehicleSearchQuery: string = '';

  // Misiones
  selectedMission: Gta6Mission | null = null;
  selectedMissionChar: string = 'all';
  missionSearchQuery = '';

  // Golpes
  selectedHeist: Gta6Heist | null = null;
  heistSearchQuery = '';

  // Armas
  selectedWeapon: Gta6Weapon | null = null;
  selectedWeaponCategory: string = 'all';
  selectedWeaponSort: string = 'none';
  weaponSearchQuery = '';

  // Misterios
  selectedMystery: Gta6Mystery | null = null;
  selectedMysteryCategoryFilter: string = 'all';
  mysterySearchQuery = '';

  // Caches internos para evitar ciclos de detección de cambios (NG0103)
  private _cachedTabsKey = '';
  private _cachedDrawerTabs: { id: string; label: string; icon: string }[] = [];
  private _cachedDealCatKey = '';
  private _cachedDealCat: { id: string; name: string; count: number }[] = [];
  private _cachedFDVKey = '';
  private _cachedFDV: Gta6Vehicle[] = [];
  private _cachedFSMKey = '';
  private _cachedFSM: Gta6Mission[] = [];
  private _cachedFHKey = '';
  private _cachedFH: Gta6Heist[] = [];
  private _cachedWCatKey = '';
  private _cachedWCat: { id: string; name: string; count: number; icon: string }[] = [];
  private _cachedFWKey = '';
  private _cachedFW: Gta6Weapon[] = [];
  private _cachedFMysKey = '';
  private _cachedFMys: Gta6Mystery[] = [];

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
      this._cachedTabsKey = '';
    }
  }

  get drawerTabs(): { id: string; label: string; icon: string }[] {
    const key = `${this.gameMode}_${this.translationService.currentLang}`;
    if (this._cachedTabsKey !== key) {
      this._cachedTabsKey = key;
      this._cachedDrawerTabs = [
        { id: 'vehiculos', label: this.translationService.t('transports.tabs.vehicles') || 'Vehículos', icon: 'fa-car-side' },
        { id: 'armas', label: this.translationService.t('transports.tabs.armas') || 'Armas', icon: 'fa-gun' },
        { id: 'misiones', label: this.translationService.t('transports.tabs.missions') || 'Misiones', icon: 'fa-bullseye' },
        { id: 'golpes', label: this.translationService.t('transports.tabs.golpes') || 'Golpes', icon: 'fa-sack-dollar' },
        { id: 'misterios', label: this.translationService.t('transports.tabs.misterios') || 'Misterios', icon: 'fa-user-secret' }
      ];
    }
    return this._cachedDrawerTabs;
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

  // -------------------------------------------------------------
  // CONCESIONARIOS Y VEHÍCULOS
  // -------------------------------------------------------------
  openDealerGrid(dealerId: string, dealerName: string): void {
    this.activeDealerId = dealerId;
    this.activeDealerName = dealerName;
    this.selectedVehicle = null;
    this.selectedVehicleClass = 'all';
    this.selectedVehicleSort = 'none';
    this.dealerVehicleSearchQuery = '';
    this._cachedDealCatKey = '';
    this._cachedFDVKey = '';
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
    const key = `${this.activeDealerId}_${this.translationService.currentLang}`;
    if (this._cachedDealCatKey !== key) {
      this._cachedDealCatKey = key;
      const vehicles = this.dealerVehicles;
      const counts: Record<string, number> = {};
      for (const v of vehicles) {
        const cls = v.class || 'Otros';
        counts[cls] = (counts[cls] || 0) + 1;
      }
      const list = Object.entries(counts).map(([name, count]) => ({ id: name, name, count }));
      list.sort((a, b) => a.name.localeCompare(b.name));
      this._cachedDealCat = [{ id: 'all', name: this.translationService.t('common.all') || 'Todos', count: vehicles.length }, ...list];
    }
    return this._cachedDealCat;
  }

  get filteredDealerVehicles(): Gta6Vehicle[] {
    const key = `${this.activeDealerId}_${this.selectedVehicleClass}_${this.selectedVehicleSort}_${this.dealerVehicleSearchQuery}`;
    if (this._cachedFDVKey !== key) {
      this._cachedFDVKey = key;
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
      this._cachedFDV = list;
    }
    return this._cachedFDV;
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

  getVehicleIcon(v: Gta6Vehicle | null): string {
    if (!v) return 'fa-car-side';
    const cat = (v.category || v.class || '').toLowerCase();
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

  // -------------------------------------------------------------
  // MISIONES
  // -------------------------------------------------------------
  get filteredStoryMissions(): Gta6Mission[] {
    const key = `${this.translationService.currentLang}_${this.selectedMissionChar}_${this.missionSearchQuery}`;
    if (this._cachedFSMKey !== key) {
      this._cachedFSMKey = key;
      let list = [...this.storyMissions];
      if (this.selectedMissionChar !== 'all') {
        list = list.filter(m => (m.protagonist || '').toLowerCase().includes(this.selectedMissionChar.toLowerCase()));
      }
      const q = this.missionSearchQuery.trim().toLowerCase();
      if (q) {
        list = list.filter(m =>
          (m.title && m.title.toLowerCase().includes(q)) ||
          (m.description && m.description.toLowerCase().includes(q)) ||
          (m.protagonist && m.protagonist.toLowerCase().includes(q)) ||
          (m.giver && m.giver.toLowerCase().includes(q))
        );
      }
      this._cachedFSM = list;
    }
    return this._cachedFSM;
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

  get previousMission(): Gta6Mission | null {
    if (!this.selectedMission || this.storyMissions.length === 0) return null;
    const idx = this.storyMissions.findIndex(m => m.id === this.selectedMission!.id);
    return idx > 0 ? this.storyMissions[idx - 1] : null;
  }

  get nextMission(): Gta6Mission | null {
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

  getMissionAccentColor(m: Gta6Mission | null): string {
    if (!m) return '#ff4fe0';
    const p = (m.protagonist || '').toLowerCase();
    if (p.includes('lucia') && p.includes('jason')) return '#ff4fe0';
    if (p.includes('lucia')) return '#ff4fe0';
    if (p.includes('jason')) return '#00cec9';
    return '#ff4fe0';
  }

  getMissionIcon(m: Gta6Mission | null): string {
    if (!m) return 'fa-bullseye';
    const p = (m.protagonist || '').toLowerCase();
    if (p.includes('lucia')) return 'fa-gem';
    if (p.includes('jason')) return 'fa-shield-halved';
    return 'fa-crosshairs';
  }

  // -------------------------------------------------------------
  // GOLPES
  // -------------------------------------------------------------
  get filteredHeists(): Gta6Heist[] {
    const key = `${this.translationService.currentLang}_${this.heistSearchQuery}`;
    if (this._cachedFHKey !== key) {
      this._cachedFHKey = key;
      const q = this.heistSearchQuery.trim().toLowerCase();
      if (!q) {
        this._cachedFH = this.heists;
      } else {
        this._cachedFH = this.heists.filter(h =>
          (h.title && h.title.toLowerCase().includes(q)) ||
          (h.description && h.description.toLowerCase().includes(q)) ||
          (h.giver && h.giver.toLowerCase().includes(q)) ||
          (h.location && h.location.toLowerCase().includes(q))
        );
      }
    }
    return this._cachedFH;
  }

  selectHeist(h: Gta6Heist): void {
    this.selectedHeist = h;
    this.drawerView = 'heist-detail';
  }

  closeHeistDetail(): void {
    this.drawerView = 'tabs';
    this.selectedHeist = null;
  }

  get previousHeist(): Gta6Heist | null {
    if (!this.selectedHeist || this.heists.length === 0) return null;
    const idx = this.heists.findIndex(h => h.id === this.selectedHeist!.id);
    return idx > 0 ? this.heists[idx - 1] : null;
  }

  get nextHeist(): Gta6Heist | null {
    if (!this.selectedHeist || this.heists.length === 0) return null;
    const idx = this.heists.findIndex(h => h.id === this.selectedHeist!.id);
    return (idx >= 0 && idx < this.heists.length - 1) ? this.heists[idx + 1] : null;
  }

  selectPreviousHeist(): void {
    const prev = this.previousHeist;
    if (prev) this.selectedHeist = prev;
  }

  selectNextHeist(): void {
    const next = this.nextHeist;
    if (next) this.selectedHeist = next;
  }

  getHeistAccentColor(h: Gta6Heist | null): string {
    if (!h) return '#ff4fe0';
    return h.badgeColor || '#ff4fe0';
  }

  // -------------------------------------------------------------
  // ARMAS
  // -------------------------------------------------------------
  get weaponCategoryList(): { id: string; name: string; count: number; icon: string }[] {
    const lang = this.translationService.currentLang;
    const key = `${this.weapons.length}_${lang}`;
    if (this._cachedWCatKey !== key) {
      this._cachedWCatKey = key;
      const counts: Record<string, number> = {};
      for (const w of this.weapons) {
        const cat = w.category || 'other';
        counts[cat] = (counts[cat] || 0) + 1;
      }
      const categories = [
        { id: 'all', name: this.translationService.t('common.all') || 'Todas las Categorías', icon: 'fa-layer-group' },
        { id: 'pistols', name: this.translationService.t('transports.weapons.categories.pistols') || 'Pistolas', icon: 'fa-gun' },
        { id: 'smgs', name: this.translationService.t('transports.weapons.categories.smgs') || 'Subfusiles', icon: 'fa-shield-halved' },
        { id: 'rifles', name: this.translationService.t('transports.weapons.categories.rifles') || 'Fusiles de Asalto', icon: 'fa-crosshairs' },
        { id: 'shotguns', name: this.translationService.t('transports.weapons.categories.shotguns') || 'Escopetas', icon: 'fa-fire' },
        { id: 'snipers', name: this.translationService.t('transports.weapons.categories.snipers') || 'Francotiradores', icon: 'fa-bullseye' },
      ];
      this._cachedWCat = categories.map(c => ({
        id: c.id,
        name: c.name,
        count: c.id === 'all' ? this.weapons.length : (counts[c.id] || 0),
        icon: c.icon
      })).filter(c => c.id === 'all' || c.count > 0);
    }
    return this._cachedWCat;
  }

  get filteredWeapons(): Gta6Weapon[] {
    const key = `${this.translationService.currentLang}_${this.selectedWeaponCategory}_${this.selectedWeaponSort}_${this.weaponSearchQuery}`;
    if (this._cachedFWKey !== key) {
      this._cachedFWKey = key;
      let list = [...this.weapons];
      const cat = this.selectedWeaponCategory.toLowerCase();
      if (cat !== 'all') {
        list = list.filter(w => (w.category || '').toLowerCase() === cat);
      }
      const q = this.weaponSearchQuery.trim().toLowerCase();
      if (q) {
        list = list.filter(w =>
          (w.name && w.name.toLowerCase().includes(q)) ||
          (w.description && w.description.toLowerCase().includes(q)) ||
          (w.category && w.category.toLowerCase().includes(q)) ||
          (w.manufacturer && w.manufacturer.toLowerCase().includes(q))
        );
      }
      if (this.selectedWeaponSort === 'damage') {
        list.sort((a, b) => (b.damage || 0) - (a.damage || 0));
      } else if (this.selectedWeaponSort === 'fireRate') {
        list.sort((a, b) => (b.fireRate || 0) - (a.fireRate || 0));
      } else if (this.selectedWeaponSort === 'accuracy') {
        list.sort((a, b) => (b.accuracy || 0) - (a.accuracy || 0));
      } else if (this.selectedWeaponSort === 'range') {
        list.sort((a, b) => (b.range || 0) - (a.range || 0));
      } else if (this.selectedWeaponSort === 'price') {
        list.sort((a, b) => (b.price || 0) - (a.price || 0));
      }
      this._cachedFW = list;
    }
    return this._cachedFW;
  }

  setWeaponCategory(cat: string): void {
    this.selectedWeaponCategory = cat;
  }

  setWeaponSort(sort: string): void {
    this.selectedWeaponSort = sort;
  }

  selectWeapon(w: Gta6Weapon): void {
    this.selectedWeapon = w;
    this.drawerView = 'weapon-detail';
  }

  closeWeaponDetail(): void {
    this.drawerView = 'tabs';
    this.selectedWeapon = null;
  }

  onWeaponImgError(w: Gta6Weapon): void {
    w.imgFailed = true;
  }

  getWeaponAccentColor(w: Gta6Weapon | null): string {
    if (!w) return '#ff4fe0';
    const c = (w.category || '').toLowerCase();
    if (c.includes('pistol')) return '#ff4fe0';
    if (c.includes('rifle') || c.includes('fusil')) return '#00cec9';
    if (c.includes('shotgun') || c.includes('escopeta')) return '#e84393';
    if (c.includes('smg') || c.includes('subfusil')) return '#f1c40f';
    if (c.includes('sniper') || c.includes('franco')) return '#ff7675';
    return '#ff4fe0';
  }

  getWeaponIcon(w: Gta6Weapon | null): string {
    if (!w) return 'fa-gun';
    const c = (w.category || '').toLowerCase();
    if (c.includes('pistol')) return 'fa-gun';
    if (c.includes('rifle') || c.includes('fusil')) return 'fa-crosshairs';
    if (c.includes('shotgun') || c.includes('escopeta')) return 'fa-fire';
    if (c.includes('smg') || c.includes('subfusil')) return 'fa-shield-halved';
    if (c.includes('sniper')) return 'fa-bullseye';
    return 'fa-gun';
  }

  get previousWeapon(): Gta6Weapon | null {
    if (!this.selectedWeapon || this.weapons.length === 0) return null;
    const idx = this.weapons.findIndex(w => w.id === this.selectedWeapon!.id);
    return idx > 0 ? this.weapons[idx - 1] : null;
  }

  get nextWeapon(): Gta6Weapon | null {
    if (!this.selectedWeapon || this.weapons.length === 0) return null;
    const idx = this.weapons.findIndex(w => w.id === this.selectedWeapon!.id);
    return (idx >= 0 && idx < this.weapons.length - 1) ? this.weapons[idx + 1] : null;
  }

  selectPreviousWeapon(): void {
    const prev = this.previousWeapon;
    if (prev) this.selectedWeapon = prev;
  }

  selectNextWeapon(): void {
    const next = this.nextWeapon;
    if (next) this.selectedWeapon = next;
  }

  // -------------------------------------------------------------
  // MISTERIOS
  // -------------------------------------------------------------
  get filteredMysteries(): Gta6Mystery[] {
    const key = `${this.translationService.currentLang}_${this.selectedMysteryCategoryFilter}_${this.mysterySearchQuery}`;
    if (this._cachedFMysKey !== key) {
      this._cachedFMysKey = key;
      let list = [...this.mysteries];
      const cat = this.selectedMysteryCategoryFilter.toLowerCase();
      if (cat !== 'all') {
        list = list.filter(m => (m.category || '').toLowerCase() === cat);
      }
      const q = this.mysterySearchQuery.trim().toLowerCase();
      if (q) {
        list = list.filter(m =>
          (m.title && m.title.toLowerCase().includes(q)) ||
          (m.description && m.description.toLowerCase().includes(q)) ||
          (m.locationName && m.locationName.toLowerCase().includes(q)) ||
          (m.zone && m.zone.toLowerCase().includes(q)) ||
          (m.lore && m.lore.toLowerCase().includes(q))
        );
      }
      this._cachedFMys = list;
    }
    return this._cachedFMys;
  }

  setMysteryCategoryFilter(cat: string): void {
    this.selectedMysteryCategoryFilter = cat;
  }

  getMysteryCategoryCount(cat: string): number {
    if (cat === 'all') return this.mysteries.length;
    return this.mysteries.filter(m => (m.category || '').toLowerCase() === cat.toLowerCase()).length;
  }

  selectMystery(mys: Gta6Mystery): void {
    this.selectedMystery = mys;
    this.drawerView = 'mystery-detail';
  }

  closeMysteryDetail(): void {
    this.drawerView = 'tabs';
    this.selectedMystery = null;
  }

  get previousMystery(): Gta6Mystery | null {
    if (!this.selectedMystery || this.mysteries.length === 0) return null;
    const idx = this.mysteries.findIndex(m => m.id === this.selectedMystery!.id);
    return idx > 0 ? this.mysteries[idx - 1] : null;
  }

  get nextMystery(): Gta6Mystery | null {
    if (!this.selectedMystery || this.mysteries.length === 0) return null;
    const idx = this.mysteries.findIndex(m => m.id === this.selectedMystery!.id);
    return (idx >= 0 && idx < this.mysteries.length - 1) ? this.mysteries[idx + 1] : null;
  }

  selectPreviousMystery(): void {
    const prev = this.previousMystery;
    if (prev) this.selectedMystery = prev;
  }

  selectNextMystery(): void {
    const next = this.nextMystery;
    if (next) this.selectedMystery = next;
  }

  getMysteryImage(m: Gta6Mystery | null): string {
    if (!m) return '';
    return m.thumbnail || m.thumbnailUrl || '';
  }

  getMysteryAccentColor(m: Gta6Mystery | null): string {
    if (!m) return '#ff4fe0';
    return m.badgeColor || '#ff4fe0';
  }

  onLocateMystery(mys: Gta6Mystery, event?: Event): void {
    if (event) event.stopPropagation();
    this.locateOnMap.emit(mys);
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

  // TrackBy helpers
  trackByTabId(index: number, item: { id: string }): string {
    return item.id;
  }

  trackById(index: number, item: { id: string }): string {
    return item.id;
  }

  trackByIndex(index: number): number {
    return index;
  }
}
