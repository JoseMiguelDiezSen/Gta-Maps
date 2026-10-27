import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, HostListener, ViewChild, ChangeDetectorRef, effect, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import * as L from 'leaflet';
import { LocationService } from '../../../services/gta5/location.service';
import { LocationItem, RoleplayJobGroup, FaunaAnimalGroup } from '../../../models/gta5/location';
import { CollectibleItem } from '../../../models/gta5/collectible';
import { GtaMystery, MysteryPoint } from '../../../models/gta5/mystery';
import { TranslationService } from '../../../i18n';
import { Router, ActivatedRoute } from '@angular/router';
import { GotyService } from '../../../services/goty.service';
import { Gta5MysteryPopupService } from '../../../services/gta5/gta5-mystery-popup.service';
import { Gta5MapMarkerService } from '../../../services/gta5/gta5-map-marker.service';
import { gta5WorldToLatLng, gta5LatLngToWorld } from '../../../utils/gta5-map-projection';

@Component({
    selector: 'app-gta5-map-online',
    templateUrl: './gta5-map-online.component.html',
    styleUrls: ['./gta5-map-online.component.css'],
    standalone: false
})
export class Gta5MapOnlineComponent implements OnInit, AfterViewInit, OnDestroy {

    @ViewChild('mapWrapper', { static: true }) private mapWrapper!: ElementRef<HTMLElement>;
    isFullscreen = false;

    // Subscripciones para evitar fugas de memoria y condiciones de carrera
    private propertiesSub?: Subscription;
    private collectiblesSub?: Subscription;
    private cayoSub?: Subscription;

    // Mapa Leaflet instanciado
    private map: L.Map | undefined;

    // Configuración de zoom y dimensiones de la textura original
    private readonly maxZoom = 9;
    private readonly imageSize = 8192;

    private _cachedAllMapTypesOnline: { id: string; label: string }[] | null = null;
    private _lastLangOnline = '';
    get allMapTypes() {
        if (!this._cachedAllMapTypesOnline || this._lastLangOnline !== this.translationService.currentLang) {
            this._lastLangOnline = this.translationService.currentLang;
            this._cachedAllMapTypesOnline = [
                { id: 'Satellite', label: this.translationService.t('gta5.maps.satellite') },
                { id: 'Roadmap', label: this.translationService.t('gta5.maps.roadmap') },
                { id: 'Atlas', label: this.translationService.t('gta5.maps.atlas') },
                { id: 'Juego', label: this.translationService.t('gta5.maps.game') }
            ];
        }
        return this._cachedAllMapTypesOnline;
    }

    private cachedMapTypes: { id: string; label: string }[] | null = null;

    updateMapTypes() {
        if (this.selectedCity === 'cp') {
            this.cachedMapTypes = this.allMapTypes.filter(m => ['Satellite', 'Roadmap', 'Juego'].includes(m.id));
        } else {
            this.cachedMapTypes = this.allMapTypes.filter(m => ['Satellite', 'Roadmap', 'Atlas', 'Juego'].includes(m.id));
        }
    }

    get mapTypes() {
        if (!this.cachedMapTypes) {
            this.updateMapTypes();
        }
        return this.cachedMapTypes;
    }

    currentMapType = 'Satellite';

    // Selector de Isla / Zona: 'ls' = Los Santos / San Andreas, 'cp' = Cayo Perico
    selectedCity: 'ls' | 'cp' = 'ls';

    // Colecciones de marcadores y datos cargados de Cayo Perico
    cayoPericoLocations: LocationItem[] = [];
    private cayoPericoMarkers: { marker: L.Marker; location: LocationItem }[] = [];

    readonly cayoPoiKeys = [
        'infiltration_points',
        'escape_points',
        'compound_entry_points',
        'power_station',
        'control_tower'
    ];
    readonly cayoScopingKeys = [
        'secondary_targets',
        'bolt_cutters',
        'grappling_eq',
        'guard_clothing',
        'supply_truck',
        'cutting_powder',
        'water_tower'
    ];
    readonly cayoWeaponKeys = [
        'combat_shotgun',
        'perico_pistol'
    ];
    readonly cayoVehicleKeys = [
        'spawns_forklift',
        'spawns_manchez_scout',
        'spawns_verus',
        'spawns_winky',
        'spawns_squaddie',
        'spawns_dinghy',
        'spawns_weaponized_dinghy'
    ];
    readonly cayoDailyKeys = [
        'treasure_chests',
        'buried_stashes'
    ];

    // Modo fijo: GTA Online
    readonly selectedGameMode = 'online';

    // Estado del panel de capas y leyenda (minimizable)
    legendOpen = true;

    // Propiedades comprables de GTA Online (Mansiones, Apartamentos de Lujo/Medios/Baratos y Garajes)
    readonly onlinePropertyKeys = [
        'mansion',
        'luxury_apartment',
        'mid_apartment',
        'low_apartment',
        'garage'
    ];

    // Claves de los Negocios
    readonly businessKeys = [
        'coke_lockup',
        'weed_farm',
        'warehouse',
        'nightclub',
        'cash_factory',
        'meth_lab',
        'doc_forgery',
        'hangar',
        'arcade',
        'auto_shop',
        'agency',
        'salvage_yard',
        'arena_war',
        'ceo_office',
        'vehicle_warehouse',
        'bunker',
        'facility',
        'bail_office'
    ];

    // Claves de Lugares Extraños
    readonly strangeKeys = [
        'fake_ufo',
        'shipwreck',
        'cave'
    ];

    // Claves de Actividades y Deportes
    readonly activityKeys = [
        'golf',
        'darts',
        'tennis',
        'stunt_jump',
        'under_the_bridge',
        'knife_flight',
        'parachuting'
    ];

    // Claves de Vehículos y Talleres de GTA Online

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

    // Claves de Servicios
    readonly serviceKeys = [
        'police_station',
        'hospital',
        'fire_station',
        'service',
        'convenience_store',
        'mask_shop',
        'car_wash',
        'strip_club',
        'barber',
        'tattoo',
        'clothing_store'
    ];

    private _roleplayJobs: LocationItem[] = [];
    private _roleplayGroups: RoleplayJobGroup[] = [];
    private _contactCharacters: LocationItem[] = [];
    private _faunaAnimals: LocationItem[] = [];
    private _faunaGroups: FaunaAnimalGroup[] = [];
    private _roleplayKeys: string[] = [];
    private _characterKeys: string[] = [];
    private _faunaKeys: string[] = [];

    recomputeDerivedLists() {
        this._roleplayJobs = this.allProperties.filter(p =>
            p.category === 'roleplay_job' &&
            (p.gameMode === 'both' || p.gameMode === this.selectedGameMode)
        );
        this._contactCharacters = this.allProperties.filter(p =>
            p.category === 'character' &&
            (p.gameMode === 'both' || p.gameMode === this.selectedGameMode)
        );
        this._faunaAnimals = this.allProperties.filter(p =>
            p.category === 'animal' &&
            (p.gameMode === 'both' || p.gameMode === this.selectedGameMode)
        );
        this._roleplayKeys = this._roleplayJobs.map(j => j.id);
        this._characterKeys = this._contactCharacters.map(c => c.id);
        this._faunaKeys = this._faunaAnimals.map(a => a.id);

        this.updateRoleplayGroups();
        this.updateFaunaGroups();
    }

    private updateFaunaGroups(): void {
        const groupsMap = new Map<string, FaunaAnimalGroup>();
        this._faunaAnimals.forEach(animal => {
            const key = animal.name;
            const existing = groupsMap.get(key);
            if (existing) {
                existing.keys.push(animal.id);
                existing.count = existing.keys.length;
            } else {
                groupsMap.set(key, {
                    id: animal.id,
                    name: animal.name,
                    keys: [animal.id],
                    color: animal.badge?.color || '#2c3e50',
                    symbol: animal.badge?.symbol || '🐾',
                    imageUrl: animal.imageUrl,
                    count: 1
                });
            }
        });
        this._faunaGroups = Array.from(groupsMap.values());
    }

    private updateRoleplayGroups(): void {
        const pizzaJobs = this._roleplayJobs.filter(j => j.id.startsWith('job-pizza-'));
        const nonPizzaJobs = this._roleplayJobs.filter(j => !j.id.startsWith('job-pizza-'));

        const groups: RoleplayJobGroup[] = [];
        if (pizzaJobs.length > 0) {
            groups.push({
                id: 'job-pizza-group',
                nameKey: 'gta5.layers.roleplayPizza',
                name: this.translationService.t('gta5.layers.roleplayPizza'),
                keys: pizzaJobs.map(j => j.id),
                color: pizzaJobs[0].badge?.color || '#e67e22',
                count: pizzaJobs.length
            });
        }

        nonPizzaJobs.forEach(j => {
            groups.push({
                id: j.id,
                name: j.name,
                keys: [j.id],
                color: j.badge?.color || '#e74c3c',
                count: 1
            });
        });

        this._roleplayGroups = groups;
    }

    get roleplayKeys(): string[] { return this._roleplayKeys; }
    get roleplayGroups(): RoleplayJobGroup[] { return this._roleplayGroups; }
    get characterKeys(): string[] { return this._characterKeys; }
    get faunaKeys(): string[] { return this._faunaKeys; }
    get currentPropertyKeys(): string[] { return this.onlinePropertyKeys; }
    get currentVehicleKeys(): string[] { return this.onlineVehicleKeys; }
    get roleplayJobs(): LocationItem[] { return this._roleplayJobs; }
    get contactCharacters(): LocationItem[] { return this._contactCharacters; }
    get faunaAnimals(): LocationItem[] { return this._faunaAnimals; }
    get faunaGroups(): FaunaAnimalGroup[] { return this._faunaGroups; }

    isFaunaGroupActive(keys: string[]): boolean {
        return keys.length > 0 && keys.some(k => this.layerFilters[k] !== false);
    }

    toggleFaunaGroup(keys: string[]): void {
        const isActive = this.isFaunaGroupActive(keys);
        const newState = !isActive;
        keys.forEach(k => {
            this.layerFilters[k] = newState;
        });
        this.renderPropertyMarkers();
    }

    isRoleplayGroupActive(keys: string[]): boolean {
        return keys.length > 0 && keys.some(k => this.layerFilters[k] !== false);
    }

    toggleRoleplayGroup(keys: string[]): void {
        const isActive = this.isRoleplayGroupActive(keys);
        const newState = !isActive;
        keys.forEach(k => {
            this.layerFilters[k] = newState;
        });
        this.renderPropertyMarkers();
    }

    isPurchasable(p: LocationItem | undefined): boolean {
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
            'barber',
            'tattoo',
            'clothing_store',
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
        return this.allProperties.filter(p => this.isPurchasable(p)).length;
    }

