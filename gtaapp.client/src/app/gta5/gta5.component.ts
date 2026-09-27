import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import * as L from 'leaflet';
import { LocationService } from '../services/location.service';
import { GameClockService } from '../services/game-clock.service';
import { UserMarkersService, UserCustomMarker } from '../services/user-markers.service';
import { GtaCoordinates } from '../utils/gta-coordinates';
import { MapMarkerFactory } from '../utils/map-marker.factory';
import { LocationItem } from '../models/location';
import { CollectibleItem } from '../models/collectible';

@Component({
    selector: 'app-gta5',
    templateUrl: './gta5.component.html',
    styleUrls: ['./gta5.component.css'],
    standalone: false
})
export class Gta5Component implements OnInit, AfterViewInit, OnDestroy {

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

    // Fecha de la última actualización del mapa
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

    // Claves dinámicas sincronizadas desde los datos del backend
    get roleplayKeys(): string[] {
        return this.roleplayJobs.map(j => j.id);
    }

    get characterKeys(): string[] {
        return this.contactCharacters.map(c => c.id);
    }

    get faunaKeys(): string[] {
        return this.faunaAnimals.map(a => a.id);
    }

    get currentPropertyKeys(): string[] {
        return this.selectedGameMode === 'story' ? this.storyPropertyKeys : this.onlinePropertyKeys;
    }

    get currentVehicleKeys(): string[] {
        return this.selectedGameMode === 'story' ? this.storyVehicleKeys : this.onlineVehicleKeys;
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
        return this.allProperties.filter(p =>
            this.isPurchasable(p) &&
            (p.gameMode === 'both' || p.gameMode === this.selectedGameMode)
        ).length;
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
        activity: true
    };

