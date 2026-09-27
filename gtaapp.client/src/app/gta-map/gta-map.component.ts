import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import * as L from 'leaflet';
import { LocationService } from '../services/location.service';
import { PropertyLocation } from '../models/property';
import { CollectibleItem } from '../models/collectible';
import { UserProfileService } from '../services/user-profile.service';
import { UserProfile, SocialClubSyncPayload } from '../models/user-profile';
import { Subscription } from 'rxjs';

export interface GtaVehicle {
  id: string;           // nombre interno (clave del JSON)
  name: string;         // nombre para mostrar en español/inglés
  manufacturer: string;
  class: string;        // SUPER, SPORT, MUSCLE, etc.
  venue: string;        // legendarymotorsport, superautos, bennys, warstock, etc.
  priceFull: number;
  priceTrade: number;
  type: string;         // car, helicopter, plane, motorcycle...
  weaponized: boolean;
  imageUrl?: string;
  imgFailed?: boolean;
  // Stats estimados (0-10) - se rellenarán con datos de la API o estimados
  acceleration?: number;
  braking?: number;
  handling?: number;
  speed?: number;
}

@Component({
    selector: 'app-gta-map',
    templateUrl: './gta-map.component.html',
    styleUrls: ['./gta-map.component.css'],
    standalone: false
})
export class GtaMapComponent implements OnInit, AfterViewInit, OnDestroy {

    private map: L.Map | undefined;

    // Mapa base: imagen oficial de 8192x8192 px troceada en tiles de 256px.
    private readonly maxZoom = 7;
    private readonly imageSize = 8192;

    readonly allMapTypes = [
        { id: 'Satellite', label: 'Satélite' },
        { id: 'Roadmap', label: 'Carreteras' },
        { id: 'Atlas', label: 'Atlas' },
        { id: 'Juego', label: 'Juego' },
        { id: 'UV', label: 'Ultravioleta (UV)' },
        { id: 'UV2', label: 'Ultravioleta 2 (UV Invertido)' }
    ];

    /**
     * Mapas base disponibles según el modo de juego activo.
     * Los mapas UV y UV2 (Blueprint) solo están disponibles en Modo Historia.
     * El mapa Juego está disponible en ambos modos.
     */
    get mapTypes() {
        if (this.selectedGameMode === 'story') {
            return this.allMapTypes;
        }
        return this.allMapTypes.filter(m => ['Satellite', 'Roadmap', 'Atlas', 'Juego'].includes(m.id));
    }

    currentMapType = 'Satellite';

    // HUD: Conmutador de modo de juego (Bifurcación estricta Modo Historia vs GTA Online)
    selectedGameMode: 'story' | 'online' = 'online';
    chipOnline = true;
    chipOffline = false;

    // Estado del panel de capas y leyenda (minimizable)
    legendOpen = true;

    // Fecha de la última actualización del mapa (cámbiala aquí cuando actualices los datos)
    readonly ultimaActualizacion = 'XXXX';

    // Claves de Propiedades según el modo de juego
    readonly storyPropertyKeys = [
        'purchasable_business',
        'hangar'
    ];

    readonly onlinePropertyKeys = [
        'mansion',
        'hangar',
        'bunker',
        'facility',
        'arcade',
        'auto_shop',
        'agency',
        'salvage_yard',
        'arena_war',
        'ceo_office',
        'vehicle_warehouse'
    ];

    // Claves de los Negocios (sección propia del Panel de control)
    readonly businessKeys = [
        'coke_lockup',
        'weed_farm',
        'warehouse',
        'nightclub',
        'cash_factory',
        'meth_lab',
        'doc_forgery'
    ];

    // Claves de Lugares Extraños (sección propia del Panel de control)
    readonly strangeKeys = [
        'fake_ufo',
        'shipwreck',
        'cave'
    ];

    // Claves de Actividades y Deportes (sección propia del Panel de control)
    readonly activityKeys = [
        'activity'
    ];

    // Claves de Vehículos y Talleres según el modo de juego
    readonly storyVehicleKeys = [
        'ls_customs',
        'hao_garage'
    ];

    readonly onlineVehicleKeys = [
        'ls_customs',
        'bennys',
        'hao_garage',
        'ls_car_meet'
    ];

    // Claves de Coleccionables exclusivos de GTA Online
    readonly collectibleKeys = [
        'playing_card',
        'action_figure',
        'signal_jammer',
        'movie_prop',
        'radio_antenna'
    ];

    // Claves de Servicios (Comisarías, Hospitales, Bomberos, Armerías, Tiendas atracables, Autolavado y Strip Club)
    readonly serviceKeys = [
        'police_station',
        'hospital',
        'fire_station',
        'service',
        'convenience_store',
        'mask_shop',
        'car_wash',
        'strip_club'
    ];

    // Claves individuales de los 7 Trabajos Roleplay
    readonly roleplayKeys = [
        'job-pizza-delperro',
        'job-pizza-vinewood',
        'job-pizza-missionrow',
        'job-firefighter',
        'job-forklift',
        'job-paperboy',
        'job-taxi'
    ];

    // Claves individuales de Personajes y Contactos Emblemáticos
    readonly characterKeys = [
        'contact-simeon',
        'contact-lester-factory',
        'contact-lester-house',
        'contact-lamar',
        'contact-madrazo',
        'contact-gerald',
        'contact-trevor',
        'contact-ron',
        'contact-dax-freakshop',
        'contact-franklin-agency',
        'contact-michael-mansion',
        'contact-tony-prince',
        'contact-agatha-baker',
        'contact-agent-14'
    ];

    // Claves individuales de Fauna y Vida Salvaje (12 Hábitats de Fauna y Fotografía)
    readonly faunaKeys = [
        'animal-rabbit-hills',
        'animal-deer-chiliad',
        'animal-cougar-tongva',
        'animal-coyote-senora',
        'animal-boar-bolingbroke',
        'animal-hawk-vinewood',
        'animal-cormorant-zancudo',
        'animal-seagull-pier',
        'animal-shark-paleto',
        'animal-farm-grapeseed',
        'animal-dolphin-pacific',
        'animal-orca-ocean'
    ];

    get currentPropertyKeys(): string[] {
        return this.selectedGameMode === 'story' ? this.storyPropertyKeys : this.onlinePropertyKeys;
    }

    get currentVehicleKeys(): string[] {
        return this.selectedGameMode === 'story' ? this.storyVehicleKeys : this.onlineVehicleKeys;
    }

    get roleplayJobs(): PropertyLocation[] {
        return this.allProperties.filter(p =>
            p.category === 'roleplay_job' &&
            (p.gameMode === 'both' || p.gameMode === this.selectedGameMode)
        );
    }