    // Estado de filtros de categorías
    layerFilters: { [key: string]: boolean } = {
        mansion: false,
        luxury_apartment: false,
        mid_apartment: false,
        low_apartment: false,
        garage: false,
        purchasable_business: true,
        hangar: false,
        coke_lockup: false,
        weed_farm: false,
        meth_lab: false,
        cash_factory: false,
        doc_forgery: false,
        bunker: false,
        facility: false,
        bail_office: false,
        auto_shop: true,
        agency: true,
        salvage_yard: true,
        arena_war: false,
        vehicle_warehouse: true,
        warehouse: true,
        nightclub: false,
        arcade: false,
        ceo_office: true,
        mc_business: false,
        ls_customs: false,
        bennys: false,
        hao_garage: false,
        ls_car_meet: false,
        police_station: false,
        hospital: false,
        fire_station: false,
        service: false,
        convenience_store: false,
        mask_shop: false,
        car_wash: false,
        strip_club: false,
        barber: false,
        tattoo: false,
        clothing_store: false,
        animal: false,
        playing_card: false,
        action_figure: false,
        signal_jammer: false,
        movie_prop: false,
        radio_antenna: false,
        fake_ufo: false,
        shipwreck: false,
        cave: false,
        activity: false,
        golf: false,
        darts: false,
        tennis: false,
        stunt_jump: false,
        under_the_bridge: false,
        knife_flight: false,
        parachuting: false,
        // Cayo Perico
        infiltration_points: false,
        escape_points: false,
        compound_entry_points: false,
        power_station: false,
        control_tower: false,
        secondary_targets: false,
        bolt_cutters: false,
        grappling_eq: false,
        guard_clothing: false,
        supply_truck: false,
        cutting_powder: false,
        water_tower: false,
        combat_shotgun: false,
        perico_pistol: false,
        treasure_chests: false,
        buried_stashes: false,
        spawns_forklift: false,
        spawns_manchez_scout: false,
        spawns_verus: false,
        spawns_winky: false,
        spawns_squaddie: false,
        spawns_dinghy: false,
        spawns_weaponized_dinghy: false
    };

    // Propiedades y ubicaciones cargadas
    allProperties: LocationItem[] = [];
    private propertyMarkers: { marker: L.Marker; property: LocationItem }[] = [];

    // Coleccionables GTA Online cargados
    allCollectibles: CollectibleItem[] = [];
    private collectibleMarkers: { marker: L.Marker; item: CollectibleItem }[] = [];

    private playerMarkersLayer: L.LayerGroup | undefined;
    

    // Estado unificado de acordeones
    accordion: { [key: string]: boolean } = {
        propiedades: false,
        negocios: false,
        vehiculos: false,
        servicios: false,
        actividades: false,
        roleplay: false,
        personajes: false,
        fauna: false,
        coleccionables: false,
        lugares: false,
        mapa: false,
        zona: false,
        juego: false,
        marcadores: false,
        // Cayo Perico
        cayo_poi: false,
        cayo_scoping: false,
        cayo_armas: false,
        cayo_vehiculos: false,
        cayo_diarios: false
    };

    selectedGame = 'gta5';
    selectedZone = 'all';

    // Hora del juego en Los Santos (1 minuto en el juego = 2 segundos reales)
    inGameHours = 12;
    inGameMinutes = 0;
    inGameTimeStr = '12:00';
    private clockInterval: ReturnType<typeof setInterval> | null = null;

    // Panel de Ajustes
    settingsOpen = true;

    // Estilo de Iconos
    iconTheme: 'neon' | 'classic' | 'standard' | 'simple' = 'classic';
    iconSize: 'compact' | 'standard' | 'large' = 'standard';

    // Menú contextual y Marcadores de usuario
    ctxOpen = false;
    ctxX = 0;
    ctxY = 0;
    private ctxLatLng: L.LatLng | null = null;
    userCustomMarkers: { id: string; name: string; marker: L.Marker; latLng: L.LatLng; color?: string; x?: number; y?: number; visible?: boolean }[] = [];
    targetCustomMarker: { id: string; name: string; marker: L.Marker; latLng: L.LatLng; color?: string; x?: number; y?: number; visible?: boolean } | null = null;
    isMarkerContext = false;

    // Telemetría en tiempo real: Coordenadas mundiales de GTA V bajo el ratón
    mouseCoords: { x: number; y: number } = { x: 0, y: 0 };
    coordsCopied = false;

    // Panel Lateral (Drawer) de Transportes & Catálogo
    profileDrawerOpen = false;

    private readonly locationService = inject(LocationService);
    readonly translationService = inject(TranslationService);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    public readonly gotyService = inject(GotyService);
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly mysteryPopupService = inject(Gta5MysteryPopupService);
    private readonly mapMarkerService = inject(Gta5MapMarkerService);

    constructor() {
        effect(() => {
            this.translationService.currentLanguage();
            if (this.map) {
                if (this.selectedCity === 'cp') {
                    this.loadCayoPerico();
                } else {
                    this.loadProperties();
                    this.loadCollectibles();
                }
            }
        });
    }

    switchGame(game: string): void {
        this.selectedGame = game;
        if (game === 'gta6') {
            this.router.navigate(['/gta6-map-online']).catch(err => console.error('[Online] Error en la navegación entre mapas:', err));
        } else {
            this.router.navigate(['/gta5-map-online']).catch(err => console.error('[Online] Error en la navegación entre mapas:', err));
        }
    }

