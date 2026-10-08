import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslationService } from '../../i18n';

export interface Gta6InfoTab {
  id: string;
  labelEs: string;
  labelEn: string;
  icon: string;
  searchPlaceholderEs: string;
  searchPlaceholderEn: string;
  emptyTitleEs: string;
  emptyTitleEn: string;
  emptyDescEs: string;
  emptyDescEn: string;
}

@Component({
  selector: 'app-gta6-info-panel',
  templateUrl: './gta6-info-panel.component.html',
  styleUrls: ['./gta6-info-panel.component.css'],
  standalone: false
})
export class Gta6InfoPanelComponent {
  @Input() isOpen = false;
  @Input() gameMode: 'story' | 'online' = 'online';
  @Output() closeDrawer = new EventEmitter<void>();

  activeTab = 'vehiculos';
  searchQuery = '';

  readonly tabs: Gta6InfoTab[] = [
    {
      id: 'vehiculos',
      labelEs: 'Vehículos',
      labelEn: 'Vehicles',
      icon: 'fa-solid fa-car-side',
      searchPlaceholderEs: 'Buscar vehículos de Leonida...',
      searchPlaceholderEn: 'Search Leonida vehicles...',
      emptyTitleEs: 'Catálogo de Vehículos en Espera',
      emptyTitleEn: 'Vehicle Catalog Pending',
      emptyDescEs: 'La base de datos completa de concesionarios, deportivos y todoterrenos se desbloqueará con el lanzamiento de GTA VI.',
      emptyDescEn: 'The full dealership, sports and off-road vehicle database will be unlocked upon the official launch of GTA VI.'
    },
    {
      id: 'armas',
      labelEs: 'Armas',
      labelEn: 'Weapons',
      icon: 'fa-solid fa-gun',
      searchPlaceholderEs: 'Buscar armas y equipo táctico...',
      searchPlaceholderEn: 'Search weapons & tactical gear...',
      emptyTitleEs: 'Arsenal y Equipamiento Táctico',
      emptyTitleEn: 'Tactical Arsenal & Equipment',
      emptyDescEs: 'El armamento reglamentario, accesorios y equipo táctico de Vice City se registrarán aquí tras el lanzamiento.',
      emptyDescEn: 'Standard-issue weaponry, attachments and tactical gear in Vice City will be cataloged here post-launch.'
    },
    {
      id: 'misiones',
      labelEs: 'Misiones',
      labelEn: 'Missions',
      icon: 'fa-solid fa-bullseye',
      searchPlaceholderEs: 'Buscar misiones...',
      searchPlaceholderEn: 'Search missions...',
      emptyTitleEs: 'Registro de Misiones',
      emptyTitleEn: 'Mission Log',
      emptyDescEs: 'Las operaciones de historia de Jason y Lucia y las misiones cooperativas estarán disponibles aquí.',
      emptyDescEn: 'Jason & Lucia story operations and cooperative missions will be detailed here.'
    },
    {
      id: 'operaciones',
      labelEs: 'Operaciones',
      labelEn: 'Operations',
      icon: 'fa-solid fa-sack-dollar',
      searchPlaceholderEs: 'Buscar golpes y actividades...',
      searchPlaceholderEn: 'Search heists & activities...',
      emptyTitleEs: 'Golpes y Operaciones Especiales',
      emptyTitleEn: 'Heists & Special Operations',
      emptyDescEs: 'Planificación de atracos de alto riesgo y actividades de contrabando en el estado de Leonida.',
      emptyDescEn: 'High-stakes heist planning and contraband operations across the State of Leonida.'
    },
    {
      id: 'misterios',
      labelEs: 'Misterios',
      labelEn: 'Mysteries',
      icon: 'fa-solid fa-user-secret',
      searchPlaceholderEs: 'Buscar secretos y misterios...',
      searchPlaceholderEn: 'Search secrets & mysteries...',
      emptyTitleEs: 'Secretos de Vice City y Leonida',
      emptyTitleEn: 'Vice City & Leonida Secrets',
      emptyDescEs: 'Archivos clasificados sobre mitos, ovnis, pecios submarinos y leyendas urbanas de Leonida.',
      emptyDescEn: 'Classified archives detailing myths, UFOs, underwater shipwrecks and Leonida urban legends.'
    }
  ];

  constructor(public translationService: TranslationService) {}

  get currentLang(): string {
    return this.translationService.currentLang || 'es';
  }

  get currentTabInfo(): Gta6InfoTab {
    return this.tabs.find(t => t.id === this.activeTab) || this.tabs[0];
  }

  getTabLabel(tab: Gta6InfoTab): string {
    const tabKeyMap: Record<string, string> = {
      vehiculos: 'vehicles',
      armas: 'armas',
      misiones: 'missions',
      golpes: 'golpes',
      misterios: 'misterios'
    };
    const key = tabKeyMap[tab.id];
    if (key) {
      const translated = this.translationService.t('transports.tabs.' + key);
      if (translated && !translated.startsWith('transports.')) {
        return translated;
      }
    }
    return this.currentLang === 'es' ? tab.labelEs : tab.labelEn;
  }

  get currentSearchPlaceholder(): string {
    const tab = this.currentTabInfo;
    return this.currentLang === 'es' ? tab.searchPlaceholderEs : tab.searchPlaceholderEn;
  }

  get currentEmptyTitle(): string {
    const tab = this.currentTabInfo;
    return this.currentLang === 'es' ? tab.emptyTitleEs : tab.emptyTitleEn;
  }

  get currentEmptyDesc(): string {
    const tab = this.currentTabInfo;
    return this.currentLang === 'es' ? tab.emptyDescEs : tab.emptyDescEn;
  }

  selectTab(tabId: string): void {
    this.activeTab = tabId;
    this.searchQuery = '';
  }

  clearSearch(): void {
    this.searchQuery = '';
  }

  onClose(): void {
    this.closeDrawer.emit();
  }
}