    get contactCharacters(): PropertyLocation[] {
        return this.allProperties.filter(p =>
            p.category === 'character' &&
            (p.gameMode === 'both' || p.gameMode === this.selectedGameMode)
        );
    }

    get faunaAnimals(): PropertyLocation[] {
        return this.allProperties.filter(p =>
            p.category === 'animal' &&
            (p.gameMode === 'both' || p.gameMode === this.selectedGameMode)
        );
    }

    /**
     * Determina si un elemento del mapa es un inmueble o negocio realmente comprable por el jugador.
     * Excluye servicios públicos (comisarías, hospitales, bomberos, autolavados, tiendas),
     * talleres de uso libre y actividades / misiones de roleplay.
     */
    isPurchasable(p: PropertyLocation | undefined): boolean {
        if (!p) return false;
        if (p.category === 'roleplay_job' || p.category === 'character' || p.category === 'animal') return false;

        const nonPurchasableCategories = [
            'police_station',
            'hospital',
            'fire_station',
            'car_wash',
            'convenience_store',
            'service',
            'strip_club',
            'ls_customs',
            'bennys',
            'hao_garage',
            'ls_car_meet',
            'character',
            'animal'
        ];

        if (nonPurchasableCategories.includes(p.category)) return false;
        return (p.price || 0) > 0;
    }

    get purchasablePropertiesCount(): number {
        return this.allProperties.filter(p =>
            this.isPurchasable(p) &&
            (p.gameMode === 'both' || p.gameMode === this.selectedGameMode)
        ).length;
    }

    // Estado de filtros de categorías (Leyenda interactiva)
    layerFilters: { [key: string]: boolean } = {
        mansion: true,
        purchasable_business: true,
        hangar: true,
        coke_lockup: true,
        weed_farm: true,
        meth_lab: true,
        cash_factory: true,
        doc_forgery: true,
        bunker: true,
        facility: true,
        auto_shop: true,
        agency: true,
        salvage_yard: true,
        arena_war: true,
        vehicle_warehouse: true,
        warehouse: true,
        nightclub: true,
        arcade: true,
        ceo_office: true,
        mc_business: true,
        // Talleres y Vehículos
        ls_customs: true,
        bennys: true,
        hao_garage: true,
        ls_car_meet: true,
        // Servicios
        police_station: true,
        hospital: true,
        fire_station: true,
        service: true,
        convenience_store: true,
        mask_shop: true,
        car_wash: true,
        strip_club: true,
        // Trabajos Roleplay (7 independientes)
        'job-pizza-delperro': true,
        'job-pizza-vinewood': true,
        'job-pizza-missionrow': true,
        'job-firefighter': true,
        'job-forklift': true,
        'job-paperboy': true,
        'job-taxi': true,
        // Personajes y Contactos Emblemáticos
        'contact-simeon': true,
        'contact-lester-factory': true,
        'contact-lester-house': true,
        'contact-lamar': true,
        'contact-madrazo': true,
        'contact-gerald': true,
        'contact-trevor': true,
        'contact-ron': true,
        'contact-dax-freakshop': true,
        'contact-franklin-agency': true,
        'contact-michael-mansion': true,
        'contact-tony-prince': true,
        'contact-agatha-baker': true,
        'contact-agent-14': true,
        // Fauna y Vida Salvaje (12 Hábitats de Fauna y Fotografía)
        animal: true,
        'animal-rabbit-hills': true,
        'animal-deer-chiliad': true,
        'animal-cougar-tongva': true,
        'animal-coyote-senora': true,
        'animal-boar-bolingbroke': true,
        'animal-hawk-vinewood': true,
        'animal-cormorant-zancudo': true,
        'animal-seagull-pier': true,
        'animal-shark-paleto': true,
        'animal-farm-grapeseed': true,
        'animal-dolphin-pacific': true,
        'animal-orca-ocean': true,
        // Coleccionables Online (activos por defecto)
        playing_card: true,
        action_figure: true,
        signal_jammer: true,
        movie_prop: true,
        radio_antenna: true,
        // Lugares Extraños (activos por defecto)
        fake_ufo: true,
        shipwreck: true,
        cave: true,
        // Actividades y Deportes (activos por defecto)
        activity: true
    };

    // Propiedades cargadas
    allProperties: PropertyLocation[] = [];
    private propertyMarkers: { marker: L.Marker; property: PropertyLocation }[] = [];

    // Coleccionables GTA Online cargados
    allCollectibles: CollectibleItem[] = [];
    private collectibleMarkers: { marker: L.Marker; item: CollectibleItem }[] = [];

    private playerMarkersLayer: L.LayerGroup | undefined;

    // Estado unificado de acordeones (Panel de control y Ajustes)
    // Las tarjetas principales permanecen abiertas pero los acordeones interiores inician replegados
    accordion: { [key: string]: boolean } = {
        propiedades: false,     // Panel de control: Propiedades
        negocios: false,        // Panel de control: Negocios
        vehiculos: false,       // Panel de control: Vehículos
        servicios: false,       // Panel de control: Servicios
        actividades: false,     // Panel de control: Actividades y Deportes
        roleplay: false,        // Panel de control: Trabajos Roleplay
        personajes: false,      // Panel de control: Personajes y Contactos
        fauna: false,           // Panel de control: Fauna y Vida Salvaje
        coleccionables: false,  // Panel de control: Coleccionables
        lugares: false,         // Panel de control: Lugares Extraños
        modo: false,            // Ajustes: Modo de juego
        mapa: false,            // Ajustes: Selector de mapa
        zona: false             // Ajustes: Estilo y tamaño de iconos
    };

    selectedZone = 'all';

    // Hora del juego en Los Santos (1 minuto en el juego = 2 segundos reales)
    inGameHours = 12;
    inGameMinutes = 0;
    inGameTimeStr = '12:00';
    private clockInterval: any;

    // Panel de Ajustes (colapsable como el Panel de Control)
    settingsOpen = true;

    // Estilo de Iconos
    iconTheme: 'modern' | 'classic' = 'classic';
    iconSize: 'compact' | 'standard' | 'large' = 'standard';

    // Menú contextual y Marcadores de usuario
    ctxOpen = false;
    ctxX = 0;
    ctxY = 0;
    private ctxLatLng: L.LatLng | null = null;
    userCustomMarkers: { id: string; name: string; marker: L.Marker; latLng: L.LatLng }[] = [];
    targetCustomMarker: { id: string; name: string; marker: L.Marker; latLng: L.LatLng } | null = null;
    isMarkerContext = false;

    // Telemetría en tiempo real: Coordenadas mundiales de GTA V bajo el ratón
    mouseCoords: { x: number; y: number } = { x: 0, y: 0 };
    coordsCopied = false;

    // Panel Lateral (Drawer) de Perfil & Rockstar Sync
    profileDrawerOpen = false;
    activeProfileTab: 'profile' | 'sync' | 'manual' = 'profile';
    userProfile!: UserProfile;
    private profileSub?: Subscription;