    ngOnInit(): void {
        if (typeof window !== 'undefined' && window.innerWidth <= 850) {
            this.iconTheme = 'simple';
            this.legendOpen = false;
            this.settingsOpen = false;
            // Deshabilitar por defecto en baja resolución (móvil) según configuración:
            // Negocios, Servicios, Actividades y Coleccionables.
            const lowResDisabledKeys = [
                // Negocios
                ...this.businessKeys,
                'purchasable_business',
                // Servicios
                ...this.serviceKeys,
                // Actividades
                ...this.activityKeys,
                'activity',
                // Coleccionables
                ...this.collectibleKeys,
                'treasure_chests',
                'buried_stashes'
            ];
            lowResDisabledKeys.forEach(k => {
                this.layerFilters[k] = false;
            });
        }

        const qCity = this.route.snapshot.queryParamMap.get('city');
        if (qCity === 'cp') {
            this.selectedCity = 'cp';
        }
        const qLayer = this.route.snapshot.queryParamMap.get('layer');
        if (qLayer === 'render') this.currentMapType = 'Satellite';
        else if (qLayer === 'game') this.currentMapType = 'Juego';
        else if (qLayer === 'print') this.currentMapType = 'Roadmap';

        const qGroups = this.route.snapshot.queryParamMap.get('groups');
        if (qGroups) {
            const groupsList = qGroups.split(',');
            this.cayoPoiKeys.concat(this.cayoScopingKeys, this.cayoWeaponKeys, this.cayoVehicleKeys, this.cayoDailyKeys).forEach(k => {
                this.layerFilters[k] = groupsList.includes(k);
            });
        }

        this.startInGameClock();

        this.bindCustomMarkerEvents();
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
            'icon-theme-neon',
            'icon-theme-classic',
            'icon-theme-standard',
            'icon-theme-simple'
        );
        container.classList.add(`icon-size-${this.iconSize}`, `icon-theme-${this.iconTheme}`);
        // Rerenderizamos para aplicar el nuevo estilo de icono
        if (this.selectedCity === 'cp') {
            this.renderCayoPericoMarkers();
        } else {
            this.renderPropertyMarkers();
            this.renderCollectibleMarkers();
        }
    }

    toggleSection(section: string): void {
        this.accordion[section] = !this.accordion[section];
    }

    openContextMenu(event: MouseEvent): void {
        const target = event.target as HTMLElement;
        if (target && target.closest('.hud, .hud-panel, .hud-profile-drawer, .profile-drawer, .hud-drawer-backdrop, app-info-panel, aside, .hud-coords-dev, .gta-custom-ctx-menu, .hud-ctx, .leaflet-control, .leaflet-popup, .modal, .custom-modal, button, input, select, a')) {
            return;
        }
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
                    const id = 'custom-' + Date.now() + '-' + crypto.randomUUID();
                    const name = 'Marcador ' + (this.userCustomMarkers.length + 1);
                    const customIcon = this.createPushpinIcon('red');
                    const m = L.marker(this.ctxLatLng, { icon: customIcon });
                    const world = this.latLngToWorld(this.ctxLatLng.lat, this.ctxLatLng.lng);
                    const item = { id, name, marker: m, latLng: this.ctxLatLng, color: 'red', x: world.x, y: world.y, visible: true };
                    m.on('click', () => {
                        this.targetCustomMarker = item;
                    });
                    m.on('popupopen', () => {
                        this.targetCustomMarker = item;
                        const inputEl = document.getElementById('custom-marker-input-' + item.id) as HTMLInputElement | null;
                        if (inputEl && inputEl.value !== item.name) {
                            inputEl.value = item.name;
                            inputEl.setAttribute('value', item.name);
                        }
                    });
                    m.on('popupclose', () => {
                        this.updateCustomMarkerPopup(item);
                    });
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
                    this.saveCustomMarkers();
                }
                break;
            case 'editar_marcador':
                if (this.targetCustomMarker) {
                    this.updateCustomMarkerPopup(this.targetCustomMarker);
                    this.targetCustomMarker.marker.openPopup();
                    setTimeout(() => {
                        const input = document.getElementById('custom-marker-input-' + this.targetCustomMarker?.id) as HTMLInputElement | null;
                        if (input) {
                            input.focus();
                            input.select();
                        }
                    }, 120);
                }
                break;
            case 'borrar_este_marcador':
                if (this.targetCustomMarker && this.playerMarkersLayer) {
                    this.targetCustomMarker.marker.closePopup();
                    this.map?.closePopup();
                    this.playerMarkersLayer.removeLayer(this.targetCustomMarker.marker);
                    this.userCustomMarkers = this.userCustomMarkers.filter(m => m.id !== this.targetCustomMarker!.id);
                    this.targetCustomMarker = null;
                    this.saveCustomMarkers();
                    this.cdr.detectChanges();
                }
                break;
            case 'borrar':
                if (this.playerMarkersLayer) {
                    this.playerMarkersLayer.clearLayers();
                    this.userCustomMarkers = [];
                    this.targetCustomMarker = null;
                    this.saveCustomMarkers();
                }
                break;
        }
    }

    private readonly pushpinPalettes: Record<string, { s0: string; s35: string; s85: string; s100: string; rim1: string; rim2: string }> = {
        red:    { s0: '#ff7575', s35: '#e61919', s85: '#a80707', s100: '#5a0000', rim1: '#8f0505', rim2: '#ff4444' },
        blue:   { s0: '#60a5fa', s35: '#2563eb', s85: '#1d4ed8', s100: '#1e3a8a', rim1: '#1e40af', rim2: '#60a5fa' },
        green:  { s0: '#4ade80', s35: '#16a34a', s85: '#15803d', s100: '#14532d', rim1: '#166534', rim2: '#4ade80' },
        yellow: { s0: '#fef08a', s35: '#eab308', s85: '#ca8a04', s100: '#713f12', rim1: '#854d0e', rim2: '#fde047' },
        orange: { s0: '#fdba74', s35: '#ea580c', s85: '#c2410c', s100: '#7c2d12', rim1: '#9a3412', rim2: '#fb923c' },
        purple: { s0: '#d8b4fe', s35: '#9333ea', s85: '#7e22ce', s100: '#581c87', rim1: '#6b21a8', rim2: '#c084fc' },
        white:  { s0: '#ffffff', s35: '#e2e8f0', s85: '#94a3b8', s100: '#475569', rim1: '#64748b', rim2: '#f8fafc' }
    };

    private createPushpinIcon(colorKey = 'red'): L.DivIcon {
        const pal = this.pushpinPalettes[colorKey] || this.pushpinPalettes['red'];
        const gradId = 'gtaPinHeadOnline_' + colorKey;
        const wrap = document.createElement('div');
        wrap.className = 'classic-pushpin-wrapper';

        const svgNS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(svgNS, 'svg');
        svg.setAttribute('width', '32');
        svg.setAttribute('height', '40');
        svg.setAttribute('viewBox', '0 0 32 40');
        svg.setAttribute('fill', 'none');

        const defs = document.createElementNS(svgNS, 'defs');
        const radial = document.createElementNS(svgNS, 'radialGradient');
        radial.setAttribute('id', gradId);
        radial.setAttribute('cx', '35%');
        radial.setAttribute('cy', '30%');
        radial.setAttribute('r', '65%');

        const radialStops = [
            { offset: '0%', color: pal.s0 },
            { offset: '35%', color: pal.s35 },
            { offset: '85%', color: pal.s85 },
            { offset: '100%', color: pal.s100 }
        ];
        radialStops.forEach(s => {
            const stop = document.createElementNS(svgNS, 'stop');
            stop.setAttribute('offset', s.offset);
            stop.setAttribute('stop-color', s.color);
            radial.appendChild(stop);
        });
        defs.appendChild(radial);

        const linear = document.createElementNS(svgNS, 'linearGradient');
        linear.setAttribute('id', 'gtaSteelNeedle');
        linear.setAttribute('x1', '0%');
        linear.setAttribute('y1', '0%');
        linear.setAttribute('x2', '100%');
        linear.setAttribute('y2', '0%');

        const linearStops = [
            { offset: '0%', color: '#d6dadf' },
            { offset: '45%', color: '#ffffff' },
            { offset: '75%', color: '#8c939a' },
            { offset: '100%', color: '#4d5156' }
        ];
        linearStops.forEach(s => {
            const stop = document.createElementNS(svgNS, 'stop');
            stop.setAttribute('offset', s.offset);
            stop.setAttribute('stop-color', s.color);
            linear.appendChild(stop);
        });
        defs.appendChild(linear);

        const filter = document.createElementNS(svgNS, 'filter');
        filter.setAttribute('id', 'gtaPinShadow');
        filter.setAttribute('x', '0');
        filter.setAttribute('y', '0');
        filter.setAttribute('width', '32');
        filter.setAttribute('height', '40');
        filter.setAttribute('filterUnits', 'userSpaceOnUse');
        const dropShadow = document.createElementNS(svgNS, 'feDropShadow');
        dropShadow.setAttribute('dx', '1');
        dropShadow.setAttribute('dy', '3');
        dropShadow.setAttribute('stdDeviation', '1.8');
        dropShadow.setAttribute('flood-color', '#000000');
        dropShadow.setAttribute('flood-opacity', '0.65');
        filter.appendChild(dropShadow);
        defs.appendChild(filter);
        svg.appendChild(defs);

        const g = document.createElementNS(svgNS, 'g');
        g.setAttribute('filter', 'url(#gtaPinShadow)');

        const polygon = document.createElementNS(svgNS, 'polygon');
        polygon.setAttribute('points', '14.8,20 17.2,20 16.3,38 15.7,38');
        polygon.setAttribute('fill', 'url(#gtaSteelNeedle)');
        g.appendChild(polygon);

        const line = document.createElementNS(svgNS, 'line');
        line.setAttribute('x1', '16');
        line.setAttribute('y1', '20');
        line.setAttribute('x2', '16');
        line.setAttribute('y2', '38');
        line.setAttribute('stroke', '#ffffff');
        line.setAttribute('stroke-width', '0.6');
        line.setAttribute('opacity', '0.9');
        g.appendChild(line);

        const path = document.createElementNS(svgNS, 'path');
        path.setAttribute('d', 'M10.5,20 C10.5,15.5 12.5,13.5 16,13.5 C19.5,13.5 21.5,15.5 21.5,20 Z');
        path.setAttribute('fill', `url(#${gradId})`);
        g.appendChild(path);

        const el1 = document.createElementNS(svgNS, 'ellipse');
        el1.setAttribute('cx', '16');
        el1.setAttribute('cy', '13.5');
        el1.setAttribute('rx', '7.2');
        el1.setAttribute('ry', '2.2');
        el1.setAttribute('fill', pal.rim1);
        g.appendChild(el1);

        const el2 = document.createElementNS(svgNS, 'ellipse');
        el2.setAttribute('cx', '16');
        el2.setAttribute('cy', '12.8');
        el2.setAttribute('rx', '6.9');
        el2.setAttribute('ry', '1.9');
        el2.setAttribute('fill', pal.rim2);
        g.appendChild(el2);

        const el3 = document.createElementNS(svgNS, 'ellipse');
        el3.setAttribute('cx', '16');
        el3.setAttribute('cy', '7.5');
        el3.setAttribute('rx', '7.8');
        el3.setAttribute('ry', '6.8');
        el3.setAttribute('fill', `url(#${gradId})`);
        g.appendChild(el3);

        const el4 = document.createElementNS(svgNS, 'ellipse');
        el4.setAttribute('cx', '13.5');
        el4.setAttribute('cy', '5.2');
        el4.setAttribute('rx', '3.2');
        el4.setAttribute('ry', '1.9');
        el4.setAttribute('fill', '#ffffff');
        el4.setAttribute('opacity', '0.8');
        el4.setAttribute('transform', 'rotate(-18 13.5 5.2)');
        g.appendChild(el4);

        svg.appendChild(g);
        wrap.appendChild(svg);

        return L.divIcon({
            className: 'gta-classic-pushpin-icon',
            html: wrap,
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
            }).catch(err => console.error('[Online] Error al copiar coordenadas al portapapeles:', err));
        }
    }

    saveCustomMarkers(): void {
        if (typeof localStorage === 'undefined') return;
        const serializable = this.userCustomMarkers.map(m => {
            const world = (m.x !== undefined && m.y !== undefined)
                ? { x: m.x, y: m.y }
                : this.latLngToWorld(m.latLng.lat, m.latLng.lng);
            return {
                id: m.id,
                name: m.name,
                color: m.color || 'red',
                x: world.x,
                y: world.y,
                visible: m.visible !== false
            };
        });
        const key = this.selectedCity === 'cp' ? 'gta5_custom_markers_online_cp' : 'gta5_custom_markers_online_ls';
        localStorage.setItem(key, JSON.stringify(serializable));
    }

    loadCustomMarkers(): void {
        if (typeof localStorage === 'undefined' || !this.playerMarkersLayer) return;
        this.playerMarkersLayer.clearLayers();
        this.userCustomMarkers = [];
        try {
            const isCp = this.selectedCity === 'cp';
            const primaryKey = isCp ? 'gta5_custom_markers_online_cp' : 'gta5_custom_markers_online_ls';
            let saved = localStorage.getItem(primaryKey);
            if (!saved) {
                saved = isCp ? localStorage.getItem('gta5_custom_markers_cp') : localStorage.getItem('gta5_custom_markers_ls');
            }
            if (!saved) return;
            const parsed = JSON.parse(saved);
            if (!Array.isArray(parsed)) return;

            for (const item of parsed) {
                let wx: number;
                let wy: number;
                if (typeof item.x === 'number' && typeof item.y === 'number' && !Number.isNaN(item.x) && !Number.isNaN(item.y)) {
                    wx = item.x;
                    wy = item.y;
                } else if (typeof item.lat === 'number' && typeof item.lng === 'number' && !Number.isNaN(item.lat) && !Number.isNaN(item.lng)) {
                    const derived = this.latLngToWorld(item.lat, item.lng);
                    wx = derived.x;
                    wy = derived.y;
                } else {
                    continue;
                }

                const [lat, lng] = this.worldToLatLng(wx, wy);
                const latLng = L.latLng(lat, lng);
                const color = item.color || 'red';
                const isVisible = item.visible !== false;
                const m = L.marker(latLng, { icon: this.createPushpinIcon(color) });
                const markerObj = {
                    id: item.id || ('custom-' + Date.now() + '-' + crypto.randomUUID()),
                    name: item.name || 'Marcador',
                    marker: m,
                    latLng: latLng,
                    color: color,
                    x: wx,
                    y: wy,
                    visible: isVisible
                };
                m.on('click', () => {
                    this.targetCustomMarker = markerObj;
                });
                m.on('popupopen', () => {
                    this.targetCustomMarker = markerObj;
                    const inputEl = document.getElementById('custom-marker-input-' + markerObj.id) as HTMLInputElement | null;
                    if (inputEl && inputEl.value !== markerObj.name) {
                        inputEl.value = markerObj.name;
                        inputEl.setAttribute('value', markerObj.name);
                    }
                });
                m.on('popupclose', () => {
                    this.updateCustomMarkerPopup(markerObj);
                });
                m.on('contextmenu', (e: L.LeafletMouseEvent) => {
                    L.DomEvent.stopPropagation(e);
                    this.targetCustomMarker = markerObj;
                    this.isMarkerContext = true;
                    this.ctxX = e.originalEvent.clientX;
                    this.ctxY = e.originalEvent.clientY;
                    this.ctxOpen = true;
                });
                this.updateCustomMarkerPopup(markerObj);
                if (isVisible) {
                    m.addTo(this.playerMarkersLayer);
                }
                this.userCustomMarkers.push(markerObj);
            }
        } catch {
            // Ignorar errores de lectura de localStorage
        }
    }

    private _locatingMarkerHandler: (() => void) | null = null;

    toggleCustomMarker(cm: { id: string; name: string; marker: L.Marker; latLng: L.LatLng; color?: string; x?: number; y?: number; visible?: boolean }): void {
        if (!this.playerMarkersLayer || !cm) return;
        const isCurrentlyVisible = cm.visible !== false;
        if (isCurrentlyVisible) {
            this.playerMarkersLayer.removeLayer(cm.marker);
            cm.visible = false;
        } else {
            cm.marker.addTo(this.playerMarkersLayer);
            cm.visible = true;
        }
        this.saveCustomMarkers();
    }

    deleteAllCustomMarkers(): void {
        if (!this.playerMarkersLayer || this.userCustomMarkers.length === 0) return;
        this.playerMarkersLayer.clearLayers();
        this.userCustomMarkers = [];
        this.targetCustomMarker = null;
        this.saveCustomMarkers();
    }

    focusCustomMarker(cm: { id: string; name: string; marker: L.Marker; latLng: L.LatLng; color?: string; x?: number; y?: number; visible?: boolean }): void {
        if (!this.map || !cm) return;
        if (cm.visible === false && this.playerMarkersLayer) {
            cm.marker.addTo(this.playerMarkersLayer);
            cm.visible = true;
            this.saveCustomMarkers();
        }
        const targetZoom = Math.max(this.map.getZoom(), 4.5);
        if (this._locatingMarkerHandler) {
            this.map.off('moveend', this._locatingMarkerHandler);
            this._locatingMarkerHandler = null;
        }
        this.updateCustomMarkerPopup(cm);
        const currentCenter = this.map.getCenter();
        const currentZoom = this.map.getZoom();
        const isAlreadyThere = Math.abs(currentCenter.lat - cm.latLng.lat) < 0.0005 &&
                               Math.abs(currentCenter.lng - cm.latLng.lng) < 0.0005 &&
                               Math.abs(currentZoom - targetZoom) < 0.2;
        if (isAlreadyThere) {
            cm.marker.openPopup();
            return;
        }
        this._locatingMarkerHandler = () => {
            this._locatingMarkerHandler = null;
            cm.marker.openPopup();
        };
        this.map.once('moveend', this._locatingMarkerHandler);
        this.map.flyTo(cm.latLng, targetZoom, { animate: true, duration: 0.6 });
    }

    private buildCustomMarkerPopupHtml(item: { id: string; name: string; marker: L.Marker; latLng: L.LatLng; color?: string; x?: number; y?: number }): HTMLElement {
        const deleteLbl = this.translationService.t('gta5.popups.delete');
        const activeColor = item.color || 'red';

        const colors = [
            { key: 'red', hex: '#e61919', title: 'Rojo' },
            { key: 'blue', hex: '#2563eb', title: 'Azul' },
            { key: 'green', hex: '#16a34a', title: 'Verde' },
            { key: 'yellow', hex: '#eab308', title: 'Amarillo' },
            { key: 'orange', hex: '#ea580c', title: 'Naranja' },
            { key: 'purple', hex: '#9333ea', title: 'Morado' },
            { key: 'white', hex: '#f8fafc', title: 'Blanco' }
        ];

        const activeColorObj = colors.find(c => c.key === activeColor) || colors[0];
        const markerCoords = (item.x !== undefined && item.y !== undefined)
            ? { x: item.x, y: item.y }
            : this.latLngToWorld(item.latLng.lat, item.latLng.lng);

        const card = document.createElement('div');
        card.className = 'custom-marker-popup-card';
        card.style.borderTop = `2px solid ${activeColorObj.hex}`;
        card.style.borderRadius = '8px';

        const titleRow = document.createElement('div');
        titleRow.className = 'custom-marker-title-row';
        titleRow.style.cssText = 'display: flex; justify-content: center; text-align: center; margin: 0 16px 4px 16px;';

        const input = document.createElement('input');
        input.type = 'text';
        input.id = `custom-marker-input-${item.id}`;
        input.setAttribute('data-marker-id', item.id);
        input.className = 'custom-marker-name custom-marker-name-input custom-pin-name-input';
        input.value = item.name;
        input.maxLength = 45;
        input.placeholder = this.translationService.currentLang === 'es' ? 'Nombre del marcador' : 'Marker name';
        input.title = this.translationService.currentLang === 'es' ? 'Escribe para renombrar' : 'Type to rename';
        input.style.cssText = 'margin: 0; outline: none; padding: 3px 6px; font-size: 11.5px; font-weight: 700; border-radius: 4px; border: 1px dashed rgba(255,255,255,0.25); background: rgba(0,0,0,0.35); color: #ffffff; text-align: center; width: 100%; box-sizing: border-box; font-family: inherit; transition: all 0.15s ease;';
        input.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                input.blur();
            }
        });
        titleRow.appendChild(input);
        card.appendChild(titleRow);

        const swatchesContainer = document.createElement('div');
        swatchesContainer.style.cssText = 'display: flex; align-items: center; justify-content: center; gap: 5px; margin: 4px 0 5px 0; padding: 3px 6px; background: rgba(0,0,0,0.45); border-radius: 8px; border: 1px solid rgba(255,255,255,0.08);';

        colors.forEach(c => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'btn-pin-color';
            btn.setAttribute('data-marker-id', item.id);
            btn.setAttribute('data-color', c.key);
            btn.title = c.title;
            const isActive = c.key === activeColor;
            btn.style.width = '13px';
            btn.style.height = '13px';
            btn.style.borderRadius = '50%';
            btn.style.background = c.hex;
            btn.style.border = isActive ? '1.5px solid #ffffff' : '1.5px solid rgba(255,255,255,0.25)';
            btn.style.cursor = 'pointer';
            btn.style.boxShadow = isActive ? '0 0 6px #ffffff' : '0 1px 3px rgba(0,0,0,0.5)';
            btn.style.transform = isActive ? 'scale(1.2)' : 'scale(1)';
            btn.style.transition = 'all 0.15s ease';
            btn.style.padding = '0';
            swatchesContainer.appendChild(btn);
        });
        card.appendChild(swatchesContainer);

        const divider = document.createElement('div');
        divider.className = 'custom-marker-spike-divider';
        divider.style.cssText = 'width: 100%; height: 1px; margin: 6px 0 5px 0; background: linear-gradient(90deg, transparent 0%, rgba(255, 184, 51, 0.25) 25%, #ffb833 50%, rgba(255, 184, 51, 0.25) 75%, transparent 100%); box-shadow: 0 0 4px rgba(255, 184, 51, 0.35);';
        card.appendChild(divider);

        const coordsDiv = document.createElement('div');
        coordsDiv.className = 'custom-marker-coords';
        coordsDiv.style.cssText = 'text-align: center; font-size: 9.5px; font-family: monospace; color: rgba(255,255,255,0.75); margin: 3px 0 6px 0; letter-spacing: 0.3px; user-select: all;';
        coordsDiv.title = this.translationService.t('gta5.popups.coordinates');
        coordsDiv.textContent = `X: ${markerCoords.x.toFixed(1)} | Y: ${markerCoords.y.toFixed(1)}`;
        card.appendChild(coordsDiv);

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'custom-marker-actions';
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'btn-marker-action btn-marker-delete btn-pin-delete';
        deleteBtn.setAttribute('data-marker-id', item.id);
        deleteBtn.style.cssText = 'width: 100%; padding: 4px 6px; font-size: 10px; cursor: pointer;';
        const trashSpan = document.createElement('span');
        trashSpan.textContent = '🗑️';
        deleteBtn.appendChild(trashSpan);
        deleteBtn.appendChild(document.createTextNode(` ${deleteLbl}`));
        L.DomEvent.disableClickPropagation(deleteBtn);
        deleteBtn.onclick = (ev: MouseEvent) => {
            ev.stopPropagation();
            ev.preventDefault();
            this.onDeleteCustomMarker(item.id);
        };
        actionsDiv.appendChild(deleteBtn);
        card.appendChild(actionsDiv);

        return card;
    }

    private updateCustomMarkerPopup(item: { id: string; name: string; marker: L.Marker; latLng: L.LatLng; color?: string; x?: number; y?: number }): void {
        const activeColor = item.color || 'red';
        const contentEl = this.buildCustomMarkerPopupHtml(item);
        const existingPopup = item.marker.getPopup();
        if (existingPopup) {
            existingPopup.setContent(contentEl);
            existingPopup.options.autoPan = false;
            existingPopup.options.className = `gta-custom-pin-popup gta-pin-color-${activeColor}`;
            const container = existingPopup.getElement();
            if (container) {
                container.className = container.className
                    .replace(/gta-pin-color-\w+/g, '')
                    .trim() + ` gta-pin-color-${activeColor}`;
            }
        } else {
            item.marker.bindPopup(contentEl, { className: `gta-custom-pin-popup gta-pin-color-${activeColor}`, maxWidth: 190, minWidth: 140, autoPan: false });
        }

        const tooltipBold = document.createElement('b');
        tooltipBold.textContent = item.name;

        if (item.marker.getTooltip()) {
            item.marker.setTooltipContent(tooltipBold);
        } else {
            item.marker.bindTooltip(tooltipBold, {
                direction: 'top',
                offset: [0, -32],
                className: 'gta-leaflet-tooltip'
            });
        }
    }

    private bindCustomMarkerEvents(): void {
        if (!this.map) return;
        this.map.on('popupopen', (e: L.PopupEvent) => {
            const container = e.popup.getElement();
            if (!container) return;

            // Manejador: Selección de color de la chincheta
            const colorButtons = container.querySelectorAll<HTMLButtonElement>('.btn-pin-color');
            colorButtons.forEach(btn => {
                btn.onclick = () => {
                    const id = btn.getAttribute('data-marker-id');
                    const color = btn.getAttribute('data-color');
                    if (id && color) this.onSetCustomMarkerColor(id, color);
                };
            });

            // Manejador: Renombrar chincheta en tiempo real
            const nameInput = container.querySelector<HTMLInputElement>('.custom-pin-name-input');
            if (nameInput) {
                const id = nameInput.getAttribute('data-marker-id');
                if (id) {
                    nameInput.oninput = () => this.onSaveCustomMarkerName(id, nameInput.value);
                    nameInput.onchange = () => this.onSaveCustomMarkerName(id, nameInput.value);
                }
            }

            // Manejador: Eliminar chincheta
            const delBtn = container.querySelector<HTMLButtonElement>('.btn-pin-delete');
            if (delBtn) {
                delBtn.onclick = () => {
                    const id = delBtn.getAttribute('data-marker-id');
                    if (id) this.onDeleteCustomMarker(id);
                };
            }
        });
    }

    private onSetCustomMarkerColor(id: string, color: string): void {
        const found = this.userCustomMarkers.find(m => m.id === id);
        if (found) {
            const inputEl = document.getElementById('custom-marker-input-' + id) as HTMLInputElement | null;
            if (inputEl && inputEl.value.trim()) {
                found.name = inputEl.value.trim();
            }
            found.color = color;
            found.marker.setIcon(this.createPushpinIcon(color));
            this.updateCustomMarkerPopup(found);
            found.marker.openPopup();
            this.saveCustomMarkers();
            this.cdr.detectChanges();
        }
    }

    private onSaveCustomMarkerName(id: string, newName: string): void {
        const found = this.userCustomMarkers.find(m => m.id === id);
        if (found) {
            const trimmed = (newName || '').trim();
            found.name = trimmed || (this.translationService.currentLang === 'es' ? 'Marcador' : 'Marker');
            if (this.targetCustomMarker?.id === id) {
                this.targetCustomMarker.name = found.name;
            }
            if (found.marker.getTooltip()) {
                const tooltipBold = document.createElement('b');
                tooltipBold.textContent = found.name;
                found.marker.setTooltipContent(tooltipBold);
            }
            const existingPopup = found.marker.getPopup();
            if (existingPopup) {
                existingPopup.setContent(this.buildCustomMarkerPopupHtml(found));
            }
            const inputEl = document.getElementById('custom-marker-input-' + id) as HTMLInputElement | null;
            if (inputEl) {
                inputEl.setAttribute('value', found.name);
            }
            this.saveCustomMarkers();
            this.cdr.detectChanges();
        }
    }

    private onDeleteCustomMarker(id: string): void {
        const found = this.userCustomMarkers.find(m => m.id === id);
        if (found && this.playerMarkersLayer) {
            found.marker.closePopup();
            this.map?.closePopup();
            this.playerMarkersLayer.removeLayer(found.marker);
            this.userCustomMarkers = this.userCustomMarkers.filter(m => m.id !== id);
            if (this.targetCustomMarker?.id === id) {
                this.targetCustomMarker = null;
            }
            this.saveCustomMarkers();
            this.cdr.detectChanges();
        }
    }

    ngAfterViewInit(): void {
        this.initMap(this.currentMapType);
        this.onFullscreenChange();
        setTimeout(() => {
            if (this.map) {
                this.map.invalidateSize();
            }
        }, 150);
        window.addEventListener('resize', this.onWindowResize);
    }

    async toggleFullscreen(): Promise<void> {
        const element = this.getFullscreenHost();

        try {
            if (document.fullscreenElement) {
                await document.exitFullscreen();
            } else if (element.requestFullscreen) {
                await element.requestFullscreen();
            }
        } catch {
            this.isFullscreen = false;
        }
    }

    exitFullscreen(): void {
        if (document.fullscreenElement) {
            void document.exitFullscreen();
        }
    }

    onFullscreenChange(): void {
        this.isFullscreen = document.fullscreenElement === this.getFullscreenHost();
        setTimeout(() => this.map?.invalidateSize(), 0);
    }

    @HostListener('document:fullscreenchange')
    private handleDocumentFullscreenChange(): void {
        this.onFullscreenChange();
    }

    private getFullscreenHost(): HTMLElement {
        return document.querySelector<HTMLElement>('.app-shell') ?? this.mapWrapper.nativeElement;
    }

    ngOnDestroy(): void {
        this.propertiesSub?.unsubscribe();
        this.collectiblesSub?.unsubscribe();
        this.cayoSub?.unsubscribe();
        window.removeEventListener('resize', this.onWindowResize);
        if (this.clockInterval) {
            clearInterval(this.clockInterval);
        }
        if (this.map) {
            this.map.remove();
        }
    }

    private readonly onWindowResize = () => {
        if (this.map) {
            this.map.invalidateSize();
            if (this.selectedCity === 'cp') {
                const minZoom = this.computeCayoMinZoom();
                this.map.setMinZoom(minZoom);
                if (this.map.getZoom() < minZoom) {
                    this.map.setZoom(minZoom);
                }
            } else if (this.currentMapType === 'Satellite') {
                const minZoom = this.computeHdMinZoom();
                this.map.setMinZoom(minZoom);
                if (this.map.getZoom() < minZoom) {
                    this.map.setZoom(minZoom);
                }
            } else {
                this.map.setMinZoom(this.computeMinZoom(this.imageSize));
            }
            this.renderDistrictLabels();
        }
    };

    private computeCayoMinZoom(): number {
        const el = document.getElementById('gta-map');
        const height = el ? el.clientHeight : 0;
        const width = el ? el.clientWidth : 0;
        if (height <= 0 || width <= 0) return 1.6;
        // Cayo Perico mide 148 de alto por 155 de ancho en proyección con tileSize 256
        const zoomH = Math.log2((height * 0.88) / 148);
        const zoomW = Math.log2((width * 0.88) / 155);
        const targetZoom = Math.min(zoomH, zoomW);
        return Math.max(1.2, Math.min(7, Math.round(targetZoom * 10) / 10));
    }

    private computeHdMinZoom(): number {
        const el = document.getElementById('gta-map');
        const height = el ? el.clientHeight : 0;
        const width = el ? el.clientWidth : 0;
        if (height <= 0 || width <= 0) return 2.0;
        // La isla mide 192 unidades de alto y 128 de ancho en proyección HD con tileSize 256
        const zoomH = Math.log2((height * 0.88) / 192);
        const zoomW = Math.log2((width * 0.88) / 128);
        const targetZoom = Math.min(zoomH, zoomW);
        return Math.max(1.2, Math.min(this.maxZoom, Math.round(targetZoom * 10) / 10));
    }

    private computeMinZoom(_imageSize: number): number {
        const el = document.getElementById('gta-map');
        const height = el ? el.clientHeight : 0;
        const width = el ? el.clientWidth : 0;
        if (height <= 0 || width <= 0) return 3.5;
        // La isla de San Andreas mide 56.5 unidades de alto x ~40 de ancho.
        const zoomH = Math.log2((height * 0.88) / 56.5);
        const zoomW = Math.log2((width * 0.88) / 40);
        const targetZoom = Math.min(zoomH, zoomW);
        return Math.max(2.0, Math.min(this.maxZoom, Math.round(targetZoom * 10) / 10));
    }

    private initMap(mapType: string): void {
        if (this.map) {
            this.map.remove();
        }

        const mapContainer = document.getElementById('gta-map');

        if (this.selectedCity === 'cp') {
            let layerSlug = 'render_island_heist';
            // Tonos RGB exactos muestreados píxel a píxel del borde de las teselas de Rockstar
            let oceanColor = '#0D2B4F'; // render_island_heist: RGB(13, 43, 79)
            if (mapType === 'Roadmap' || mapType === 'Atlas') {
                layerSlug = 'print_island_heist';
                oceanColor = '#4EB1D0'; // print_island_heist: RGB(78, 177, 208)
            } else if (mapType === 'Juego') {
                layerSlug = 'game_island_heist';
                oceanColor = '#384950'; // game_island_heist: RGB(56, 73, 80)
            }

            if (mapContainer) {
                mapContainer.style.backgroundColor = oceanColor;
            }

            const cayoMinZoom = this.computeCayoMinZoom();
            const cayoBounds = L.latLngBounds([[-148, 0], [0, 155]]);
            const cayoMaxBounds = L.latLngBounds([[-200, -50], [50, 205]]);
            this.map = L.map('gta-map', {
                crs: L.CRS.Simple,
                minZoom: cayoMinZoom,
                maxZoom: 7,
                zoom: cayoMinZoom,
                zoomSnap: 0.1,
                center: [-74, 77.5],
                maxBounds: cayoMaxBounds,
                maxBoundsViscosity: 0.85,
                zoomControl: false,
                attributionControl: false
            });

            // Mapa oficial de Rockstar Games Social Club (256x256 px, zooms 0-6 nativos) descargado localmente
            const tileUrl = `assets/mapas/gta5/tiles/cayo_perico/${layerSlug}/{z}/{x}/{y}.jpg`;

            const tileLayer = L.tileLayer(tileUrl, {
                tileSize: 256,
                minZoom: 0,
                maxNativeZoom: 6,
                maxZoom: 7,
                noWrap: true,
                bounds: cayoBounds
            });
            tileLayer.addTo(this.map);

            this.playerMarkersLayer = L.layerGroup().addTo(this.map);

            this.loadCayoPerico();
        } else if (mapType === 'Satellite') {
            const lsOceanColor = '#0D2B4F'; // SatelliteHD: RGB(13, 43, 79) color del océano HD
            if (mapContainer) {
                mapContainer.style.backgroundColor = lsOceanColor;
            }
            const mapBounds = L.latLngBounds([[-192, 0], [0, 128]]);
            const maxBounds = L.latLngBounds([[-230, -25], [25, 155]]);
            const hdMinZoom = this.computeHdMinZoom();
            const isNarrow = typeof window !== 'undefined' && window.innerWidth <= 850;
            const initialZoom = isNarrow ? hdMinZoom : 2.5;

            this.map = L.map('gta-map', {
                crs: L.CRS.Simple,
                minZoom: hdMinZoom,
                maxZoom: this.maxZoom,
                zoom: initialZoom,
                zoomSnap: 0.1,
                center: [-96, 59],
                maxBounds: maxBounds,
                maxBoundsViscosity: 0.85,
                zoomControl: false,
                attributionControl: false
            });

            // Mapa oficial de Rockstar Games Social Club en Ultra Alta Resolución (256x256 px, zooms 0-7)
            // 100% Local: cargado desde assets/mapas/gta5/SatelliteHD/ sin dependencias externas
            const tileUrl = 'assets/mapas/gta5/SatelliteHD/{z}_{x}_{y}.jpg';
            const tileLayer = L.tileLayer(tileUrl, {
                tileSize: 256,
                minZoom: 0,
                maxNativeZoom: 7,
                maxZoom: this.maxZoom,
                noWrap: true,
                bounds: mapBounds
            });
            tileLayer.addTo(this.map);

            this.playerMarkersLayer = L.layerGroup().addTo(this.map);

            this.loadProperties();
            this.loadCollectibles();
        } else {
            // Tonos RGB exactos muestreados píxel a píxel del océano de Los Santos
            let lsOceanColor = '#143D6B'; // Satellite: RGB(20, 61, 107)
            if (mapType === 'Roadmap') {
                lsOceanColor = '#1862AD'; // Roadmap: RGB(24, 98, 173)
            } else if (mapType === 'Atlas') {
                lsOceanColor = '#16A9D2'; // Atlas: RGB(22, 169, 210)
            } else if (mapType === 'Juego') {
                lsOceanColor = '#434343'; // Radar en escala de grises: RGB(67, 67, 67)
            } else if (mapType === 'UV' || mapType === 'UV2') {
                lsOceanColor = '#05080c';
            }

            if (mapContainer) {
                mapContainer.style.backgroundColor = lsOceanColor;
            }
            const mapBounds = L.latLngBounds([[-90, -25], [26, 89]]);
            const minZoom = this.computeMinZoom(this.imageSize);

            this.map = L.map('gta-map', {
                crs: L.CRS.Simple,
                minZoom,
                maxZoom: this.maxZoom,
                zoom: minZoom,
                zoomSnap: 0.1,
                center: [-33, 29.5],
                maxBounds: mapBounds,
                maxBoundsViscosity: 0.85,
                zoomControl: false,
                attributionControl: false
            });

            let tileUrl: string;
            let tileClass = '';

            if (mapType === 'UV' || mapType === 'UV2') {
                tileUrl = 'assets/mapas/gta5/tiles/uv/{z}/{x}/{y}.jpg';
                if (mapType === 'UV2') {
                    tileClass = 'leaflet-tile-uv2';
                }
            } else if (mapType === 'Juego') {
                tileUrl = `assets/mapas/gta5/Roadmap/{z}_{x}_{y}.jpg`;
                tileClass = 'leaflet-tile-juego';
            } else {
                tileUrl = `assets/mapas/gta5/${mapType}/{z}_{x}_{y}.jpg`;
            }

            const tileLayer = L.tileLayer(tileUrl, {
                tileSize: 256,
                minZoom: 0,
                maxNativeZoom: 7,
                maxZoom: this.maxZoom,
                errorTileUrl: undefined,
                noWrap: true,
                className: tileClass
            });
            tileLayer.addTo(this.map);

            this.playerMarkersLayer = L.layerGroup().addTo(this.map);

            this.loadProperties();
            this.loadCollectibles();
        }

        this.renderDistrictLabels();
        this.updateIconStyle();
        this.loadCustomMarkers();
        this.bindCustomMarkerEvents();

        this.map.on('mousemove', (e: L.LeafletMouseEvent) => {
            this.mouseCoords = this.latLngToWorld(e.latlng.lat, e.latlng.lng);
        });
    }

    private districtLabelsLayer: L.LayerGroup | null = null;
    private readonly districts = [
        { name: 'Los Santos', x: 0, y: -1000, size: 18, isMajor: true },
        { name: 'Blaine County', x: 800, y: 4000, size: 19, isMajor: true },
        { name: 'Vinewood Hills', x: 0, y: 700, size: 13, isMajor: false },
        { name: 'Downtown Los Santos', x: 100, y: -200, size: 14, isMajor: true },
        { name: 'Vespucci Beach', x: -1100, y: -1300, size: 13, isMajor: false },
        { name: 'Los Santos Intl Airport', x: -1000, y: -2700, size: 12, isMajor: false },
        { name: 'Del Perro', x: -1400, y: -600, size: 13, isMajor: false },
        { name: 'Davis', x: 100, y: -1700, size: 12, isMajor: false },
        { name: 'Sandy Shores', x: 1700, y: 3600, size: 15, isMajor: true },
        { name: 'Grapeseed', x: 2300, y: 4800, size: 13, isMajor: false },
        { name: 'Paleto Bay', x: -300, y: 6200, size: 15, isMajor: true },
        { name: 'Monte Chiliad', x: 400, y: 5500, size: 14, isMajor: true },
        { name: 'Chumash', x: -3100, y: 1100, size: 13, isMajor: false },
        { name: 'Fort Zancudo', x: -2100, y: 3000, size: 13, isMajor: false },
        { name: 'Great Chaparral', x: -300, y: 1500, size: 13, isMajor: false },
        { name: 'Harmony', x: 600, y: 2700, size: 13, isMajor: false },
        { name: 'El Burro Heights', x: 1400, y: -1800, size: 12, isMajor: false },
        { name: 'Puerto de Los Santos', x: 500, y: -2600, size: 12, isMajor: false },
        { name: 'Palomino Highlands', x: 2700, y: -1200, size: 13, isMajor: false }
    ];

    private renderDistrictLabels(): void {
        if (!this.map) return;
        if (!this.districtLabelsLayer) {
            this.districtLabelsLayer = L.layerGroup().addTo(this.map);
        }
        this.districtLabelsLayer.clearLayers();

        const isNarrow = typeof window !== 'undefined' && window.innerWidth <= 850;
        const scale = isNarrow ? 0.62 : 1.0;
        const letterSpacing = isNarrow ? '1.5px' : '3px';

        this.districts.forEach(d => {
            const [lat, lng] = this.worldToLatLng(d.x, d.y);
            const calculatedSize = Math.max(8, Math.round((d.size + 1) * scale));
            const labelEl = document.createElement('div');
            labelEl.className = `gta-district-label-text ${d.isMajor ? 'is-major' : 'is-minor'}`;
            labelEl.style.color = 'rgba(255, 255, 255, 0.92)';
            labelEl.style.fontFamily = "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
            labelEl.style.fontSize = `${calculatedSize}px`;
            labelEl.style.fontWeight = '700';
            labelEl.style.textTransform = 'uppercase';
            labelEl.style.letterSpacing = letterSpacing;
            labelEl.style.textShadow = '0 2px 8px rgba(0, 0, 0, 0.95), 0 0 12px rgba(0, 0, 0, 0.8)';
            labelEl.style.whiteSpace = 'nowrap';
            labelEl.style.pointerEvents = 'none';
            labelEl.style.userSelect = 'none';
            labelEl.style.textAlign = 'center';
            labelEl.textContent = d.name;

            const icon = L.divIcon({
                className: 'gta-district-label-pin',
                html: labelEl,
                iconSize: [260, 30],
                iconAnchor: [130, 15]
            });

            const marker = L.marker([lat, lng], { icon, interactive: false });
            this.districtLabelsLayer?.addLayer(marker);
        });
    }

    /**
     * Convierte coordenadas in-game del mundo de GTA (X, Y) a coordenadas Leaflet [lat, lng].
     * Soporta tanto Cayo Perico como Los Santos (incluyendo la escala HD de satélite).
     */
    worldToLatLng(x: number, y: number): [number, number] {
        return gta5WorldToLatLng(x, y, {
            mapType: this.currentMapType,
            selectedCity: this.selectedCity
        });
    }

    /**
     * Convierte coordenadas de Leaflet [lat, lng] a coordenadas cartesianas del mundo de GTA V (X, Y).
     * Se usa en la telemetría en tiempo real al mover el ratón sobre el mapa.
     */
    latLngToWorld(lat: number, lng: number): { x: number; y: number } {
        return gta5LatLngToWorld(lat, lng, {
            mapType: this.currentMapType,
            selectedCity: this.selectedCity
        });
    }

    switchCity(city: 'ls' | 'cp'): void {
        if (this.selectedCity === city) return;
        this.saveCustomMarkers();
        this.selectedCity = city;
        if (this.selectedCity === 'cp') {
            if (this.currentMapType === 'Atlas') {
                this.currentMapType = 'Satellite';
            }
        }
        this.initMap(this.currentMapType);
    }

    toggleCity(): void {
        this.switchCity(this.selectedCity === 'ls' ? 'cp' : 'ls');
    }

    /**
     * Carga las ubicaciones, armas, vehículos y puntos de reconocimiento de Cayo Perico.
     */
    private loadCayoPerico(): void {
        this.cayoSub?.unsubscribe();
        this.cayoSub = this.locationService.getCayoPericoLocations().subscribe({
            next: (locations) => {
                this.cayoPericoLocations = locations;
                locations.forEach(loc => {
                    if (this.layerFilters[loc.category] === undefined) {
                        this.layerFilters[loc.category] = false;
                    }
                });
                this.renderCayoPericoMarkers();
            },
            error: (err) => console.error('Error al cargar Cayo Perico:', err)
        });
    }

    private renderCayoPericoMarkers(): void {
        const map = this.map;
        if (!map || this.selectedCity !== 'cp') return;

        this.cayoPericoMarkers.forEach(m => m.marker.remove());
        this.cayoPericoMarkers = [];

        const cayoFaIcons: Record<string, string> = {
            escape_points: 'plane-departure',
            infiltration_points: 'plane-arrival',
            cutting_powder: 'flask',
            water_tower: 'droplet',
            grappling_eq: 'anchor',
            bolt_cutters: 'scissors',
            control_tower: 'tower-broadcast',
            power_station: 'bolt',
            secondary_targets: 'sack-dollar',
            guard_clothing: 'shirt',
            supply_truck: 'truck',
            compound_entry_points: 'door-open',
            combat_shotgun: 'crosshairs',
            perico_pistol: 'gun',
            treasure_chests: 'box-archive',
            buried_stashes: 'gem',
            spawns_forklift: 'truck-ramp-box',
            spawns_verus: 'car',
            spawns_manchez_scout: 'motorcycle',
            spawns_winky: 'truck-pickup',
            spawns_squaddie: 'van-shuttle',
            spawns_dinghy: 'ship',
            spawns_weaponized_dinghy: 'shield-halved'
        };

        this.cayoPericoLocations.forEach(loc => {
            if (this.layerFilters[loc.category] === false) return;

            const [lat, lng] = this.worldToLatLng(loc.position.x, loc.position.y);

            const badgeColor = loc.badge?.color || '#f97316';
            const badgeSymbol = loc.badge?.symbol || '•';

            const pinEl = document.createElement('div');
            let pinClass: string;
            let pinIconSize: [number, number];
            let pinIconAnchor: [number, number];
            let pinPopupAnchor: [number, number];

            if (this.iconTheme === 'standard') {
                pinEl.className = 'gta-pin-standard-empty';
                pinClass = 'gta-pin-wrapper-empty';
                pinIconSize = [0, 0];
                pinIconAnchor = [0, 0];
                pinPopupAnchor = [0, 0];
            } else if (this.iconTheme === 'simple') {
                const faIcon = cayoFaIcons[loc.category] || loc.badge?.icon || 'location-dot';
                pinEl.style.color = badgeColor;
                pinEl.style.fontSize = '20px';
                pinEl.style.filter = 'drop-shadow(0px 2px 3px rgba(0,0,0,0.9))';
                pinEl.style.textAlign = 'center';
                pinEl.style.lineHeight = '1';
                const iconTag = document.createElement('i');
                iconTag.className = `fa-solid fa-${faIcon}`;
                pinEl.appendChild(iconTag);
                pinClass = 'gta-pin-wrapper-fa';
                pinIconSize = [20, 20];
                pinIconAnchor = [10, 10];
                pinPopupAnchor = [0, -10];
            } else {
                pinEl.className = `gta-pin gta-pin-${loc.category}`;
                pinEl.style.setProperty('--pin-color', badgeColor);
                pinEl.style.borderColor = badgeColor;
                const symSpan = document.createElement('span');
                symSpan.className = 'gta-pin-symbol';
                symSpan.style.color = badgeColor;
                symSpan.style.fontWeight = '800';
                symSpan.textContent = badgeSymbol;
                pinEl.appendChild(symSpan);
                pinClass = 'gta-pin-wrapper';
                pinIconSize = [22, 22];
                pinIconAnchor = [11, 22];
                pinPopupAnchor = [0, -20];
            }

            const icon = L.divIcon({
                className: pinClass,
                html: pinEl,
                iconSize: pinIconSize,
                iconAnchor: pinIconAnchor,
                popupAnchor: pinPopupAnchor
            });

            const popupHtml = this.mapMarkerService.buildCayoPericoPopupHtml(
                loc,
                this.translationService.t('gta5.popups.coordinates') || 'Coordenadas'
            );

            const tooltipEl = document.createElement('div');
            const nameBold = document.createElement('b');
            nameBold.textContent = loc.name;
            tooltipEl.appendChild(nameBold);
            tooltipEl.appendChild(document.createElement('br'));
            const catSpan = document.createElement('span');
            catSpan.style.color = badgeColor;
            catSpan.textContent = loc.categoryLabel;
            tooltipEl.appendChild(catSpan);

            const marker = L.marker([lat, lng], { icon })
                .bindPopup(popupHtml, { maxWidth: 300, className: 'gta-leaflet-popup' })
                .bindTooltip(tooltipEl, {
                    direction: 'top',
                    offset: [0, -26],
                    className: 'gta-leaflet-tooltip'
                });

            marker.addTo(map);
            this.cayoPericoMarkers.push({ marker, location: loc });
        });
    }

    getCayoCategoryCount(categoryKey: string): number {
        return this.cayoPericoLocations.filter(loc => loc.category === categoryKey).length;
    }

    /**
     * Carga todas las propiedades, negocios y servicios de GTA Online y los dibuja en el mapa.
     */
    private loadProperties(): void {
        this.propertiesSub?.unsubscribe();
        this.propertiesSub = this.locationService.getProperties('online').subscribe({
            next: (properties) => {
                this.allProperties = properties;
                this.recomputeDerivedLists();
                properties.forEach(p => {
                    if (this.layerFilters[p.id] === undefined) {
                        this.layerFilters[p.id] = false;
                    }
                    if (this.layerFilters[p.category] === undefined) {
                        this.layerFilters[p.category] = false;
                    }
                });
                this.renderPropertyMarkers();
            },
            error: (err) => console.error('Error al cargar propiedades:', err)
        });
    }

    /**
     * Carga la colección de coleccionables de GTA Online (figuras, naipes, emisoras, etc.).
     */
    private loadCollectibles(): void {
        this.collectiblesSub?.unsubscribe();
        this.collectiblesSub = this.locationService.getCollectibles().subscribe({
            next: (collectibles) => {
                this.allCollectibles = collectibles;
                collectibles.forEach(c => {
                    if (this.layerFilters[c.category] === undefined) {
                        this.layerFilters[c.category] = false;
                    }
                });
                this.renderCollectibleMarkers();
            },
            error: (err) => console.error('Error al cargar coleccionables:', err)
        });
    }

    /**
     * Renderiza los marcadores de propiedades, negocios y servicios en el mapa Leaflet.
     */
    private renderPropertyMarkers(): void {
        const map = this.map;
        if (!map) return;

        this.propertyMarkers.forEach(p => p.marker.remove());
        this.propertyMarkers = [];

        this.allProperties.forEach(p => {
            const isIndividual = p.category === 'roleplay_job' || p.category === 'character' || p.category === 'animal';
            const filterKey = isIndividual ? p.id : p.category;
            if (this.layerFilters[filterKey] === false) return;

            if (p.gameMode !== 'both' && p.gameMode !== this.selectedGameMode) {
                return;
            }

            const isPurchasable = this.isPurchasable(p);
            const [lat, lng] = this.worldToLatLng(p.position.x, p.position.y);

            let pinSymbol = p.badge?.symbol || '•';
            if (p.category === 'police_station') pinSymbol = '⭐';
            if (p.category === 'hospital') pinSymbol = '🩸';
            if (p.category === 'bunker') pinSymbol = '🔻';
            if (p.category === 'shipwreck') pinSymbol = '⚓';
            if (p.category === 'cave') pinSymbol = '🕳️';
            if (p.category === 'fire_station' && (!pinSymbol || pinSymbol === 'BOM')) pinSymbol = '🚒';
            if (p.category === 'car_wash') pinSymbol = '🚿';
            if (p.category === 'arena_war') pinSymbol = '🏟️';
            if (p.category === 'golf') pinSymbol = '⛳';
            if (p.category === 'darts') pinSymbol = '🎯';
            if (p.category === 'tennis') pinSymbol = '🎾';
            if (p.category === 'stunt_jump') pinSymbol = '🚧';
            if (p.category === 'under_the_bridge') pinSymbol = '🛩️';
            if (p.category === 'knife_flight') pinSymbol = '✈️';
            if (p.category === 'parachuting') pinSymbol = '🪂';
            if (p.category === 'service' || p.id.startsWith('ammu-')) pinSymbol = '🔫';
            if (p.category === 'barber') pinSymbol = '✂️';
            if (p.category === 'tattoo') pinSymbol = '💉';
            if (p.category === 'clothing_store') pinSymbol = '👕';

            // Icono: FA "simple" o círculo neón según tema seleccionado
            const pinColor = p.badge?.color || '#ffb833';
            let faIconProp = p.badge?.icon || 'location-dot';
            if (p.category === 'service' || p.id.startsWith('ammu-')) faIconProp = 'gun';
            if (p.category === 'barber') faIconProp = 'scissors';
            if (p.category === 'tattoo') faIconProp = 'pen-nib';
            if (p.category === 'clothing_store') faIconProp = 'shirt';
            const iconSizeProp: [number, number] = (p.category === 'shipwreck' || p.category === 'fake_ufo') ? [22, 22] : [20, 20];

            const pinEl = document.createElement('div');
            let pinClass: string;
            let pinIconSize: [number, number];
            let pinIconAnchor: [number, number];
            let pinPopupAnchor: [number, number];

            // 1. Icono especial para OVNI
            if (p.category === 'fake_ufo') {
                const ufoSymbol = p.badge?.symbol || '🛸';
                pinEl.style.fontSize = '26px';
                pinEl.style.filter = `drop-shadow(0 0 8px ${pinColor}) drop-shadow(0px 2px 4px rgba(0,0,0,0.9))`;
                pinEl.style.textAlign = 'center';
                pinEl.style.lineHeight = '1';
                pinEl.style.cursor = 'pointer';
                pinEl.textContent = ufoSymbol;
                pinClass = 'gta-pin-wrapper-fa';
                pinIconSize = [26, 26];
                pinIconAnchor = [13, 13];
                pinPopupAnchor = [0, -13];
            } else if (this.iconTheme === 'standard') {
                // 2. Tema Estándar: marcador vacío sin vincular (pendiente de definir)
                pinEl.className = 'gta-pin-standard-empty';
                pinClass = 'gta-pin-wrapper-empty';
                pinIconSize = [0, 0];
                pinIconAnchor = [0, 0];
                pinPopupAnchor = [0, 0];
            } else if (this.iconTheme === 'simple') {
                // 3. Tema Font Awesome: iconos vectoriales limpios
                pinEl.style.color = pinColor;
                pinEl.style.fontSize = `${iconSizeProp[0]}px`;
                pinEl.style.filter = 'drop-shadow(0px 2px 3px rgba(0,0,0,0.9))';
                pinEl.style.textAlign = 'center';
                pinEl.style.lineHeight = '1';
                const iconTag = document.createElement('i');
                iconTag.className = `fa-solid fa-${faIconProp}`;
                pinEl.appendChild(iconTag);
                pinClass = 'gta-pin-wrapper-fa';
                pinIconSize = iconSizeProp;
                pinIconAnchor = [iconSizeProp[0] / 2, iconSizeProp[1] / 2];
                pinPopupAnchor = [0, -iconSizeProp[1] / 2];
            } else {
                // 4. Tema Clásico: pin circular con color de categoría y emoji o símbolo
                pinEl.className = `gta-pin gta-pin-${p.category}`;
                pinEl.style.setProperty('--pin-color', pinColor);
                const symSpan = document.createElement('span');
                symSpan.className = 'gta-pin-symbol';
                symSpan.style.color = p.category === 'character' ? '#f5cd2f' : 'var(--pin-color, #ffb833)';
                symSpan.style.fontWeight = '800';
                symSpan.textContent = pinSymbol;
                pinEl.appendChild(symSpan);
                pinClass = 'gta-pin-wrapper';
                pinIconSize = [22, 22];
                pinIconAnchor = [11, 22];
                pinPopupAnchor = [0, -20];
            }

            const icon = L.divIcon({
                className: pinClass,
                html: pinEl,
                iconSize: pinIconSize,
                iconAnchor: pinIconAnchor,
                popupAnchor: pinPopupAnchor
            });

            const popupHtml = this.mapMarkerService.buildLocationPopupHtml(p, {
                priceLabel: this.translationService.t('gta5.popups.price'),
                pointOfInterestLabel: this.translationService.t('gta5.popups.pointOfInterest'),
                incomeLabel: this.translationService.t('gta5.popups.income'),
                buyerLabel: this.translationService.t('gta5.popups.buyer'),
                robbableStoreLabel: this.translationService.t('gta5.popups.robbableStore')
            });

            const tooltipEl = document.createElement('div');
            const nameBold = document.createElement('b');
            nameBold.textContent = p.name;
            tooltipEl.appendChild(nameBold);
            tooltipEl.appendChild(document.createElement('br'));
            const subSpan = document.createElement('span');
            subSpan.style.color = isPurchasable ? '#2ecc71' : '#3498db';
            subSpan.textContent = isPurchasable ? p.priceFormatted : p.categoryLabel;
            tooltipEl.appendChild(subSpan);

            const marker = L.marker([lat, lng], { icon })
                .bindPopup(popupHtml, { maxWidth: 300, minWidth: 280, className: 'gta-leaflet-popup' })
                .bindTooltip(tooltipEl, {
                    direction: 'top',
                    offset: [0, -26],
                    className: 'gta-leaflet-tooltip'
                });

            marker.addTo(map);
            this.propertyMarkers.push({ marker, property: p });
        });
    }

    /**
     * Dibuja los marcadores de coleccionables en el mapa aplicando el estilo seleccionado (Clásico, Font Awesome o Estándar).
     */
    private renderCollectibleMarkers(): void {
        const map = this.map;
        if (!map) return;

        this.collectibleMarkers.forEach(c => c.marker.remove());
        this.collectibleMarkers = [];

        this.allCollectibles.forEach(item => {
            if (!this.layerFilters[item.category]) return;

            const [lat, lng] = this.worldToLatLng(item.position.x, item.position.y);

            const colColorOnline = item.badge?.color || '#ffb833';
            const colFaIconOnline = item.badge?.icon || 'star';
            const pinSymbol = item.badge?.symbol || '•';

            const htmlEl = document.createElement('div');
            let iconDivClass: string;
            let iconSize: [number, number];
            let iconAnchor: [number, number];
            let popupAnchor: [number, number];

            // 1. Estándar: vacío sin vincular
            if (this.iconTheme === 'standard') {
                htmlEl.className = 'gta-pin-collectible-standard-empty';
                iconDivClass = 'gta-pin-collectible-wrapper-empty';
                iconSize = [0, 0];
                iconAnchor = [0, 0];
                popupAnchor = [0, 0];
            } else if (this.iconTheme === 'simple') {
                // 2. Font Awesome: icono vectorial fa-solid
                htmlEl.style.color = colColorOnline;
                htmlEl.style.fontSize = '13px';
                htmlEl.style.filter = 'drop-shadow(0px 1px 2px rgba(0,0,0,0.8))';
                htmlEl.style.textAlign = 'center';
                htmlEl.style.lineHeight = '1';
                const iconTag = document.createElement('i');
                iconTag.className = `fa-solid fa-${colFaIconOnline}`;
                htmlEl.appendChild(iconTag);
                iconDivClass = 'gta-pin-collectible-wrapper-fa';
                iconSize = [16, 16];
                iconAnchor = [8, 8];
                popupAnchor = [0, -8];
            } else {
                // 3. Clásico: cuadrado o círculo con color de categoría y símbolo
                htmlEl.className = 'gta-pin-collectible';
                htmlEl.style.background = colColorOnline;
                const symSpan = document.createElement('span');
                symSpan.className = 'gta-pin-col-symbol';
                symSpan.style.color = colColorOnline;
                symSpan.style.fontWeight = '700';
                symSpan.style.lineHeight = '1';
                symSpan.textContent = pinSymbol;
                htmlEl.appendChild(symSpan);
                iconDivClass = 'gta-pin-collectible-wrapper';
                iconSize = [17, 17];
                iconAnchor = [8.5, 17];
                popupAnchor = [0, -15];
            }

            const icon = L.divIcon({
                className: iconDivClass,
                html: htmlEl,
                iconSize,
                iconAnchor,
                popupAnchor
            });

            const popupHtml = this.mapMarkerService.buildOnlineCollectiblePopupHtml(
                item,
                this.translationService.t('gta5.popups.hint'),
                this.translationService.t('gta5.popups.reward')
            );

            const tooltipEl = document.createElement('div');
            const nameBold = document.createElement('b');
            nameBold.textContent = item.name;
            tooltipEl.appendChild(nameBold);
            tooltipEl.appendChild(document.createElement('br'));
            const catSpan = document.createElement('span');
            catSpan.style.color = item.badge?.color || '#ffb833';
            catSpan.textContent = `${item.categoryLabel} (#${item.number}/${item.total})`;
            tooltipEl.appendChild(catSpan);

            const marker = L.marker([lat, lng], { icon })
                .bindPopup(popupHtml, { maxWidth: 320, className: 'gta-leaflet-popup' })
                .bindTooltip(tooltipEl, {
                    direction: 'top',
                    offset: [0, -12],
                    className: 'gta-leaflet-tooltip'
                });

            marker.addTo(map);
            this.collectibleMarkers.push({ marker, item });
        });
    }

    /**
     * Alterna la visibilidad de una categoría completa en el mapa (activar/desactivar capa).
     */
    toggleLayer(categoryKey: string): void {
        const current = this.layerFilters[categoryKey] !== false;
        this.layerFilters[categoryKey] = !current;
        if (this.selectedCity === 'cp') {
            this.renderCayoPericoMarkers();
        } else {
            this.renderPropertyMarkers();
            this.renderCollectibleMarkers();
        }
    }

    /**
     * Hace zoom animado hacia la posición de un personaje o contacto y abre su popup informativo.
     */
    zoomToCharacter(char: LocationItem, event?: MouseEvent): void {
        if (event) {
            event.stopPropagation();
        }
        if (!this.map) return;

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

        setTimeout(() => {
            const match = this.propertyMarkers.find(pm => pm.property.id === char.id);
            if (match) {
                match.marker.openPopup();
            }
        }, 850);
    }

    /**
     * Muestra u oculta el panel lateral de capas y leyenda.
     */
    toggleLegend(): void {
        this.legendOpen = !this.legendOpen;
    }

    getCategoryCount(categoryKey: string): number {
        return this.allProperties.filter(p =>
            p.category === categoryKey &&
            (p.gameMode === 'both' || p.gameMode === this.selectedGameMode)
        ).length;
    }

    getCollectibleCount(categoryKey: string): number {
        return this.allCollectibles.filter(c => c.category === categoryKey).length;
    }

    getActiveLayersCount(): number {
        return Object.values(this.layerFilters).filter(v => v).length;
    }

    setAllLayers(state: boolean): void {
        Object.keys(this.layerFilters).forEach(key => {
            this.layerFilters[key] = state;
        });
        if (this.selectedCity === 'cp') {
            this.renderCayoPericoMarkers();
        } else {
            this.renderPropertyMarkers();
            this.renderCollectibleMarkers();
        }
    }

    toggleLegendSection(section: string): void {
        this.toggleSection(section);
    }

    getActiveCountInSection(keys: string[]): number {
        return keys.filter(k => this.layerFilters[k] !== false).length;
    }

    isSectionAllActive(keys: string[]): boolean {
        return keys.length > 0 && keys.every(k => this.layerFilters[k] !== false);
    }

    onSectionCheckboxChange(keys: string[], event: Event): void {
        const input = event.target as HTMLInputElement;
        this.toggleAllInSection(keys, input.checked);
    }

    toggleAllInSection(keys: string[], state?: boolean): void {
        const allActive = keys.every(k => this.layerFilters[k] !== false);
        const targetState = state !== undefined ? state : !allActive;
        keys.forEach(k => {
            this.layerFilters[k] = targetState;
        });
        if (this.selectedCity === 'cp') {
            this.renderCayoPericoMarkers();
        } else {
            this.renderPropertyMarkers();
            this.renderCollectibleMarkers();
        }
    }

    onZoneChange(zone: string): void {
        this.selectedZone = zone;
        if (!this.map) return;

        if (this.selectedCity === 'cp') {
            this.map.flyTo([-72, 82.5], 2.7, { duration: 1 });
            return;
        }

        if (this.currentMapType === 'Satellite') {
            switch (zone) {
                case 'city':
                    this.map.flyTo([-134, 58], 4.2, { duration: 1.2 });
                    break;
                case 'sandy':
                    this.map.flyTo([-90, 84], 4.2, { duration: 1.2 });
                    break;
                case 'paleto':
                    this.map.flyTo([-46, 55], 4.4, { duration: 1.2 });
                    break;
                case 'blaine':
                    this.map.flyTo([-86, 70], 3.5, { duration: 1.2 });
                    break;
                case 'chumash':
                    this.map.flyTo([-110, 22], 4.2, { duration: 1.2 });
                    break;
                default: // all
                    this.map.flyTo([-120, 59], this.computeHdMinZoom(), { duration: 1 });
                    break;
            }
            return;
        }

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
                this.map.flyTo([-33, 29.5], this.computeMinZoom(this.imageSize), { duration: 1 });
                break;
        }
    }

    switchMapType(mapType: string): void {
        this.saveCustomMarkers();
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

    // Drawer lateral de Vehículos
    toggleProfileDrawer(): void {
        this.profileDrawerOpen = !this.profileDrawerOpen;
    }

    closeProfileDrawer(): void {
        this.profileDrawerOpen = false;
    }

    private mysteryMarker: L.Marker | null = null;
    private mysteryMarkers: L.Marker[] = [];

    private getMysteryThumbnail(thumb?: string): string {
        if (!thumb) return '';
        const src = thumb.trim();
        if (src.includes('mysteries/')) {
            const fileName = src.substring(src.lastIndexOf('/') + 1);
            return `/assets/images/gta5/mapa/marcadores-mapa/mysteries/${fileName}`;
        }
        return src.startsWith('/') ? src : '/' + src;
    }

    /**
     * Centra el mapa sobre la ubicación del misterio, cierra el drawer lateral
     * y genera un marcador destacado con animación y popup informativo.
     */
    focusMysteryLocation(mystery: GtaMystery): void {
        if (!this.map || !mystery?.position) return;
        this.closeProfileDrawer();

        if (this.selectedCity === 'cp') {
            this.selectedCity = 'ls';
            this.initMap(this.currentMapType);
        }

        const [lat, lng] = this.worldToLatLng(mystery.position.x, mystery.position.y);
        const targetZoom = Math.min(this.maxZoom, 5.5);

        this.map.flyTo([lat, lng], targetZoom, {
            animate: true,
            duration: 1.2
        });

        // Determinar tema según categoría
        let themeClass = 'mystery-theme-paranormal';
        let bgGradient = 'linear-gradient(180deg, #18092c 0%, #0d0417 100%)';
        let accentColor = mystery.badgeColor || '#a855f7';

        if (mystery.category === 'easter_egg' || (mystery.id && mystery.id.includes('underwater'))) {
            themeClass = 'mystery-theme-ocean';
            bgGradient = 'linear-gradient(180deg, #062238 0%, #03101c 100%)';
            accentColor = '#0ea5e9';
        } else if (mystery.category === 'conspiracy') {
            themeClass = 'mystery-theme-conspiracy';
            bgGradient = 'linear-gradient(180deg, #05262e 0%, #031217 100%)';
            accentColor = '#06b6d4';
        } else if (mystery.category === 'crimes') {
            themeClass = 'mystery-theme-crimes';
            bgGradient = 'linear-gradient(180deg, #2a0a10 0%, #120306 100%)';
            accentColor = '#ef4444';
        }

        const pinColor = accentColor;
        const pinIcon = mystery.badgeIcon || 'fa-ghost';

        if (this.mysteryMarker) {
            this.mysteryMarker.remove();
            this.mysteryMarker = null;
        }
        if (this.mysteryMarkers && this.mysteryMarkers.length > 0) {
            this.mysteryMarkers.forEach(m => m.remove());
            this.mysteryMarkers = [];
        }

        if (mystery.points && Array.isArray(mystery.points) && mystery.points.length > 0) {
            const latLngs: L.LatLngTuple[] = [];

            mystery.points.forEach((pt: MysteryPoint, idx: number) => {
                const stepNum = pt.step || (idx + 1);
                const [ptLat, ptLng] = this.worldToLatLng(pt.position.x, pt.position.y);
                latLngs.push([ptLat, ptLng]);

                const isSkull = stepNum >= 5;
                const stepIcon = this.mysteryPopupService.createStepIcon(stepNum, isSkull, pinColor);
                const ptPopupHtml = this.mysteryPopupService.buildStepPopupHtml({
                    mystery,
                    point: pt,
                    stepNum,
                    isSkull,
                    pinColor,
                    pinIcon,
                    bgGradient,
                    thumbnailUrl: pt.thumbnail ? this.getMysteryThumbnail(pt.thumbnail) : (mystery.thumbnail ? this.getMysteryThumbnail(mystery.thumbnail) : undefined)
                });

                const m = L.marker([ptLat, ptLng], { icon: stepIcon }).addTo(this.map!);
                m.bindPopup(ptPopupHtml, {
                    className: `gta-leaflet-popup gta-mystery-popup ${themeClass}`,
                    maxWidth: 320,
                    minWidth: 260,
                    closeButton: false
                });
                this.mysteryMarkers.push(m);
            });

            if (latLngs.length > 0) {
                const bounds = L.latLngBounds(latLngs);
                this.map.fitBounds(bounds, { padding: [60, 60], maxZoom: 5.5 });
            }
            return;
        }

        const customIcon = this.mysteryPopupService.createSingleMysteryIcon(pinIcon, pinColor);
        const popupHtml = this.mysteryPopupService.buildSinglePopupHtml({
            mystery,
            pinColor,
            pinIcon,
            bgGradient,
            thumbnailUrl: mystery.thumbnail ? this.getMysteryThumbnail(mystery.thumbnail) : undefined
        });

        this.mysteryMarker = L.marker([lat, lng], { icon: customIcon }).addTo(this.map);
        setTimeout(() => {
            if (this.mysteryMarker) {
                this.mysteryMarker.bindPopup(popupHtml, {
                    className: `gta-leaflet-popup gta-mystery-popup ${themeClass}`,
                    maxWidth: 320,
                    minWidth: 260,
                    closeButton: false
                }).openPopup();
            }
        }, 850);
    }

    }