    // Propiedades y coleccionables cargados
    allProperties: LocationItem[] = [];
    private propertyMarkers: { marker: L.Marker; property: LocationItem }[] = [];

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
        modo: false,
        mapa: false,
        zona: false
    };

    selectedZone = 'all';

    // Hora del juego en Los Santos
    inGameTimeStr = '12:00';
    private clockSub?: Subscription;

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
    targetCustomMarker: UserCustomMarker | null = null;
    isMarkerContext = false;

    get userCustomMarkers(): UserCustomMarker[] {
        return this.userMarkersService.allMarkers;
    }

    // Telemetría en tiempo real: Coordenadas mundiales de GTA V bajo el ratón
    mouseCoords: { x: number; y: number } = { x: 0, y: 0 };
    coordsCopied = false;

    // Panel Lateral (Drawer) de Transportes & Catálogo
    profileDrawerOpen = false;

    constructor(
        private locationService: LocationService,
        private clockService: GameClockService,
        private userMarkersService: UserMarkersService
    ) {}

    ngOnInit(): void {
        this.clockSub = this.clockService.time$.subscribe(time => {
            this.inGameTimeStr = time;
        });

        (window as any)._gtaRenameMarker = (id: string) => {
            const found = this.userMarkersService.findMarker(id);
            if (found) {
                const newName = prompt('Introduce el nuevo nombre del marcador:', found.name);
                if (newName && newName.trim() !== '') {
                    this.userMarkersService.renameMarker(id, newName);
                }
            }
        };

        (window as any)._gtaDeleteMarker = (id: string) => {
            if (this.playerMarkersLayer) {
                this.userMarkersService.deleteMarker(id, this.playerMarkersLayer);
                if (this.targetCustomMarker?.id === id) {
                    this.targetCustomMarker = null;
                }
            }
        };
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
                    this.userMarkersService.addMarker(this.ctxLatLng, this.playerMarkersLayer, (item, e) => {
                        this.targetCustomMarker = item;
                        this.isMarkerContext = true;
                        this.ctxX = e.originalEvent.clientX;
                        this.ctxY = e.originalEvent.clientY;
                        this.ctxOpen = true;
                    });
                }
                break;
            case 'editar_marcador':
                if (this.targetCustomMarker) {
                    const current = this.targetCustomMarker.name;
                    const newName = prompt('Introduce el nuevo nombre del marcador:', current);
                    if (newName && newName.trim() !== '') {
                        this.userMarkersService.renameMarker(this.targetCustomMarker.id, newName);
                    }
                }
                break;
            case 'borrar_este_marcador':
                if (this.targetCustomMarker && this.playerMarkersLayer) {
                    this.userMarkersService.deleteMarker(this.targetCustomMarker.id, this.playerMarkersLayer);
                    this.targetCustomMarker = null;
                }
                break;
            case 'borrar':
                if (this.playerMarkersLayer) {
                    this.userMarkersService.clearAll(this.playerMarkersLayer);
                    this.targetCustomMarker = null;
                }
                break;
        }
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

    ngAfterViewInit(): void {
        this.initMap(this.currentMapType);
        window.addEventListener('resize', this.onWindowResize);
    }

    ngOnDestroy(): void {
        window.removeEventListener('resize', this.onWindowResize);
        if (this.clockSub) {
            this.clockSub.unsubscribe();
        }
        delete (window as any)._gtaRenameMarker;
        delete (window as any)._gtaDeleteMarker;
        if (this.map) {
            this.map.remove();
        }
    }

    private readonly onWindowResize = () => {
        if (this.map) {
            this.map.setMinZoom(this.computeMinZoom());
        }
    };

    private computeMinZoom(): number {
        const el = document.getElementById('gta-map');
        const width = el ? el.clientWidth : 0;
        return GtaCoordinates.computeMinZoom(this.imageSize, this.maxZoom, width);
    }

    private initMap(mapType: string): void {
        if (this.map) {
            this.map.remove();
        }

        const mapBounds = L.latLngBounds([-64, 0], [0, 64]);
        const minZoom = this.computeMinZoom();

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

        // Seguir movimiento del ratón para telemetría de coordenadas
        this.map.on('mousemove', (e: L.LeafletMouseEvent) => {
            this.mouseCoords = GtaCoordinates.latLngToWorld(e.latlng.lat, e.latlng.lng);
        });
    }

    worldToLatLng(x: number, y: number): [number, number] {
        return GtaCoordinates.worldToLatLng(x, y);
    }

    latLngToWorld(lat: number, lng: number): { x: number; y: number } {
        return GtaCoordinates.latLngToWorld(lat, lng);
    }

    private loadProperties(): void {
        this.locationService.getProperties().subscribe({
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
            const [lat, lng] = GtaCoordinates.worldToLatLng(p.position.x, p.position.y);
            const icon = MapMarkerFactory.createPropertyIcon(p);
            const popupHtml = MapMarkerFactory.createPropertyPopupHtml(p, isPurchasable);
            const tooltipHtml = MapMarkerFactory.createPropertyTooltipHtml(p, isPurchasable);

            const marker = L.marker([lat, lng], { icon })
                .bindPopup(popupHtml, { maxWidth: 300, className: 'gta-leaflet-popup' })
                .bindTooltip(tooltipHtml, {
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

        if (this.selectedGameMode === 'story') {
            return;
        }

        this.allCollectibles.forEach(item => {
            if (!this.layerFilters[item.category]) return;

            const [lat, lng] = GtaCoordinates.worldToLatLng(item.position.x, item.position.y);
            const icon = MapMarkerFactory.createCollectibleIcon(item);
            const popupHtml = MapMarkerFactory.createCollectiblePopupHtml(item);
            const tooltipHtml = MapMarkerFactory.createCollectibleTooltipHtml(item);

            const marker = L.marker([lat, lng], { icon })
                .bindPopup(popupHtml, { maxWidth: 320, className: 'gta-leaflet-popup' })
                .bindTooltip(tooltipHtml, {
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
        this.renderPropertyMarkers();
        this.renderCollectibleMarkers();
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

        const [lat, lng] = GtaCoordinates.worldToLatLng(char.position.x, char.position.y);
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
        this.renderPropertyMarkers();
        this.renderCollectibleMarkers();
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
        this.renderPropertyMarkers();
        this.renderCollectibleMarkers();
    }

    setGameMode(mode: 'story' | 'online'): void {
        this.selectedGameMode = mode;
        this.chipOffline = mode === 'story';
        this.chipOnline = mode === 'online';

        if (mode === 'online' && (this.currentMapType === 'UV' || this.currentMapType === 'UV2')) {
            this.switchMapType('Satellite');
        }

        this.renderPropertyMarkers();
        this.renderCollectibleMarkers();
    }

    onGameModeChange(mode: 'story' | 'online'): void {
        this.setGameMode(mode);
    }

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
                this.map.flyTo([-36, 30], this.computeMinZoom() + 0.5, { duration: 1 });
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
            this.map.setView([-36, 30], this.computeMinZoom() + 0.5);
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
