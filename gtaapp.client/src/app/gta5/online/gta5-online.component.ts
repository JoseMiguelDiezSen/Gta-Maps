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

    private map: L.Map | undefined;

    // Mapa base: imagen oficial de 8192x8192 px troceada en tiles de 256px.
    private readonly maxZoom = 9;
    private readonly imageSize = 8192;

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
     * Mapas base disponibles según el modo de juego activo.
     * Los mapas UV y UV2 (Blueprint) solo están disponibles en Modo Historia.
     * El mapa Juego está disponible en ambos modos.
     */
    get mapTypes() {
        if (this.selectedCity === 'cp') {
            return this.allMapTypes.filter(m => ['Satellite', 'Roadmap', 'Juego'].includes(m.id));
        }
        return this.allMapTypes.filter(m => ['Satellite', 'Roadmap', 'Atlas', 'Juego'].includes(m.id));
    }

    currentMapType = 'Satellite';

    // Selector de Isla / Zona: 'ls' = Los Santos / San Andreas, 'cp' = Cayo Perico
    selectedCity: 'ls' | 'cp' = 'ls';

    // Cayo Perico - Datos y Categorías
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

    // Claves de los Negocios
    readonly businessKeys = [
        'coke_lockup',
        'weed_farm',
        'warehouse',
        'nightclub',
        'cash_factory',
        'meth_lab',
        'doc_forgery'
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
            'icon-theme-standard'
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
            } else {
                this.map.setMinZoom(this.computeMinZoom(this.imageSize));
            }
        }
    };

    private computeCayoMinZoom(): number {
        const el = document.getElementById('gta-map');
        const width = el ? el.clientWidth : 0;
        const height = el ? el.clientHeight : 0;
        if (width <= 0) return 3.63;
        // El mapa de Rockstar mide 155 de ancho y 148 de alto en coordenadas.
        // zoom mínimo para cubrir siempre el 100% de la pantalla (sin ningún relleno ni a los lados ni arriba/abajo)
        const zoomForWidth = Math.log2(width / 155);
        const zoomForHeight = Math.log2(height / 148);
        return Math.max(1, Math.max(zoomForWidth, zoomForHeight));
    }

    private computeMinZoom(imageSize: number): number {
        const el = document.getElementById('gta-map');
        const width = el ? el.clientWidth : 0;
        if (width <= 0) return 2;
        const nativeZoom = 7;
        const min = nativeZoom + Math.log2(width / imageSize);
        return Math.min(this.maxZoom, Math.max(1, Math.ceil(min)));
    }

    private initMap(mapType: string): void {
        if (this.map) {
            this.map.remove();
        }

        const mapContainer = document.getElementById('gta-map');

        if (this.selectedCity === 'cp') {
            let layerSlug = 'render_island_heist';
            let oceanColor = '#0C2A47';
            if (mapType === 'Roadmap' || mapType === 'Atlas') {
                layerSlug = 'print_island_heist';
                oceanColor = '#3FA7C4';
            } else if (mapType === 'Juego') {
                layerSlug = 'game_island_heist';
                oceanColor = '#2A3B43';
            }

            if (mapContainer) {
                mapContainer.style.backgroundColor = oceanColor;
            }

            const cayoMinZoom = this.computeCayoMinZoom();
            const cayoBounds = L.latLngBounds([[-148, 0], [0, 155]]);
            this.map = L.map('gta-map', {
                crs: L.CRS.Simple,
                minZoom: cayoMinZoom,
                maxZoom: 7,
                zoom: cayoMinZoom,
                zoomSnap: 0,
                center: [-74, 77.5],
                maxBounds: cayoBounds,
                maxBoundsViscosity: 1.0,
                zoomControl: false,
                attributionControl: false
            });

            // Mapa oficial de Rockstar Games Social Club (256x256 px, zooms 0-6 nativos)
            const tileUrl = `https://s.rsg.sc/sc/images/games/GTAV/map/${layerSlug}/{z}/{x}/{y}.jpg`;

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
        } else {
            if (mapContainer) {
                mapContainer.style.backgroundColor = '#0b0f14';
            }
            const mapBounds = L.latLngBounds([-64, 0], [0, 64]);
            const minZoom = this.computeMinZoom(this.imageSize);

            this.map = L.map('gta-map', {
                crs: L.CRS.Simple,
                minZoom,
                maxZoom: this.maxZoom,
                zoom: minZoom,
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
                maxNativeZoom: 7,
                maxZoom: this.maxZoom,
                errorTileUrl: mapType.startsWith('UV') ? undefined : `assets/${mapType === 'Juego' ? 'Roadmap' : mapType}/empty.jpg`,
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

    worldToLatLng(x: number, y: number): [number, number] {
        if (this.selectedCity === 'cp') {
            const ptX = ((x - 3700) / 2000) * 10000;
            const ptY = ((-4150 - y) / 2000) * 10000;
            const lat = -ptY / 64;
            const lng = ptX / 64;
            return [lat, lng];
        }

        const originX = 3753.6;
        const originY = 5529.6;
        const scale = 0.660; // 0.660 px por metro oficial

        const px = originX + (scale * x);
        const py = originY - (scale * y);

        const lat = -py / 128;
        const lng = px / 128;
        return [lat, lng];
    }

    latLngToWorld(lat: number, lng: number): { x: number; y: number } {
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

    switchCity(city: 'ls' | 'cp'): void {
        if (this.selectedCity === city) return;
        this.selectedCity = city;
        if (this.selectedCity === 'cp' && (this.currentMapType === 'UV' || this.currentMapType === 'UV2')) {
            this.currentMapType = 'Satellite';
        }
        this.initMap(this.currentMapType);
    }

    toggleCity(): void {
        this.switchCity(this.selectedCity === 'ls' ? 'cp' : 'ls');
    }

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

            const badgeColor = loc.badge.color || '#f97316';
            const badgeSymbol = loc.badge.symbol || '•';

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

            let pinSymbol = p.badge.symbol || '•';
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

        this.collectibleMarkers.forEach(c => c.marker.remove());
        this.collectibleMarkers = [];

        this.allCollectibles.forEach(item => {
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
                .bindTooltip(`<b>${item.name}</b><br><span style="color:${item.badge.color}">${item.categoryLabel} (#${item.number}/${item.total})</span>`, {
                    direction: 'top',
                    offset: [0, -12],
                    className: 'gta-leaflet-tooltip'
                });

            marker.addTo(map);
            this.collectibleMarkers.push({ marker, item });
        });
    }

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
            this.map.flyTo([-75, 120], this.computeCayoMinZoom(), { duration: 1 });
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
                this.map.flyTo([-36, 30], this.computeMinZoom(this.imageSize), { duration: 1 });
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
}