    editNickname = '';
    editRank = 100;
    editBank = 5000000;

    // ============================================================
    // CONCESIONARIOS: definición centralizada
    // ============================================================
    readonly dealers = [
      { id: 'legendarymotorsport', name: 'Legendary Motorsport', icon: 'fa-star',   color: '#ffb833', gameMode: 'online' as const },
      { id: 'superautos',          name: 'Southern San Andreas',  icon: 'fa-car',    color: '#3498db', gameMode: 'both'   as const },
      { id: 'bennys',              name: "Benny's Original MW",   icon: 'fa-wrench', color: '#e67e22', gameMode: 'online' as const },
      { id: 'elitas',              name: 'Elitas Travel',          icon: 'fa-plane',  color: '#8e44ad', gameMode: 'both'   as const },
      { id: 'docktease',           name: 'DockTease',              icon: 'fa-ship',   color: '#2980b9', gameMode: 'both'   as const },
      { id: 'warstock',            name: 'Warstock C&C',           icon: 'fa-bomb',   color: '#c0392b', gameMode: 'online' as const },
    ];

    // ============================================================
    // ESTADO DEL DRAWER: navegación y selección
    // ============================================================
    // Tabs del drawer
    drawerTabs: { id: string; label: string; icon: string }[] = [
      { id: 'vehiculos', label: 'Vehículos', icon: 'fa-car-side' },
      { id: 'misiones',  label: 'Misiones',  icon: 'fa-bullseye' },
      { id: 'item3',     label: 'Item3',     icon: 'fa-box' },
      { id: 'item4',     label: 'Item4',     icon: 'fa-crown' },
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

    // Todas las clases disponibles en el concesionario activo (para filtrado futuro)
    get dealerClasses(): string[] {
      const classes = [...new Set(this.dealerVehicles.map(v => v.class))];
      return classes.sort();
    }

    // Concesionarios visibles según el modo de juego activo
    get visibleDealers() {
      return this.dealers.filter(d => d.gameMode === 'both' || d.gameMode === this.selectedGameMode);
    }

    setDrawerTab(tabId: string): void {
      this.activeDrawerTab = tabId;
      // Al cambiar de pestaña, volvemos siempre a la vista de tabs
      if (this.drawerView === 'dealer-grid') {
        this.drawerView = 'tabs';
        this.activeDealerId = null;
      }
    }

    openDealerGrid(dealerId: string, dealerName: string): void {
      this.activeDealerId = dealerId;
      this.activeDealerName = dealerName;
      this.selectedVehicle = null;
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

    private loadDealerVehicles(dealerId: string): void {
      // Usar cache si ya lo cargamos antes
      if (this.vehicleCache[dealerId]) {
        this.dealerVehicles = this.vehicleCache[dealerId];
        return;
      }

      this.vehiclesLoading = true;
      this.vehiclesError = false;
      this.dealerVehicles = [];

      // URL del JSON de mxamber (raw GitHub)
      const url = 'https://raw.githubusercontent.com/mxamber/gtavehicles/master/gtavehicles.json';

      fetch(url)
        .then(r => r.json())
        .then((data: any) => {
          const vehicles: GtaVehicle[] = [];
          const vehiclesObj = data.vehicles || {};

          for (const [key, raw] of Object.entries(vehiclesObj) as [string, any][]) {
            if (!raw || !raw.venue) continue;
            const venue: string = (raw.venue || '').toLowerCase();

            // Mapear venue al id del concesionario
            const venueMap: { [k: string]: string } = {
              'legendarymotorsport': 'legendarymotorsport',
              'motorsport':          'legendarymotorsport',
              'superautos':          'superautos',
              'warstock':            'warstock',
              'bennys':              'bennys',
              'elitas':              'elitas',
              'docktease':           'docktease',
            };
            const mappedVenue = venueMap[venue];
            if (!mappedVenue) continue;

            const stats = this.computeVehicleStats(key, raw.type || 'car', raw.price_full || 0);
            const v: GtaVehicle = {
              id: key,
              name: raw.name || key,
              manufacturer: raw.manufacturer || '',
              class: (raw.type || 'car').toUpperCase(),
              venue: mappedVenue,
              priceFull: raw.price_full || 0,
              priceTrade: raw.price_trade || 0,
              type: raw.type || 'car',
              weaponized: raw.weaponized || false,
              imageUrl: `https://raw.githubusercontent.com/MericcaN41/gta5carimages/main/images/${key.toLowerCase()}.png`,
              speed: stats.speed,
              acceleration: stats.accel,
              braking: stats.brake,
              handling: stats.handling,
            };
            vehicles.push(v);
          }

          vehicles.sort((a, b) => a.name.localeCompare(b.name));

          // Pre-cache por venue
          const byVenue: { [k: string]: GtaVehicle[] } = {};
          for (const v of vehicles) {
            if (!byVenue[v.venue]) byVenue[v.venue] = [];
            byVenue[v.venue].push(v);
          }
          // Fusionar en vehicleCache
          for (const [venue, list] of Object.entries(byVenue)) {
            this.vehicleCache[venue] = list;
          }

          this.dealerVehicles = this.vehicleCache[dealerId] || [];
          this.vehiclesLoading = false;
        })
        .catch(() => {
          this.vehiclesLoading = false;
          this.vehiclesError = true;
        });
    }

    computeVehicleStats(key: string, type: string, price: number): { speed: number; accel: number; brake: number; handling: number } {
      let hash = 0;
      for (let i = 0; i < key.length; i++) hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0;
      const h = Math.abs(hash);
      const t = type.toLowerCase();
      const base = t.includes('super') || price > 1500000 ? 8.8 :
                   t.includes('sport') || price > 800000  ? 8.0 :
                   t.includes('motor') ? 8.2 :
                   t.includes('muscle') ? 7.4 : 6.2;
      const speed = Math.min(9.9, Math.max(4.0, Number((base + (h % 15) / 10 - 0.7).toFixed(1))));
      const accel = Math.min(9.8, Math.max(3.5, Number((base * 0.95 + ((h >> 2) % 15) / 10 - 0.7).toFixed(1))));
      const brake = Math.min(9.5, Math.max(4.0, Number((6.8 + ((h >> 4) % 25) / 10 - 1.2).toFixed(1))));
      const handling = Math.min(9.6, Math.max(4.2, Number((7.0 + ((h >> 6) % 20) / 10 - 1.0).toFixed(1))));
      return { speed, accel, brake, handling };
    }

    onVehicleImgError(v: GtaVehicle): void {
      v.imgFailed = true;
    }

    formatPrice(price: number): string {
      if (!price || price <= 0) return 'Precio no disponible';
      return '$' + price.toLocaleString('es-ES');
    }

    getVehicleClassLabel(cls: string): string {
      const labels: { [k: string]: string } = {
        'car': 'Coche', 'motorcycle': 'Moto', 'helicopter': 'Helicóptero',
        'plane': 'Avión', 'boat': 'Barco', 'trailer': 'Remolque',
        'super': 'Súper', 'sport': 'Deportivo', 'muscle': 'Muscle',
        'suv': 'SUV', 'sedan': 'Sedán', 'compact': 'Compacto',
        'van': 'Furgoneta', 'military': 'Militar', 'service': 'Servicio',
      };
      return labels[cls?.toLowerCase() || ''] || cls;
    }

    drawerGroupOpen: { [category: string]: boolean } = {};
    manualJsonInput = '';
    syncFeedbackMsg = '';
    scriptCopied = false;

    constructor(
        private locationService: LocationService,
        public userProfileService: UserProfileService
    ) {}

    ngOnInit(): void {
        this.startInGameClock();

        (window as any)._gtaRenameMarker = (id: string) => {
            const found = this.userCustomMarkers.find(m => m.id === id);
            if (found) {
                const newName = prompt('Introduce el nuevo nombre del marcador:', found.name);
                if (newName && newName.trim() !== '') {
                    found.name = newName.trim();
                    this.updateCustomMarkerPopup(found);
                }
            }
        };

        (window as any)._gtaDeleteMarker = (id: string) => {
            const found = this.userCustomMarkers.find(m => m.id === id);
            if (found && this.playerMarkersLayer) {
                this.playerMarkersLayer.removeLayer(found.marker);
                this.userCustomMarkers = this.userCustomMarkers.filter(m => m.id !== id);
                if (this.targetCustomMarker?.id === id) {
                    this.targetCustomMarker = null;
                }
            }
        };

        this.userProfile = this.userProfileService.currentProfile;
        this.editNickname = this.userProfile.nickname;
        this.editRank = this.userProfile.rank || 100;
        this.editBank = this.userProfile.bank || 5000000;

        this.profileSub = this.userProfileService.profile$.subscribe(prof => {
            this.userProfile = prof;
            this.editNickname = prof.nickname;
            this.editRank = prof.rank || 100;
            this.editBank = prof.bank || 5000000;
            this.renderPropertyMarkers();
            this.renderCollectibleMarkers();
        });
    }

    private startInGameClock(): void {
        const now = new Date();
        const totalRealSecondsToday = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
        const inGameTotalSeconds = (totalRealSecondsToday * 30) % 86400;
        this.inGameHours = Math.floor(inGameTotalSeconds / 3600);
        this.inGameMinutes = Math.floor((inGameTotalSeconds % 3600) / 60);
        this.updateInGameTimeString();

        this.clockInterval = setInterval(() => {
            this.inGameMinutes++;
            if (this.inGameMinutes >= 60) {
                this.inGameMinutes = 0;
                this.inGameHours = (this.inGameHours + 1) % 24;
            }
            this.updateInGameTimeString();
        }, 2000);
    }

    private updateInGameTimeString(): void {
        const hh = this.inGameHours.toString().padStart(2, '0');
        const mm = this.inGameMinutes.toString().padStart(2, '0');
        this.inGameTimeStr = `${hh}:${mm}`;
    }

    toggleSettings(): void {
        this.settingsOpen = !this.settingsOpen;
    }

    updateIconStyle(): void {
        if (!this.map) return;
        const container = this.map.getContainer();
        container.classList.remove(
            'icon-size-compact',
            'icon-size-standard',
            'icon-size-large',
            'icon-theme-modern',
            'icon-theme-classic'
        );
        container.classList.add(`icon-size-${this.iconSize}`, `icon-theme-${this.iconTheme}`);
    }

    toggleSection(section: string): void {
        this.accordion[section] = !this.accordion[section];
    }

    openContextMenu(event: MouseEvent): void {
        event.preventDefault();
        this.isMarkerContext = false;
        this.targetCustomMarker = null;
        this.ctxOpen = true;
        this.ctxX = event.clientX;
        this.ctxY = event.clientY;

        if (this.map) {
            const containerPoint = L.point(event.clientX, event.clientY);
            this.ctxLatLng = this.map.containerPointToLatLng(containerPoint);
        }
    }

    closeContextMenu(): void {
        this.ctxOpen = false;
    }

    runCtxAction(action: string): void {
        this.ctxOpen = false;
        if (!this.map) return;

        switch (action) {
            case 'centrar':
                if (this.ctxLatLng) {
                    this.map.panTo(this.ctxLatLng, { animate: true });
                }
                break;
            case 'marcador':
                if (this.ctxLatLng && this.playerMarkersLayer) {
                    const id = 'custom-' + Date.now();
                    const name = 'Marcador ' + (this.userCustomMarkers.length + 1);
                    const customIcon = this.createPushpinIcon();
                    const m = L.marker(this.ctxLatLng, { icon: customIcon });
                    const item = { id, name, marker: m, latLng: this.ctxLatLng };

                    m.on('contextmenu', (e: L.LeafletMouseEvent) => {
                        L.DomEvent.stopPropagation(e);
                        this.targetCustomMarker = item;
                        this.isMarkerContext = true;
                        this.ctxX = e.originalEvent.clientX;
                        this.ctxY = e.originalEvent.clientY;
                        this.ctxOpen = true;
                    });

                    this.updateCustomMarkerPopup(item);
                    m.addTo(this.playerMarkersLayer);
                    this.userCustomMarkers.push(item);
                    m.openPopup();
                }
                break;
            case 'editar_marcador':
                if (this.targetCustomMarker) {
                    const current = this.targetCustomMarker.name;
                    const newName = prompt('Introduce el nuevo nombre del marcador:', current);
                    if (newName && newName.trim() !== '') {
                        this.targetCustomMarker.name = newName.trim();
                        this.updateCustomMarkerPopup(this.targetCustomMarker);
                        this.targetCustomMarker.marker.openPopup();
                    }
                }
                break;
            case 'borrar_este_marcador':
                if (this.targetCustomMarker && this.playerMarkersLayer) {
                    this.playerMarkersLayer.removeLayer(this.targetCustomMarker.marker);
                    this.userCustomMarkers = this.userCustomMarkers.filter(m => m.id !== this.targetCustomMarker!.id);
                    this.targetCustomMarker = null;
                }
                break;
            case 'borrar':
                if (this.playerMarkersLayer) {
                    this.playerMarkersLayer.clearLayers();
                    this.userCustomMarkers = [];
                    this.targetCustomMarker = null;
                }
                break;
        }
    }

    private createPushpinIcon(): L.DivIcon {
        return L.divIcon({
            className: 'gta-classic-pushpin-icon',
            html: `
                <div class="classic-pushpin-wrapper">
                    <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <radialGradient id="gtaRedHead" cx="35%" cy="30%" r="65%">
                                <stop offset="0%" stop-color="#ff7575"/>
                                <stop offset="35%" stop-color="#e61919"/>
                                <stop offset="85%" stop-color="#a80707"/>
                                <stop offset="100%" stop-color="#5a0000"/>
                            </radialGradient>
                            <linearGradient id="gtaSteelNeedle" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stop-color="#d6dadf"/>
                                <stop offset="45%" stop-color="#ffffff"/>
                                <stop offset="75%" stop-color="#8c939a"/>
                                <stop offset="100%" stop-color="#4d5156"/>
                            </linearGradient>
                            <filter id="gtaPinShadow" x="0" y="0" width="32" height="40" filterUnits="userSpaceOnUse">
                                <feDropShadow dx="1" dy="3" stdDeviation="1.8" flood-color="#000000" flood-opacity="0.65"/>
                            </filter>
                        </defs>
                        <g filter="url(#gtaPinShadow)">
                            <!-- Aguja de acero afilada apuntando a (16, 38) -->
                            <polygon points="14.8,20 17.2,20 16.3,38 15.7,38" fill="url(#gtaSteelNeedle)"/>
                            <line x1="16" y1="20" x2="16" y2="38" stroke="#ffffff" stroke-width="0.6" opacity="0.9"/>
                            <!-- Cono inferior rojo -->
                            <path d="M10.5,20 C10.5,15.5 12.5,13.5 16,13.5 C19.5,13.5 21.5,15.5 21.5,20 Z" fill="url(#gtaRedHead)"/>
                            <!-- Aro central -->
                            <ellipse cx="16" cy="13.5" rx="7.2" ry="2.2" fill="#8f0505"/>
                            <ellipse cx="16" cy="12.8" rx="6.9" ry="1.9" fill="#ff4444"/>
                            <!-- Cabeza esférica roja superior -->
                            <ellipse cx="16" cy="7.5" rx="7.8" ry="6.8" fill="url(#gtaRedHead)"/>
                            <!-- Reflejo 3D brillante -->
                            <ellipse cx="13.5" cy="5.2" rx="3.2" ry="1.9" fill="#ffffff" opacity="0.8" transform="rotate(-18 13.5 5.2)"/>
                        </g>
                    </svg>
                </div>
            `,
            iconSize: [32, 40],
            iconAnchor: [16, 38],
            popupAnchor: [0, -36]
        });
    }

    copyCurrentCoords(): void {
        const text = `X: ${this.mouseCoords.x.toFixed(1)}, Y: ${this.mouseCoords.y.toFixed(1)}`;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                this.coordsCopied = true;
                setTimeout(() => this.coordsCopied = false, 1800);
            });
        }
    }

    private updateCustomMarkerPopup(item: { id: string; name: string; marker: L.Marker; latLng: L.LatLng }): void {
        const html = `
            <div class="custom-marker-popup-card">
                <div class="custom-marker-title-row">
                    <h4 class="custom-marker-name">${item.name}</h4>
                </div>
                <div class="custom-marker-actions">
                    <button type="button" class="btn-marker-action btn-marker-edit" onclick="window._gtaRenameMarker('${item.id}')">
                        <span>✏️</span> Editar
                    </button>
                    <button type="button" class="btn-marker-action btn-marker-delete" onclick="window._gtaDeleteMarker('${item.id}')">
                        <span>🗑️</span> Borrar
                    </button>
                </div>
            </div>
        `;
        item.marker.bindPopup(html, {
            className: 'gta-custom-pin-popup',
            maxWidth: 240,
            minWidth: 200,
            autoPan: true
        });
    }

    ngAfterViewInit(): void {
        this.initMap(this.currentMapType);
        window.addEventListener('resize', this.onWindowResize);
    }

    ngOnDestroy(): void {
        window.removeEventListener('resize', this.onWindowResize);
        if (this.clockInterval) {
            clearInterval(this.clockInterval);
        }
        delete (window as any)._gtaRenameMarker;
        delete (window as any)._gtaDeleteMarker;
        if (this.profileSub) {
            this.profileSub.unsubscribe();
        }
        if (this.map) {
            this.map.remove();
        }
    }

    private readonly onWindowResize = () => {
        if (this.map) {
            this.map.setMinZoom(this.computeMinZoom(this.imageSize, this.maxZoom));
        }
    };

    private computeMinZoom(imageSize: number, maxZoom: number): number {
        const el = document.getElementById('gta-map');
        const width = el ? el.clientWidth : 0;
        if (width <= 0) return 2;
        const min = maxZoom + Math.log2(width / imageSize);
        return Math.min(maxZoom, Math.max(1, Math.ceil(min)));
    }

    private initMap(mapType: string): void {
        if (this.map) {
            this.map.remove();
        }

        const mapBounds = L.latLngBounds([-64, 0], [0, 64]);
        const minZoom = this.computeMinZoom(this.imageSize, this.maxZoom);

        this.map = L.map('gta-map', {
            crs: L.CRS.Simple,
            minZoom,
            maxZoom: this.maxZoom,
            zoom: minZoom + 0.5,
            center: [-36, 30],
            maxBounds: mapBounds,
            zoomControl: false,
            attributionControl: false
        });

        let tileUrl: string;
        let tileClass = '';

        if (mapType === 'UV' || mapType === 'UV2') {
            tileUrl = 'https://tiles.mapgenie.io/games/gta5/los-santos/uv/{z}/{x}/{y}.jpg';
            if (mapType === 'UV2') {
                tileClass = 'leaflet-tile-uv2';
            }
        } else if (mapType === 'Juego') {
            tileUrl = `assets/Roadmap/{z}_{x}_{y}.jpg`;
            tileClass = 'leaflet-tile-juego';
        } else {
            tileUrl = `assets/${mapType}/{z}_{x}_{y}.jpg`;
        }

        const tileLayer = L.tileLayer(tileUrl, {
            tileSize: 256,
            minZoom: 0,
            maxZoom: this.maxZoom,
            errorTileUrl: mapType.startsWith('UV') ? undefined : `assets/${mapType === 'Juego' ? 'Roadmap' : mapType}/empty.jpg`,
            noWrap: true,
            className: tileClass
        });

        tileLayer.addTo(this.map);

        // Capa para marcadores del jugador creados con clic derecho
        this.playerMarkersLayer = L.layerGroup().addTo(this.map);

        // Cargar dataset de negocios y propiedades
        this.loadProperties();

        // Cargar dataset de coleccionables de GTA Online
        this.loadCollectibles();

        // Aplicar estilos y escala de iconos
        this.updateIconStyle();

        // Seguir movimiento del ratón para mostrar coordenadas X e Y en tiempo real en el HUD
        this.map.on('mousemove', (e: L.LeafletMouseEvent) => {
            this.mouseCoords = this.latLngToWorld(e.latlng.lat, e.latlng.lng);
        });
    }

    /**
     * Convierte coordenadas de mundo del juego GTA V (X, Y) a coordenadas Leaflet CRS.Simple.
     * Calibrado matemáticamente sobre la proyección satelital oficial de 8192px.
     */
    worldToLatLng(x: number, y: number): [number, number] {
        const originX = 3753.6;
        const originY = 5529.6;
        const scale = 0.660; // 0.660 px por metro oficial

        const px = originX + (scale * x);
        const py = originY - (scale * y);

        const lat = -py / 128;
        const lng = px / 128;
        return [lat, lng];
    }

    /**
     * Convierte coordenadas Leaflet CRS.Simple (lat, lng) a coordenadas mundiales del juego GTA V (X, Y).
     * Función inversa exacta de worldToLatLng para telemetría y ajuste manual.
     */
    latLngToWorld(lat: number, lng: number): { x: number; y: number } {
        const originX = 3753.6;
        const originY = 5529.6;
        const scale = 0.660; // 0.660 px por metro oficial

        const px = lng * 128;
        const py = -lat * 128;

        const x = (px - originX) / scale;
        const y = (originY - py) / scale;

        return {
            x: Math.round(x * 10) / 10,
            y: Math.round(y * 10) / 10
        };
    }

    private loadProperties(): void {
        this.locationService.getProperties().subscribe({
            next: (properties) => {
                this.allProperties = properties;
                this.renderPropertyMarkers();
            },
            error: (err) => console.error('Error al cargar propiedades:', err)
        });
    }

    private loadCollectibles(): void {
        this.locationService.getCollectibles().subscribe({
            next: (collectibles) => {
                this.allCollectibles = collectibles;
                this.renderCollectibleMarkers();
            },
            error: (err) => console.error('Error al cargar coleccionables:', err)
        });
    }

    private renderPropertyMarkers(): void {
        const map = this.map;
        if (!map) return;

        // Limpiar marcadores anteriores
        this.propertyMarkers.forEach(p => p.marker.remove());
        this.propertyMarkers = [];

        this.allProperties.forEach(p => {
            // Comprobar filtro: si es roleplay_job, character o animal, comprobar por su id individual
            if (p.category === 'roleplay_job' || p.category === 'character' || p.category === 'animal') {
                if (!this.layerFilters[p.id]) return;
            } else {
                if (!this.layerFilters[p.category]) return;
            }

            // Comprobar filtro de modo de juego (Bifurcación Modo Historia vs GTA Online)
            if (p.gameMode !== 'both' && p.gameMode !== this.selectedGameMode) {
                return;
            }

            const isPurchasable = this.isPurchasable(p);
            const isOwned = isPurchasable && this.userProfileService.isPropertyOwned(p.id);
            const isHighlight = isOwned && this.userProfile?.highlightOwnedProperties;
            const ownedClass = isHighlight ? 'pin-is-owned' : '';

            const [lat, lng] = this.worldToLatLng(p.position.x, p.position.y);

            // Determinar símbolo gráfico para el pin (garantizar iconos limpios en comisarías, hospitales, bomberos y arena)
            let pinSymbol = p.badge.symbol || '•';
            if (p.category === 'police_station' && (!pinSymbol || pinSymbol === 'POL')) pinSymbol = '🚓';
            if (p.category === 'hospital' && (!pinSymbol || pinSymbol === 'MED' || pinSymbol === '✚')) pinSymbol = '🏥';
            if (p.category === 'fire_station' && (!pinSymbol || pinSymbol === 'BOM')) pinSymbol = '🚒';
            if (p.category === 'car_wash') pinSymbol = '🚿';
            if (p.category === 'arena_war') pinSymbol = '🏟️';

            const pinInnerHtml = `<span class="gta-pin-symbol" style="color: ${p.category === 'character' ? '#f5cd2f' : 'var(--pin-color, #ffb833)'}; font-weight: 800;">${pinSymbol}</span>`;

            const icon = L.divIcon({
                className: 'gta-pin-wrapper',
                html: `
                    <div class="gta-pin gta-pin-${p.category}" style="--pin-color: ${p.badge.color}">
                        ${pinInnerHtml}
                    </div>
                `,
                iconSize: [30, 30],
                iconAnchor: [15, 30],
                popupAnchor: [0, -28]
            });

            const featuresHtml = p.features && p.features.length > 0
                ? `<ul class="popup-features">${p.features.map(f => `<li>${f}</li>`).join('')}</ul>`
                : '';

            const incomeHtml = p.income
                ? `<div class="popup-row"><span class="popup-tag-lbl">Ingresos:</span> <span class="popup-tag-val val-income">${p.income}</span></div>`
                : '';

            const ownerHtml = p.owner
                ? `<div class="popup-row"><span class="popup-tag-lbl">Comprador:</span> <span class="popup-tag-val">${p.owner}</span></div>`
                : '';

            const imageHtml = p.imageUrl
                ? `<div class="popup-image-box"><img src="${p.imageUrl}" alt="${p.name}" class="popup-img" loading="lazy" onerror="this.parentElement.style.display='none'" /></div>`
                : '';

            // Bloque de precio vs servicio público
            const priceSectionHtml = isPurchasable
                ? `
                    <div class="popup-price-box">
                        <span class="price-title">PRECIO</span>
                        <span class="price-num">${p.priceFormatted}</span>
                    </div>
                  `
                : `
                    <div class="popup-service-tag-box">
                        <span class="service-type-badge">${p.categoryLabel}</span>
                        <span class="service-status-text">${p.priceFormatted || 'Punto de Interés'}</span>
                    </div>
                  `;

            const popupHtml = `
                <div class="gta-popup-card">
                    ${imageHtml}
                    <div class="popup-banner" style="background: linear-gradient(135deg, ${p.badge.color}33, #0b0f14 85%); border-bottom: 2px solid ${p.badge.color};">
                        <span class="popup-badge" style="color: ${p.badge.color}; border-color: ${p.badge.color}66">${p.categoryLabel}</span>
                        <h4 class="popup-title">${p.name}</h4>
                        <div class="popup-zone">${p.zone}</div>
                    </div>
                    <div class="popup-content">
                        ${priceSectionHtml}
                        ${incomeHtml}
                        ${ownerHtml}
                        <p class="popup-desc">${p.description}</p>
                        ${featuresHtml}
                    </div>
                </div>
            `;

            const tooltipPrice = isPurchasable
                ? `<br><span style="color:#2ecc71">${p.priceFormatted}</span>`
                : `<br><span style="color:#3498db">${p.categoryLabel}</span>`;

            const marker = L.marker([lat, lng], { icon })
                .bindPopup(popupHtml, { maxWidth: 300, className: 'gta-leaflet-popup' })
                .bindTooltip(`<b>${p.name}</b>${tooltipPrice}`, {
                    direction: 'top',
                    offset: [0, -26],
                    className: 'gta-leaflet-tooltip'
                });

            marker.addTo(map);
            this.propertyMarkers.push({ marker, property: p });
        });
    }

    private renderCollectibleMarkers(): void {
        const map = this.map;
        if (!map) return;

        // Limpiar marcadores anteriores
        this.collectibleMarkers.forEach(c => c.marker.remove());
        this.collectibleMarkers = [];

        // Los coleccionables son exclusivos de GTA Online: no mostrar si el modo seleccionado es 'story'
        if (this.selectedGameMode === 'story') {
            return;
        }

        this.allCollectibles.forEach(item => {
            const isCollected = this.userProfileService.isItemCollected(item.id);

            // Comprobar si el usuario decidió ocultar coleccionables ya conseguidos
            if (this.userProfile?.hideCollectedItems && isCollected) {
                return;
            }

            // Comprobar filtro de categoría
            if (!this.layerFilters[item.category]) return;

            const [lat, lng] = this.worldToLatLng(item.position.x, item.position.y);

            const icon = L.divIcon({
                className: 'gta-pin-collectible-wrapper',
                html: `
                    <div class="gta-pin-collectible gta-pin-col-${item.category}" style="--pin-color: ${item.badge.color}">
                        <span class="gta-pin-col-symbol">${item.badge.symbol || '•'}</span>
                    </div>
                `,
                iconSize: [22, 22],
                iconAnchor: [11, 11],
                popupAnchor: [0, -13]
            });

            const popupHtml = `
                <div class="gta-popup-card">
                    <div class="popup-banner" style="background: linear-gradient(135deg, ${item.badge.color}33, #0b0f14 85%); border-bottom: 2px solid ${item.badge.color};">
                        <span class="popup-badge" style="color: ${item.badge.color}; border-color: ${item.badge.color}66">${item.categoryLabel} (#${item.number}/${item.total})</span>
                        <h4 class="popup-title">${item.name}</h4>
                        <div class="popup-zone">${item.zone}</div>
                    </div>
                    <div class="popup-content">
                        <div class="popup-row">
                            <span class="popup-tag-lbl">Pista / Ubicación:</span>
                            <span class="popup-tag-val">${item.hint}</span>
                        </div>
                        <div class="popup-row">
                            <span class="popup-tag-lbl">Recompensa:</span>
                            <span class="popup-tag-val val-income">${item.reward}</span>
                        </div>
                    </div>
                </div>
            `;

            const marker = L.marker([lat, lng], { icon })
                .bindPopup(popupHtml, { maxWidth: 320, className: 'gta-leaflet-popup' })
                .bindTooltip(`<b>${item.name}</b><br><span style="color:${item.badge.color}">${item.categoryLabel} (#${item.number}/${item.total})</span>`, {
                    direction: 'top',
                    offset: [0, -12],
                    className: 'gta-leaflet-tooltip'
                });

            marker.addTo(map);
            this.collectibleMarkers.push({ marker, item });
        });
    }

    /**
     * Alterna la visibilidad de una categoría de la leyenda
     */
    toggleLayer(categoryKey: string): void {
        this.layerFilters[categoryKey] = !this.layerFilters[categoryKey];
        this.renderPropertyMarkers();
        this.renderCollectibleMarkers();
    }

    /**
     * Vuela la cámara y centra el mapa con zoom directo sobre un personaje
     */
    zoomToCharacter(char: PropertyLocation, event?: MouseEvent): void {
        if (event) {
            event.stopPropagation();
        }
        if (!this.map) return;

        // Si el personaje está desactivado en los filtros, activarlo
        if (!this.layerFilters[char.id]) {
            this.layerFilters[char.id] = true;
            this.renderPropertyMarkers();
        }

        const [lat, lng] = this.worldToLatLng(char.position.x, char.position.y);
        const targetZoom = Math.min(this.maxZoom, 5.5);

        this.map.flyTo([lat, lng], targetZoom, {
            animate: true,
            duration: 1.1
        });

        // Abrir automáticamente el popup del personaje tras el vuelo de cámara
        setTimeout(() => {
            const match = this.propertyMarkers.find(pm => pm.property.id === char.id);
            if (match) {
                match.marker.openPopup();
            }
        }, 850);
    }

    /**
     * Alterna la apertura/cierre de la caja de leyenda
     */
    toggleLegend(): void {
        this.legendOpen = !this.legendOpen;
    }

    /**
     * Devuelve el número de elementos cargados de una categoría según el modo activo
     */
    getCategoryCount(categoryKey: string): number {
        return this.allProperties.filter(p =>
            p.category === categoryKey &&
            (p.gameMode === 'both' || p.gameMode === this.selectedGameMode)
        ).length;
    }

    /**
     * Devuelve el número de coleccionables cargados de una categoría
     */
    getCollectibleCount(categoryKey: string): number {
        return this.allCollectibles.filter(c => c.category === categoryKey).length;
    }

    /**
     * Devuelve el número de capas actualmente encendidas
     */
    getActiveLayersCount(): number {
        return Object.values(this.layerFilters).filter(v => v).length;
    }

    /**
     * Activa o desactiva todas las capas a la vez
     */
    setAllLayers(state: boolean): void {
        Object.keys(this.layerFilters).forEach(key => {
            this.layerFilters[key] = state;
        });
        this.renderPropertyMarkers();
        this.renderCollectibleMarkers();
    }

    /**
     * Alterna la apertura o cierre de un acordeón concreto dentro de la leyenda
     */
    toggleLegendSection(section: string): void {
        this.toggleSection(section);
    }

    /**
     * Devuelve el número de capas encendidas dentro de un grupo concreto
     */
    getActiveCountInSection(keys: string[]): number {
        return keys.filter(k => this.layerFilters[k]).length;
    }

    /**
     * Comprueba si todas las capas de una sección están activadas
     */
    isSectionAllActive(keys: string[]): boolean {
        return keys.length > 0 && keys.every(k => this.layerFilters[k]);
    }

    /**
     * Maneja el cambio del checkbox suelto e independiente de cada desplegable
     */
    onSectionCheckboxChange(keys: string[], event: Event): void {
        const input = event.target as HTMLInputElement;
        this.toggleAllInSection(keys, input.checked);
    }

    /**
     * Activa o desactiva todas las capas pertenecientes a un grupo de la leyenda
     */
    toggleAllInSection(keys: string[], state?: boolean): void {
        const targetState = state !== undefined ? state : !keys.every(k => this.layerFilters[k]);
        keys.forEach(k => {
            this.layerFilters[k] = targetState;
        });
        this.renderPropertyMarkers();
        this.renderCollectibleMarkers();
    }

    /**
     * Sincroniza el modo de juego (Modo Historia o GTA Online)
     * tanto desde la barra superior como desde el panel de control.
     */
    setGameMode(mode: 'story' | 'online'): void {
        this.selectedGameMode = mode;
        this.chipOffline = mode === 'story';
        this.chipOnline = mode === 'online';

        // Si cambiamos a GTA Online y teníamos un mapa UV seleccionado, volvemos a Satélite
        if (mode === 'online' && (this.currentMapType === 'UV' || this.currentMapType === 'UV2')) {
            this.switchMapType('Satellite');
        }

        this.renderPropertyMarkers();
        this.renderCollectibleMarkers();
    }

    /**
     * Cambia el filtro de modo de juego desde el selector del Panel de Control
     */
    onGameModeChange(mode: 'story' | 'online'): void {
        this.setGameMode(mode);
    }

    /**
     * Hace zoom y centra la cámara en una zona específica
     */
    onZoneChange(zone: string): void {
        this.selectedZone = zone;
        if (!this.map) return;

        switch (zone) {
            case 'city':
                this.map.flyTo([-45.5, 29], 4.2, { duration: 1.2 });
                break;
            case 'sandy':
                this.map.flyTo([-23, 40], 4.2, { duration: 1.2 });
                break;
            case 'paleto':
                this.map.flyTo([-10.5, 27.5], 4.4, { duration: 1.2 });
                break;
            case 'blaine':
                this.map.flyTo([-22, 34], 3.5, { duration: 1.2 });
                break;
            case 'chumash':
                this.map.flyTo([-34, 11], 4.2, { duration: 1.2 });
                break;
            default: // all
                this.map.flyTo([-36, 30], this.computeMinZoom(this.imageSize, this.maxZoom) + 0.5, { duration: 1 });
                break;
        }
    }

    switchMapType(mapType: string): void {
        this.currentMapType = mapType;
        this.initMap(mapType);
    }

    zoomIn(): void {
        if (this.map) {
            this.map.zoomIn();
        }
    }

    zoomOut(): void {
        if (this.map) {
            this.map.zoomOut();
        }
    }

    recenterMap(): void {
        if (this.map) {
            this.map.setView([-36, 30], this.computeMinZoom(this.imageSize, this.maxZoom) + 0.5);
        }
    }

    // ==========================================
    // MÉTODOS DE FICHA DE JUGADOR Y PROGRESO
    // ==========================================

    toggleProfileDrawer(): void {
        this.profileDrawerOpen = !this.profileDrawerOpen;
    }

    closeProfileDrawer(): void {
        this.profileDrawerOpen = false;
    }

    saveLocalProfile(): void {
        const rawNick = (this.editNickname || '').trim().replace(/<[^>]*>?/gm, '');
        const cleanNick = rawNick.substring(0, 50) || 'Jugador de Los Santos';
        const cleanRank = Math.min(Math.max(Number(this.editRank) || 1, 1), 8000);
        const cleanBank = Math.max(Number(this.editBank) || 0, 0);

        this.editNickname = cleanNick;
        this.editRank = cleanRank;
        this.editBank = cleanBank;

        this.userProfileService.saveProfile({
            nickname: cleanNick,
            rank: cleanRank,
            bank: cleanBank
        }).subscribe({
            next: () => {
                this.syncFeedbackMsg = '¡Ficha guardada!';
                setTimeout(() => this.syncFeedbackMsg = '', 2500);
            },
            error: (err) => {
                if (err?.status === 429) {
                    this.syncFeedbackMsg = 'Límite de guardados excedido. Espera unos segundos.';
                }
            }
        });
    }

    toggleHighlightOwned(): void {
        this.userProfileService.toggleHighlightOwned();
    }

    toggleHideCollected(): void {
        this.userProfileService.toggleHideCollected();
    }

    togglePropertyOwned(propertyId: string): void {
        const prop = this.allProperties.find(p => p.id === propertyId);
        if (!this.isPurchasable(prop)) {
            return;
        }

        const current = this.userProfile.ownedPropertyIds || [];
        const index = current.indexOf(propertyId);
        const updated = [...current];
        if (index >= 0) {
            updated.splice(index, 1);
        } else {
            updated.push(propertyId);
        }
        this.userProfileService.saveProfile({ ownedPropertyIds: updated }).subscribe(() => {
            this.renderPropertyMarkers();
        });
    }

    toggleItemCollected(itemId: string): void {
        const current = this.userProfile.collectedItemIds || [];
        const index = current.indexOf(itemId);
        const updated = [...current];
        if (index >= 0) {
            updated.splice(index, 1);
        } else {
            updated.push(itemId);
        }
        this.userProfileService.saveProfile({ collectedItemIds: updated }).subscribe(() => {
            this.renderCollectibleMarkers();
        });
    }

    getOwnedPropertyList(): PropertyLocation[] {
        const ids = new Set(this.userProfile.ownedPropertyIds || []);
        return this.allProperties.filter(p => ids.has(p.id) && this.isPurchasable(p));
    }

    getTotalEmpireValue(): number {
        const owned = this.getOwnedPropertyList();
        return owned.reduce((sum, p) => sum + (p.price || 0), 0);
    }

    getFormattedEmpireValue(): string {
        const val = this.getTotalEmpireValue();
        return '$' + val.toLocaleString('es-ES');
    }

    getOwnedPropertiesGrouped(): { category: string; categoryLabel: string; count: number; totalValueFormatted: string; properties: PropertyLocation[] }[] {
        const owned = this.getOwnedPropertyList();
        const map = new Map<string, { category: string; categoryLabel: string; count: number; totalValue: number; properties: PropertyLocation[] }>();

        for (const p of owned) {
            const cat = p.category || 'otros';
            if (!map.has(cat)) {
                map.set(cat, {
                    category: cat,
                    categoryLabel: p.categoryLabel || cat,
                    count: 0,
                    totalValue: 0,
                    properties: []
                });
            }
            const group = map.get(cat)!;
            group.count++;
            group.totalValue += (p.price || 0);
            group.properties.push(p);
        }

        return Array.from(map.values()).map(g => ({
            ...g,
            totalValueFormatted: '$' + g.totalValue.toLocaleString('es-ES')
        }));
    }

    toggleDrawerGroup(category: string): void {
        this.drawerGroupOpen[category] = !this.isDrawerGroupOpen(category);
    }

    isDrawerGroupOpen(category: string): boolean {
        return this.drawerGroupOpen[category] !== false;
    }

    clearOwnedProperties(): void {
        this.userProfileService.saveProfile({ ownedPropertyIds: [] }).subscribe(() => {
            this.renderPropertyMarkers();
        });
    }
}
