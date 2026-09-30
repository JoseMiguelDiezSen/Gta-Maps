import { Component, OnInit, AfterViewInit, OnDestroy, effect } from '@angular/core';
import * as L from 'leaflet';
import { LocationService } from '../../services/location.service';
import { LocationItem } from '../../models/location';
import { CollectibleItem } from '../../models/collectible';
import { TranslationService } from '../../i18n';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-gta5-online',
    templateUrl: './gta5-online.component.html',
    styleUrls: ['./gta5-online.component.css'],
    standalone: false
})
export class Gta5OnlineComponent implements OnInit, AfterViewInit, OnDestroy {

    // Mapa Leaflet instanciado
    private map: L.Map | undefined;

    // Configuración de zoom y dimensiones de la textura original
    private readonly maxZoom = 9;
    private readonly imageSize = 8192;

    /**
     * Lista completa de capas base de mapas para GTA V.
     */
    get allMapTypes() {
        return [
            { id: 'Satellite', label: this.translationService.t('gta5.maps.satellite') },
                        { id: 'Roadmap', label: this.translationService.t('gta5.maps.roadmap') },
            { id: 'Atlas', label: this.translationService.t('gta5.maps.atlas') },
            { id: 'Juego', label: this.translationService.t('gta5.maps.game') },
            { id: 'UV', label: this.translationService.t('gta5.maps.uv') },
            { id: 'UV2', label: this.translationService.t('gta5.maps.uv2') }
        ];
    }

