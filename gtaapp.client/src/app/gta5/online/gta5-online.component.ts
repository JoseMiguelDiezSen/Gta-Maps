import { Component, OnInit, AfterViewInit, OnDestroy, effect } from '@angular/core';
import { Subscription } from 'rxjs';
import * as L from 'leaflet';
import { LocationService } from '../../services/location.service';
import { LocationItem } from '../../models/location';
import { CollectibleItem } from '../../models/collectible';
import { TranslationService } from '../../i18n';
import { Router, ActivatedRoute } from '@angular/router';
import { GotyService } from '../../services/goty.service';

@Component({
    selector: 'app-gta5-online',
    templateUrl: './gta5-online.component.html',
    styleUrls: ['./gta5-online.component.css'],
    standalone: false
})
export class Gta5OnlineComponent implements OnInit, AfterViewInit, OnDestroy {

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
        'facility'
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
        'strip_club'
    ];

    private _roleplayJobs: LocationItem[] = [];
    private _contactCharacters: LocationItem[] = [];
    private _faunaAnimals: LocationItem[] = [];
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
    }

    get roleplayKeys(): string[] { return this._roleplayKeys; }
    get characterKeys(): string[] { return this._characterKeys; }
    get faunaKeys(): string[] { return this._faunaKeys; }
    get currentPropertyKeys(): string[] { return this.onlinePropertyKeys; }
    get currentVehicleKeys(): string[] { return this.onlineVehicleKeys; }
    get roleplayJobs(): LocationItem[] { return this._roleplayJobs; }
    get contactCharacters(): LocationItem[] { return this._contactCharacters; }
    get faunaAnimals(): LocationItem[] { return this._faunaAnimals; }

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
        mansion: true,
        luxury_apartment: true,
        mid_apartment: true,
        low_apartment: true,
        garage: true,
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
        ls_customs: true,
        bennys: true,
        hao_garage: true,
        ls_car_meet: true,
        police_station: true,
        hospital: true,
        fire_station: true,
        service: true,
        convenience_store: true,
        mask_shop: true,
        car_wash: true,
        strip_club: true,
        animal: true,
        playing_card: true,
        action_figure: true,
        signal_jammer: true,
        movie_prop: true,
        radio_antenna: true,
        fake_ufo: true,
        shipwreck: true,
        cave: true,
        activity: true,
        golf: true,
        darts: true,
        tennis: true,
        stunt_jump: true,
        under_the_bridge: true,
        knife_flight: true,
        parachuting: true,
        // Cayo Perico
        infiltration_points: true,
        escape_points: true,
        compound_entry_points: true,
        power_station: true,
        control_tower: true,
        secondary_targets: true,
        bolt_cutters: true,
        grappling_eq: true,
        guard_clothing: true,
        supply_truck: true,
        cutting_powder: true,
        water_tower: true,
        combat_shotgun: true,
        perico_pistol: true,
        treasure_chests: true,
        buried_stashes: true,
        spawns_forklift: true,
        spawns_manchez_scout: true,
        spawns_verus: true,
        spawns_winky: true,
        spawns_squaddie: true,
        spawns_dinghy: true,
        spawns_weaponized_dinghy: true
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
    private clockInterval: any;

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
    userCustomMarkers: { id: string; name: string; marker: L.Marker; latLng: L.LatLng; color?: string }[] = [];
    targetCustomMarker: { id: string; name: string; marker: L.Marker; latLng: L.LatLng; color?: string } | null = null;
    isMarkerContext = false;

    // Telemetría en tiempo real: Coordenadas mundiales de GTA V bajo el ratón
    mouseCoords: { x: number; y: number } = { x: 0, y: 0 };
    coordsCopied = false;

    // Panel Lateral (Drawer) de Transportes & Catálogo
    profileDrawerOpen = false;

    constructor(
        private locationService: LocationService,
        readonly translationService: TranslationService,
        private router: Router,
        private route: ActivatedRoute,
        public gotyService: GotyService
    ) {
        effect(() => {
            const lang = this.translationService.currentLanguage();
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
            this.router.navigate(['/gta6-online']);
        } else {
            this.router.navigate(['/gta5-online']);
        }
    }

    ngOnInit(): void {
        if (typeof window !== 'undefined') {
            (window as any)._closeGtaMapPopup = () => {
                if (this.map) {
                    this.map.closePopup();
                }
            };
        }
        if (typeof window !== 'undefined' && window.innerWidth <= 850) {
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

        (window as any)._gtaSetMarkerColor = (id: string, color: string) => {
            const found = this.userCustomMarkers.find(m => m.id === id);
            if (found) {
                found.color = color;
                found.marker.setIcon(this.createPushpinIcon(color));
                this.updateCustomMarkerPopup(found);
                found.marker.openPopup();
            }
        };

        (window as any)._gtaRenameMarker = (id: string) => {
            const el = document.getElementById('custom-marker-title-' + id);
            if (el) {
                el.focus();
                const range = document.createRange();
                range.selectNodeContents(el);
                const sel = window.getSelection();
                sel?.removeAllRanges();
                sel?.addRange(range);
            }
        };

        (window as any)._gtaSaveMarkerName = (id: string, newName: string) => {
            const found = this.userCustomMarkers.find(m => m.id === id);
            if (found && newName && newName.trim() !== '') {
                found.name = newName.trim();
                if (this.targetCustomMarker?.id === id) {
                    this.targetCustomMarker.name = found.name;
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
                    const id = 'custom-' + Date.now();
                    const name = 'Marcador ' + (this.userCustomMarkers.length + 1);
                    const customIcon = this.createPushpinIcon('red');
                    const m = L.marker(this.ctxLatLng, { icon: customIcon });
                    const item = { id, name, marker: m, latLng: this.ctxLatLng, color: 'red' };

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
        return L.divIcon({
            className: 'gta-classic-pushpin-icon',
            html: `
                <div class="classic-pushpin-wrapper">
                    <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <radialGradient id="${gradId}" cx="35%" cy="30%" r="65%">
                                <stop offset="0%" stop-color="${pal.s0}"/>
                                <stop offset="35%" stop-color="${pal.s35}"/>
                                <stop offset="85%" stop-color="${pal.s85}"/>
                                <stop offset="100%" stop-color="${pal.s100}"/>
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
                            <polygon points="14.8,20 17.2,20 16.3,38 15.7,38" fill="url(#gtaSteelNeedle)"/>
                            <line x1="16" y1="20" x2="16" y2="38" stroke="#ffffff" stroke-width="0.6" opacity="0.9"/>
                            <path d="M10.5,20 C10.5,15.5 12.5,13.5 16,13.5 C19.5,13.5 21.5,15.5 21.5,20 Z" fill="url(#${gradId})"/>
                            <ellipse cx="16" cy="13.5" rx="7.2" ry="2.2" fill="${pal.rim1}"/>
                            <ellipse cx="16" cy="12.8" rx="6.9" ry="1.9" fill="${pal.rim2}"/>
                            <ellipse cx="16" cy="7.5" rx="7.8" ry="6.8" fill="url(#${gradId})"/>
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

    focusCustomMarker(cm: { id: string; name: string; marker: L.Marker; latLng: L.LatLng; color?: string }): void {
        if (!this.map || !cm) return;
        const targetZoom = Math.max(this.map.getZoom(), 4.5);
        this.map.flyTo(cm.latLng, targetZoom, { animate: true, duration: 0.8 });
        setTimeout(() => {
            cm.marker.openPopup();
        }, 500);
    }

    private updateCustomMarkerPopup(item: { id: string; name: string; marker: L.Marker; latLng: L.LatLng; color?: string }): void {
        const editLbl = this.translationService.t('gta5.popups.edit');
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

        const colorSwatchesHtml = colors.map(c => `
            <button
                type="button"
                onclick="window._gtaSetMarkerColor('${item.id}', '${c.key}')"
                title="${c.title}"
                style="width: 13px; height: 13px; border-radius: 50%; background: ${c.hex}; border: 1.5px solid ${c.key === activeColor ? '#ffffff' : 'rgba(255,255,255,0.25)'}; cursor: pointer; box-shadow: ${c.key === activeColor ? '0 0 6px #ffffff' : '0 1px 3px rgba(0,0,0,0.5)'}; transform: ${c.key === activeColor ? 'scale(1.2)' : 'scale(1)'}; transition: all 0.15s ease; padding: 0;"
            ></button>
        `).join('');

        const html = `
            <div class="custom-marker-popup-card">
                <div class="custom-marker-title-row" style="display: flex; justify-content: center; text-align: center; margin: 0 16px 4px 16px;">
                    <h4 id="custom-marker-title-${item.id}"
                        class="custom-marker-name"
                        contenteditable="true"
                        spellcheck="false"
                        onkeydown="if(event.key === 'Enter'){ event.preventDefault(); this.blur(); }"
                        onblur="window._gtaSaveMarkerName('${item.id}', this.innerText)"
                        title="Haz clic para escribir y pincha fuera para guardar"
                        style="margin: 0; outline: none; padding: 2px 6px; font-size: 11.5px; font-weight: 700; border-radius: 4px; border: 1px dashed rgba(255,255,255,0.25); cursor: text; text-align: center; max-width: 100%; width: auto; min-width: 60px; transition: all 0.15s ease;">
                        ${item.name}
                    </h4>
                </div>
                <div style="display: flex; align-items: center; justify-content: center; gap: 5px; margin: 4px 0 5px 0; padding: 3px 6px; background: rgba(0,0,0,0.45); border-radius: 8px; border: 1px solid rgba(255,255,255,0.08);">
                    ${colorSwatchesHtml}
                </div>
                <div class="custom-marker-actions">
                    <button type="button" class="btn-marker-action btn-marker-delete" onclick="window._gtaDeleteMarker('${item.id}')" style="width: 100%; padding: 4px 6px; font-size: 10px;">
                        <span>🗑️</span> ${deleteLbl}
                    </button>
                </div>
            </div>
        `;
        item.marker.bindPopup(html, {
            className: 'gta-custom-pin-popup',
            maxWidth: 170,
            minWidth: 135,
            autoPan: true
        });
    }

    ngAfterViewInit(): void {
        this.initMap(this.currentMapType);
        setTimeout(() => {
            if (this.map) {
                this.map.invalidateSize();
            }
        }, 150);
        window.addEventListener('resize', this.onWindowResize);
    }

    ngOnDestroy(): void {
        this.propertiesSub?.unsubscribe();
        this.collectiblesSub?.unsubscribe();
        this.cayoSub?.unsubscribe();
        window.removeEventListener('resize', this.onWindowResize);
        if (this.clockInterval) {
            clearInterval(this.clockInterval);
        }
        delete (window as any)._gtaRenameMarker;
        delete (window as any)._gtaDeleteMarker;
        delete (window as any)._gtaSetMarkerColor;
        delete (window as any)._gtaSaveMarkerName;
        delete (window as any)._closeGtaMapPopup;
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

    private computeMinZoom(imageSize: number): number {
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
            const tileUrl = `assets/tiles/cayo_perico/${layerSlug}/{z}/{x}/{y}.jpg`;

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
            // 100% Local: cargado desde assets/SatelliteHD/ sin dependencias externas
            const tileUrl = 'assets/SatelliteHD/{z}_{x}_{y}.jpg';
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
                tileUrl = 'assets/tiles/uv/{z}/{x}/{y}.jpg';
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
            const icon = L.divIcon({
                className: 'gta-district-label-pin',
                html: `<div class="gta-district-label-text ${d.isMajor ? 'is-major' : 'is-minor'}" style="
                    color: rgba(255, 255, 255, 0.92);
                    font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                    font-size: ${calculatedSize}px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: ${letterSpacing};
                    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.95), 0 0 12px rgba(0, 0, 0, 0.8);
                    white-space: nowrap;
                    pointer-events: none;
                    user-select: none;
                    text-align: center;
                ">${d.name}</div>`,
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
        // Conversión para Cayo Perico
        if (this.selectedCity === 'cp') {
            const ptX = ((x - 3700) / 2000) * 10000;
            const ptY = ((-4150 - y) / 2000) * 10000;
            const lat = -ptY / 64;
            const lng = ptX / 64;
            return [lat, lng];
        }

        // Conversión para mapa Satélite HD de Los Santos
        if (this.currentMapType === 'Satellite') {
            const lng = 128 * ((x + 4140) / 9000);
            const lat = - 192 * ((8400 - y) / 13500);
            return [lat, lng];
        }

        // Proyección estándar oficial (0.660 píxeles por metro in-game)
        const originX = 3753.6;
        const originY = 5529.6;
        const scale = 0.660;

        const px = originX + (scale * x);
        const py = originY - (scale * y);

        const lat = -py / 128;
        const lng = px / 128;
        return [lat, lng];
    }

    /**
     * Convierte coordenadas de Leaflet [lat, lng] a coordenadas cartesianas del mundo de GTA V (X, Y).
     * Se usa en la telemetría en tiempo real al mover el ratón sobre el mapa.
     */
    latLngToWorld(lat: number, lng: number): { x: number; y: number } {
        // Conversión inversa para Cayo Perico
        if (this.selectedCity === 'cp') {
            const ptX = lng * 64;
            const ptY = -lat * 64;
            const x = 3700 + (ptX / 10000) * 2000;
            const y = -4150 - (ptY / 10000) * 2000;
            return {
                x: Math.round(x * 10) / 10,
                y: Math.round(y * 10) / 10
            };
        }

        // Conversión inversa para Satélite HD
        if (this.currentMapType === 'Satellite') {
            const x = (lng / 128) * 9000 - 4140;
            const y = 8400 - (-lat / 192) * 13500;
            return {
                x: Math.round(x * 10) / 10,
                y: Math.round(y * 10) / 10
            };
        }

        // Conversión inversa estándar
        const originX = 3753.6;
        const originY = 5529.6;
        const scale = 0.660;

        const px = lng * 128;
        const py = -lat * 128;

        const x = (px - originX) / scale;
        const y = (originY - py) / scale;

        return {
            x: Math.round(x * 10) / 10,
            y: Math.round(y * 10) / 10
        };
    }

    switchCity(city: 'ls' | 'cp'): void {
        if (this.selectedCity === city) return;
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
                        this.layerFilters[loc.category] = true;
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

            const badgeColor = loc.badge?.color || (loc as any).color || '#f97316';
            const badgeSymbol = loc.badge?.symbol || (loc as any).icon || '•';

            let pinHtml: string;
            let pinClass: string;
            let pinIconSize: [number, number];
            let pinIconAnchor: [number, number];
            let pinPopupAnchor: [number, number];

            if (this.iconTheme === 'standard') {
                pinHtml = `<div class="gta-pin-standard-empty"></div>`;
                pinClass = 'gta-pin-wrapper-empty';
                pinIconSize = [0, 0];
                pinIconAnchor = [0, 0];
                pinPopupAnchor = [0, 0];
            } else if (this.iconTheme === 'simple') {
                const faIcon = cayoFaIcons[loc.category] || loc.badge?.icon || 'location-dot';
                pinHtml = `<div style="color: ${badgeColor}; font-size: 20px; filter: drop-shadow(0px 2px 3px rgba(0,0,0,0.9)); text-align: center; line-height:1;"><i class="fa-solid fa-${faIcon}"></i></div>`;
                pinClass = 'gta-pin-wrapper-fa';
                pinIconSize = [20, 20];
                pinIconAnchor = [10, 10];
                pinPopupAnchor = [0, -10];
            } else {
                pinHtml = `
                    <div class="gta-pin gta-pin-${loc.category}" style="--pin-color: ${badgeColor}; border-color: ${badgeColor};">
                        <span class="gta-pin-symbol" style="color: ${badgeColor}; font-weight: 800;">${badgeSymbol}</span>
                    </div>
                `;
                pinClass = 'gta-pin-wrapper';
                pinIconSize = [22, 22];
                pinIconAnchor = [11, 22];
                pinPopupAnchor = [0, -20];
            }

            const icon = L.divIcon({
                className: pinClass,
                html: pinHtml,
                iconSize: pinIconSize,
                iconAnchor: pinIconAnchor,
                popupAnchor: pinPopupAnchor
            });

            const featuresHtml = loc.features && loc.features.length > 0
                ? `<ul class="popup-features">${loc.features.map(f => `<li>${f}</li>`).join('')}</ul>`
                : '';

            const rawCayoImg = loc.imageUrl || (loc as any).thumbnail || (loc as any).image;
            const finalCayoImg = rawCayoImg ? (rawCayoImg.startsWith('/') ? rawCayoImg : '/' + rawCayoImg) : '';
            const imageHtml = finalCayoImg
                ? `<div class="popup-image-box"><img src="${finalCayoImg}" alt="${loc.name}" class="popup-img" loading="lazy" onerror="this.parentElement.style.display='none'" /></div>`
                : '';

            const popupHtml = `
                <div class="gta-popup-card">
                    ${imageHtml}
                    <div class="popup-banner" style="background: linear-gradient(135deg, ${badgeColor}33, #0b0f14 85%); border-bottom: 2px solid ${badgeColor};">
                        <span class="popup-badge" style="color: ${badgeColor}; border-color: ${badgeColor}66">${loc.categoryLabel}</span>
                        <h4 class="popup-title">${loc.name}</h4>
                        <div class="popup-zone">🌴 ${loc.zone}</div>
                    </div>
                    <div class="popup-content">
                        <p class="popup-desc">${loc.description}</p>
                        ${featuresHtml}
                        <div class="popup-row" style="margin-top: 8px; opacity: 0.7; font-size: 11px;">
                            <span>${this.translationService.t('gta5.popups.coordinates') || 'Coordenadas'}:</span> <span>X: ${loc.position.x.toFixed(1)}, Y: ${loc.position.y.toFixed(1)}</span>
                        </div>
                    </div>
                </div>
            `;

            const marker = L.marker([lat, lng], { icon })
                .bindPopup(popupHtml, { maxWidth: 300, className: 'gta-leaflet-popup' })
                .bindTooltip(`<b>${loc.name}</b><br><span style="color:${badgeColor}">${loc.categoryLabel}</span>`, {
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
                        this.layerFilters[p.id] = true;
                    }
                    if (this.layerFilters[p.category] === undefined) {
                        this.layerFilters[p.category] = true;
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
                        this.layerFilters[c.category] = true;
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

            let pinSymbol = (p.badge?.symbol || (p as any).icon) || '•';
            if (p.category === 'police_station') pinSymbol = '⭐';
            if (p.category === 'hospital') pinSymbol = '🩸';
            if (p.category === 'bunker') pinSymbol = '🔻';
            if (p.category === 'shipwreck') pinSymbol = '⚓';
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

            const pinInnerHtml = `<span class="gta-pin-symbol" style="color: ${p.category === 'character' ? '#f5cd2f' : 'var(--pin-color, #ffb833)'}; font-weight: 800;">${pinSymbol}</span>`;

            // Icono: FA "simple" o círculo neón según tema seleccionado
            const pinColor = p.badge?.color || (p as any).color || '#ffb833';
            let faIconProp = p.badge?.icon || (p as any).icon || 'location-dot';
            if (p.category === 'service' || p.id.startsWith('ammu-')) faIconProp = 'gun';
            const iconSizeProp: [number, number] = (p.category === 'shipwreck' || p.category === 'fake_ufo') ? [22, 22] : [20, 20];

            let pinHtml: string;
            let pinClass: string;
            let pinIconSize: [number, number];
            let pinIconAnchor: [number, number];
            let pinPopupAnchor: [number, number];

            // 1. Icono especial para OVNI
            if (p.category === 'fake_ufo') {
                const ufoSymbol = p.badge?.symbol || '🛸';
                pinHtml = `<div style="font-size: 26px; filter: drop-shadow(0 0 8px ${pinColor}) drop-shadow(0px 2px 4px rgba(0,0,0,0.9)); text-align: center; line-height:1; cursor: pointer;">${ufoSymbol}</div>`;
                pinClass = 'gta-pin-wrapper-fa';
                pinIconSize = [26, 26];
                pinIconAnchor = [13, 13];
                pinPopupAnchor = [0, -13];
            } else if (this.iconTheme === 'standard') {
                // 2. Tema Estándar: marcador vacío sin vincular (pendiente de definir)
                pinHtml = `<div class="gta-pin-standard-empty"></div>`;
                pinClass = 'gta-pin-wrapper-empty';
                pinIconSize = [0, 0];
                pinIconAnchor = [0, 0];
                pinPopupAnchor = [0, 0];
            } else if (this.iconTheme === 'simple') {
                // 3. Tema Font Awesome: iconos vectoriales limpios
                pinHtml = `<div style="color: ${pinColor}; font-size: ${iconSizeProp[0]}px; filter: drop-shadow(0px 2px 3px rgba(0,0,0,0.9)); text-align: center; line-height:1;"><i class="fa-solid fa-${faIconProp}"></i></div>`;
                pinClass = 'gta-pin-wrapper-fa';
                pinIconSize = iconSizeProp;
                pinIconAnchor = [iconSizeProp[0] / 2, iconSizeProp[1] / 2];
                pinPopupAnchor = [0, -iconSizeProp[1] / 2];
            } else {
                // 4. Tema Clásico: pin circular con color de categoría y emoji o símbolo
                pinHtml = `<div class="gta-pin gta-pin-${p.category}" style="--pin-color: ${pinColor}"><span class="gta-pin-symbol" style="color: ${p.category === 'character' ? '#f5cd2f' : 'var(--pin-color, #ffb833)'}; font-weight: 800;">${pinSymbol}</span></div>`;
                pinClass = 'gta-pin-wrapper';
                pinIconSize = [22, 22];
            pinIconAnchor = [11, 22];
            pinPopupAnchor = [0, -20];
            }

            const icon = L.divIcon({
                className: pinClass,
                html: pinHtml,
                iconSize: pinIconSize,
                iconAnchor: pinIconAnchor,
                popupAnchor: pinPopupAnchor
            });

            const challengeCategories = ['knife_flight', 'stunt_jump', 'parachuting', 'under_the_bridge', 'tennis'];
            const featuresHtml = (p.features && p.features.length > 0 && !challengeCategories.includes(p.category))
                ? `<ul class="popup-features">${p.features.map(f => `<li>${f}</li>`).join('')}</ul>`
                : '';

            const incomeHtml = p.income
                ? `<div class="popup-row"><span class="popup-tag-lbl">${this.translationService.t('gta5.popups.income')}</span> <span class="popup-tag-val val-income">${p.income}</span></div>`
                : '';

            const ownerHtml = p.owner
                ? `<div class="popup-row"><span class="popup-tag-lbl">${this.translationService.t('gta5.popups.buyer')}</span> <span class="popup-tag-val">${p.owner}</span></div>`
                : '';

            const rawImg = p.imageUrl || (p as any).thumbnail || (p as any).image;
            const finalImg = rawImg ? (rawImg.startsWith('/') ? rawImg : '/' + rawImg) : '';
            const imageHtml = finalImg
                ? `<div class="popup-image-box"><img src="${finalImg}" alt="${p.name}" class="popup-img" loading="lazy" onerror="this.parentElement.style.display='none'" /></div>`
                : '';

            const isShipwreck = p.category === 'shipwreck';

            const priceSectionHtml = isShipwreck
                ? `
                    <div class="popup-service-tag-box popup-shipwreck-box">
                        <span class="service-type-badge">${p.categoryLabel}</span>
                    </div>
                  `
                : isPurchasable
                ? `
                    <div class="popup-price-box">
                        <span class="price-title">${this.translationService.t('gta5.popups.price')}</span>
                        <span class="price-num">${p.priceFormatted}</span>
                    </div>
                  `
                : `
                    <div class="popup-service-tag-box">
                        <span class="service-type-badge">${p.categoryLabel}</span>
                        <span class="service-status-text">${p.priceFormatted || this.translationService.t('gta5.popups.pointOfInterest')}</span>
                    </div>
                  `;

            const popupHtml = `
                <div class="gta-popup-card">
                    ${imageHtml}
                    <div class="popup-banner" style="background: linear-gradient(135deg, ${p.badge?.color || (p as any).color || '#ffb833'}33, #0b0f14 85%); border-bottom: 2px solid ${p.badge?.color || (p as any).color || '#ffb833'};">
                        <span class="popup-badge" style="color: ${p.badge?.color || (p as any).color || '#ffb833'}; border-color: ${p.badge?.color || (p as any).color || '#ffb833'}66">${p.categoryLabel}</span>
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
                .bindPopup(popupHtml, { maxWidth: 300, minWidth: 280, className: 'gta-leaflet-popup' })
                .bindTooltip(`<b>${p.name}</b>${tooltipPrice}`, {
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

            const colColorOnline = item.badge?.color || (item as any).color || '#ffb833';
            const colFaIconOnline = item.badge?.icon || (item as any).icon || 'star';
            const pinSymbol = item.badge?.symbol || '•';

            let htmlContent: string;
            let iconDivClass: string;
            let iconSize: [number, number];
            let iconAnchor: [number, number];
            let popupAnchor: [number, number];

            // 1. Estándar: vacío sin vincular
            if (this.iconTheme === 'standard') {
                htmlContent = `<div class="gta-pin-collectible-standard-empty"></div>`;
                iconDivClass = 'gta-pin-collectible-wrapper-empty';
                iconSize = [0, 0];
                iconAnchor = [0, 0];
                popupAnchor = [0, 0];
            } else if (this.iconTheme === 'simple') {
                // 2. Font Awesome: icono vectorial fa-solid
                htmlContent = `<div style="color: ${colColorOnline}; font-size: 13px; filter: drop-shadow(0px 1px 2px rgba(0,0,0,0.8)); text-align: center; line-height:1;"><i class="fa-solid fa-${colFaIconOnline}"></i></div>`;
                iconDivClass = 'gta-pin-collectible-wrapper-fa';
                iconSize = [16, 16];
                iconAnchor = [8, 8];
                popupAnchor = [0, -8];
            } else {
                // 3. Clásico: cuadrado o círculo con color de categoría y símbolo
                htmlContent = `<div class="gta-pin-collectible" style="background: ${colColorOnline}"><span class="gta-pin-col-symbol" style="color: ${colColorOnline}; font-weight: 700; line-height: 1;">${pinSymbol}</span></div>`;
                iconDivClass = 'gta-pin-collectible-wrapper';
                iconSize = [17, 17];
                iconAnchor = [8.5, 17];
                popupAnchor = [0, -15];
            }

            const icon = L.divIcon({
                className: iconDivClass,
                html: htmlContent,
                iconSize,
                iconAnchor,
                popupAnchor
            });

            const popupHtml = `
                <div class="gta-popup-card">
                    <div class="popup-banner" style="background: linear-gradient(135deg, ${(item.badge?.color || (item as any).color)}33, #0b0f14 85%); border-bottom: 2px solid ${(item.badge?.color || (item as any).color)};">
                        <span class="popup-badge" style="color: ${(item.badge?.color || (item as any).color)}; border-color: ${(item.badge?.color || (item as any).color)}66">${item.categoryLabel} (#${item.number}/${item.total})</span>
                        <h4 class="popup-title">${item.name}</h4>
                        <div class="popup-zone">${item.zone}</div>
                    </div>
                    <div class="popup-content">
                        <div class="popup-row">
                            <span class="popup-tag-lbl">${this.translationService.t('gta5.popups.hint')}</span>
                            <span class="popup-tag-val">${item.hint}</span>
                        </div>
                        <div class="popup-row">
                            <span class="popup-tag-lbl">${this.translationService.t('gta5.popups.reward')}</span>
                            <span class="popup-tag-val val-income">${item.reward}</span>
                        </div>
                    </div>
                </div>
            `;

            const marker = L.marker([lat, lng], { icon })
                .bindPopup(popupHtml, { maxWidth: 320, className: 'gta-leaflet-popup' })
                .bindTooltip(`<b>${item.name}</b><br><span style="color:${(item.badge?.color || (item as any).color)}">${item.categoryLabel} (#${item.number}/${item.total})</span>`, {
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

    /**
     * Centra el mapa sobre la ubicación del misterio, cierra el drawer lateral
     * y genera un marcador destacado con animación y popup informativo.
     */
    focusMysteryLocation(mystery: any): void {
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

        const customIcon = L.divIcon({
            className: 'gta-pin-mystery-pulse',
            html: `
                <div style="position: relative; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center;">
                    <div style="position: absolute; inset: 0; border-radius: 50%; background: ${pinColor}; opacity: 0.4; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
                    <div style="position: relative; width: 32px; height: 32px; border-radius: 50%; background: ${pinColor}; border: 2px solid #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 16px ${pinColor}, 0 4px 10px rgba(0,0,0,0.8); color: #fff; font-size: 15px;">
                        <i class="fa-solid ${pinIcon}"></i>
                    </div>
                </div>
            `,
            iconSize: [38, 38],
            iconAnchor: [19, 19],
            popupAnchor: [0, -20]
        });

        const popupHtml = `
            <div class="gta-popup-card" style="width: 100%; box-sizing: border-box; background: ${bgGradient}; color: #fff; overflow: hidden; border-radius: 11px;">
                ${mystery.thumbnail ? `
                <div style="position: relative; width: 100%; height: 115px; overflow: hidden; background: #000; border-bottom: 2px solid ${pinColor};">
                    <img src="${mystery.thumbnail}" alt="${mystery.title}" style="width: 100%; height: 100%; object-fit: cover; display: block;" onerror="this.style.display='none'" />
                    <div style="position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 50%, rgba(5,10,18,0.95) 100%);"></div>
                    <span class="popup-badge" style="position: absolute; top: 8px; left: 8px; color: ${pinColor}; border: 1px solid ${pinColor}88; background: rgba(0,0,0,0.75); backdrop-filter: blur(4px); font-size: 9.5px; font-weight: 800; text-transform: uppercase; padding: 2px 7px; border-radius: 4px;">
                        <i class="fa-solid ${pinIcon}" style="margin-right: 4px;"></i>${mystery.categoryLabel || this.translationService.t('transports.tabs.misterios') || 'Misterio'}
                    </span>
                    <button
                        type="button"
                        onclick="window._closeGtaMapPopup()"
                        class="popup-card-close-btn"
                        title="Cerrar"
                        style="position: absolute; top: 8px; right: 8px; width: 22px; height: 22px; border-radius: 50%; background: rgba(0,0,0,0.75); border: 1px solid rgba(255,255,255,0.35); color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 20; font-size: 12px; padding: 0;"
                    >
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                    <div style="position: absolute; bottom: 8px; left: 10px; right: 10px;">
                        <h4 class="popup-title" style="margin: 0; font-size: 13.5px; font-weight: 800; line-height: 1.25; color: #fff; text-shadow: 0 2px 6px rgba(0,0,0,0.95);">${mystery.title}</h4>
                    </div>
                </div>
                ` : `
                <div class="popup-banner" style="position: relative; background: linear-gradient(135deg, ${pinColor}44, rgba(5,10,18,0.95) 85%); border-bottom: 2px solid ${pinColor}; padding: 10px 12px 8px;">
                    <span class="popup-badge" style="color: ${pinColor}; border: 1px solid ${pinColor}88; background: rgba(0,0,0,0.6); font-size: 9.5px; font-weight: 800; padding: 2px 6px; border-radius: 4px;">
                        <i class="fa-solid ${pinIcon}" style="margin-right: 4px;"></i>${mystery.categoryLabel || this.translationService.t('transports.tabs.misterios') || 'Misterio'}
                    </span>
                    <button
                        type="button"
                        onclick="window._closeGtaMapPopup()"
                        class="popup-card-close-btn"
                        title="Cerrar"
                        style="position: absolute; top: 8px; right: 8px; width: 22px; height: 22px; border-radius: 50%; background: rgba(0,0,0,0.75); border: 1px solid rgba(255,255,255,0.35); color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 20; font-size: 12px; padding: 0;"
                    >
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                    <h4 class="popup-title" style="margin: 6px 0 0; font-size: 13.5px; font-weight: 800; color: #fff;">${mystery.title}</h4>
                </div>
                `}
                <div class="popup-content" style="padding: 10px 14px 14px 14px; display: flex; flex-direction: column; gap: 7px; background: transparent; width: 100%; box-sizing: border-box;">
                    <div class="popup-zone" style="font-size: 11px; color: #94a3b8; display: flex; align-items: center; gap: 5px;">
                        <i class="fa-solid fa-location-dot" style="color: #ec4899; font-size: 10px;"></i>
                        <span style="color: #e2e8f0; font-weight: 600;">${mystery.zone || mystery.location}</span>
                    </div>
                    ${mystery.schedule ? `
                    <div class="popup-row" style="display: inline-flex; align-items: center; gap: 6px; background: rgba(234, 179, 8, 0.15); border: 1px solid rgba(234, 179, 8, 0.35); border-radius: 4px; padding: 3px 8px; width: fit-content; max-width: 100%; box-sizing: border-box;">
                        <span class="popup-tag-lbl" style="font-size: 9.5px; color: #fde047; font-weight: 700; text-transform: uppercase;"><i class="fa-regular fa-clock" style="margin-right: 4px;"></i>${this.translationService.t('transports.mysteries.schedule') || 'Horario'}</span>
                        <span class="popup-tag-val" style="color: #fef08a; font-size: 10.5px; font-weight: 800;">${mystery.schedule}</span>
                    </div>` : ''}
                    <div class="popup-desc" style="font-size: 11.5px; color: rgba(255,255,255,0.92); line-height: 1.48; margin-top: 2px; word-break: normal; overflow-wrap: break-word; white-space: normal; width: 100%; box-sizing: border-box;">
                        ${mystery.description}
                    </div>
                </div>
            </div>
        `;

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