    /**
     * Filtra los mapas disponibles según la isla seleccionada:
     * Cayo Perico dispone de Satélite, Callejero y Juego.
     */
    get mapTypes() {
        if (this.selectedCity === 'cp') {
            return this.allMapTypes.filter(m => ['Satellite', 'Roadmap', 'Juego'].includes(m.id));
        }
        return this.allMapTypes.filter(m => ['Satellite', 'Roadmap', 'Atlas', 'Juego', 'UV', 'UV2'].includes(m.id));
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

    // Claves dinámicas de los Trabajos Roleplay
    get roleplayKeys(): string[] {
        return this.roleplayJobs.map(j => j.id);
    }

    // Claves dinámicas de Personajes y Contactos
    get characterKeys(): string[] {
        return this.contactCharacters.map(c => c.id);
    }

    // Claves dinámicas de Fauna y Vida Salvaje
    get faunaKeys(): string[] {
        return this.faunaAnimals.map(a => a.id);
    }

    get currentPropertyKeys(): string[] {
        return this.onlinePropertyKeys;
    }

    get currentVehicleKeys(): string[] {
        return this.onlineVehicleKeys;
    }

    get roleplayJobs(): LocationItem[] {
        return this.allProperties.filter(p =>
            p.category === 'roleplay_job' &&
            (p.gameMode === 'both' || p.gameMode === this.selectedGameMode)
        );
    }

    get contactCharacters(): LocationItem[] {
        return this.allProperties.filter(p =>
            p.category === 'character' &&
            (p.gameMode === 'both' || p.gameMode === this.selectedGameMode)
        );
    }

    get faunaAnimals(): LocationItem[] {
        return this.allProperties.filter(p =>
            p.category === 'animal' &&
            (p.gameMode === 'both' || p.gameMode === this.selectedGameMode)
        );
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
    iconTheme: 'modern' | 'classic' | 'standard' | 'simple' = 'classic';
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

    // Panel Lateral (Drawer) de Transportes & Catálogo
    profileDrawerOpen = false;

    constructor(
        private locationService: LocationService,
        readonly translationService: TranslationService,
        private router: Router,
        private route: ActivatedRoute
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
                            <polygon points="14.8,20 17.2,20 16.3,38 15.7,38" fill="url(#gtaSteelNeedle)"/>
                            <line x1="16" y1="20" x2="16" y2="38" stroke="#ffffff" stroke-width="0.6" opacity="0.9"/>
                            <path d="M10.5,20 C10.5,15.5 12.5,13.5 16,13.5 C19.5,13.5 21.5,15.5 21.5,20 Z" fill="url(#gtaRedHead)"/>
                            <ellipse cx="16" cy="13.5" rx="7.2" ry="2.2" fill="#8f0505"/>
                            <ellipse cx="16" cy="12.8" rx="6.9" ry="1.9" fill="#ff4444"/>
                            <ellipse cx="16" cy="7.5" rx="7.8" ry="6.8" fill="url(#gtaRedHead)"/>
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
        const editLbl = this.translationService.t('gta5.popups.edit');
        const deleteLbl = this.translationService.t('gta5.popups.delete');
        const html = `
            <div class="custom-marker-popup-card">
                <div class="custom-marker-title-row">
                    <h4 class="custom-marker-name">${item.name}</h4>
                </div>
                <div class="custom-marker-actions">
                    <button type="button" class="btn-marker-action btn-marker-edit" onclick="window._gtaRenameMarker('${item.id}')">
                        <span>✏️</span> ${editLbl}
                    </button>
                    <button type="button" class="btn-marker-action btn-marker-delete" onclick="window._gtaDeleteMarker('${item.id}')">
                        <span>🗑️</span> ${deleteLbl}
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
        if (this.map) {
            this.map.remove();
        }
    }

    private readonly onWindowResize = () => {
        if (this.map) {
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
        }
    };

    private computeCayoMinZoom(): number {
        // Permite alejar el mapa con zoom out controlado para ver la isla con holgura
        return 2.3;
    }

    private computeHdMinZoom(): number {
        const el = document.getElementById('gta-map');
        const height = el ? el.clientHeight : 0;
        if (height <= 0) return 2.0;
        // La isla mide 192 unidades de alto en proyección HD con tileSize 256
        const targetZoom = Math.log2((height * 0.90) / 192);
        return Math.max(1.8, Math.min(this.maxZoom, Math.round(targetZoom * 10) / 10));
    }

    private computeMinZoom(imageSize: number): number {
        const el = document.getElementById('gta-map');
        const height = el ? el.clientHeight : 0;
        if (height <= 0) return 4.0;
        // La isla de San Andreas mide 56.5 unidades de alto.
        // Calculamos el zoom para que la isla entera quepa verticalmente con holgura de océano
        const targetZoom = Math.log2((height * 0.92) / 56.5);
        return Math.max(3.5, Math.min(this.maxZoom, Math.round(targetZoom * 10) / 10));
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
                zoom: 2.7,
                zoomSnap: 0.1,
                center: [-72, 82.5],
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

            this.map = L.map('gta-map', {
                crs: L.CRS.Simple,
                minZoom: hdMinZoom,
                maxZoom: this.maxZoom,
                zoom: 2.5,
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
                lsOceanColor = '#4a4a4a'; // Radar en escala de grises
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

        this.updateIconStyle();

        this.map.on('mousemove', (e: L.LeafletMouseEvent) => {
            this.mouseCoords = this.latLngToWorld(e.latlng.lat, e.latlng.lng);
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
            if (this.currentMapType === 'UV' || this.currentMapType === 'UV2' || this.currentMapType === 'Atlas') {
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
        this.locationService.getCayoPericoLocations().subscribe({
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

        this.cayoPericoLocations.forEach(loc => {
            if (this.layerFilters[loc.category] === false) return;

            const [lat, lng] = this.worldToLatLng(loc.position.x, loc.position.y);

            const badgeColor = loc.badge?.color || (loc as any).color || '#f97316';
            const badgeSymbol = loc.badge?.symbol || (loc as any).icon || '•';

            const icon = L.divIcon({
                className: 'gta-pin-wrapper',
                html: `
                    <div class="gta-pin gta-pin-${loc.category}" style="--pin-color: ${badgeColor}; border-color: ${badgeColor};">
                        <span class="gta-pin-symbol" style="color: ${badgeColor}; font-weight: 800;">${badgeSymbol}</span>
                    </div>
                `,
                iconSize: [30, 30],
                iconAnchor: [15, 30],
                popupAnchor: [0, -28]
            });

            const featuresHtml = loc.features && loc.features.length > 0
                ? `<ul class="popup-features">${loc.features.map(f => `<li>${f}</li>`).join('')}</ul>`
                : '';

            const imageHtml = loc.imageUrl
                ? `<div class="popup-image-box"><img src="${loc.imageUrl}" alt="${loc.name}" class="popup-img" loading="lazy" onerror="this.parentElement.style.display='none'" /></div>`
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
                            <span>Coordenadas:</span> <span>X: ${loc.position.x.toFixed(1)}, Y: ${loc.position.y.toFixed(1)}</span>
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
        this.locationService.getProperties('online').subscribe({
            next: (properties) => {
                this.allProperties = properties;
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
        this.locationService.getCollectibles().subscribe({
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
            if (p.category === 'police_station' && (!pinSymbol || pinSymbol === 'POL')) pinSymbol = '🚓';
            if (p.category === 'hospital' && (!pinSymbol || pinSymbol === 'MED' || pinSymbol === '✚')) pinSymbol = '🏥';
            if (p.category === 'fire_station' && (!pinSymbol || pinSymbol === 'BOM')) pinSymbol = '🚒';
            if (p.category === 'car_wash') pinSymbol = '🚿';
            if (p.category === 'arena_war') pinSymbol = '🏟️';
            if (p.category === 'golf') pinSymbol = '⛳';
            if (p.category === 'darts') pinSymbol = '🎯';
            if (p.category === 'tennis') pinSymbol = '🎾';
            if (p.category === 'stunt_jump') pinSymbol = '🏎️';
            if (p.category === 'under_the_bridge') pinSymbol = '🌉';
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
                pinIconSize = [30, 30];
                pinIconAnchor = [15, 30];
                pinPopupAnchor = [0, -28];
            }

            const icon = L.divIcon({
                className: pinClass,
                html: pinHtml,
                iconSize: pinIconSize,
                iconAnchor: pinIconAnchor,
                popupAnchor: pinPopupAnchor
            });

            const featuresHtml = p.features && p.features.length > 0
                ? `<ul class="popup-features">${p.features.map(f => `<li>${f}</li>`).join('')}</ul>`
                : '';

            const incomeHtml = p.income
                ? `<div class="popup-row"><span class="popup-tag-lbl">${this.translationService.t('gta5.popups.income')}</span> <span class="popup-tag-val val-income">${p.income}</span></div>`
                : '';

            const ownerHtml = p.owner
                ? `<div class="popup-row"><span class="popup-tag-lbl">${this.translationService.t('gta5.popups.buyer')}</span> <span class="popup-tag-val">${p.owner}</span></div>`
                : '';

            const imageHtml = p.imageUrl
                ? `<div class="popup-image-box"><img src="${p.imageUrl}" alt="${p.name}" class="popup-img" loading="lazy" onerror="this.parentElement.style.display='none'" /></div>`
                : '';

            const priceSectionHtml = isPurchasable
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
                iconSize = [16, 16];
                iconAnchor = [8, 16];
                popupAnchor = [0, -14];
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

        const pinColor = mystery.badgeColor || '#a855f7';
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
            <div class="gta-popup-card" style="min-width: 260px;">
                <div class="popup-banner" style="background: linear-gradient(135deg, ${pinColor}44, #0b0f14 85%); border-bottom: 2px solid ${pinColor};">
                    <span class="popup-badge" style="color: ${pinColor}; border-color: ${pinColor}66">${mystery.categoryLabel || 'Misterio'}</span>
                    <h4 class="popup-title">${mystery.title}</h4>
                    <div class="popup-zone">${mystery.zone || mystery.location}</div>
                </div>
                <div class="popup-content">
                    ${mystery.schedule ? `
                    <div class="popup-row">
                        <span class="popup-tag-lbl">Horario</span>
                        <span class="popup-tag-val" style="color: #facc15; font-weight: 700;">${mystery.schedule}</span>
                    </div>` : ''}
                    <div class="popup-desc" style="font-size: 11px; color: rgba(255,255,255,0.85); margin-top: 6px; line-height: 1.45;">
                        ${mystery.description}
                    </div>
                </div>
            </div>
        `;

        this.mysteryMarker = L.marker([lat, lng], { icon: customIcon }).addTo(this.map);
        setTimeout(() => {
            if (this.mysteryMarker) {
                this.mysteryMarker.bindPopup(popupHtml).openPopup();
            }
        }, 850);
    }
}



