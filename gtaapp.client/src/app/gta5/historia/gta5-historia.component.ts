import { Component, OnInit, AfterViewInit, OnDestroy, effect } from '@angular/core';
import { Router } from '@angular/router';
import * as L from 'leaflet';
import { LocationService } from '../../services/location.service';
import { LocationItem } from '../../models/location';
import { CollectibleItem } from '../../models/collectible';
import { TranslationService } from '../../i18n';
import { GotyService } from '../../services/goty.service';


// ---------------------------------------------------------------------------
// GTA V — MODO HISTORIA
// Componente completamente independiente del modo Online.
// Comparte el mismo mapa base (tiles Leaflet 8192x8192) pero tiene:
//   - Sus propios datasets (coleccionables de historia, misiones, personajes narrativos)
//   - Su propio panel de control (sin negocios Online, sin naipes, sin señalizadores...)
//   - Sus propias categorías y filtros de capa
// ---------------------------------------------------------------------------

@Component({
    selector: 'app-gta5-historia',
    templateUrl: './gta5-historia.component.html',
    styleUrls: ['./gta5-historia.component.css'],
    standalone: false
})
export class Gta5HistoriaComponent implements OnInit, AfterViewInit, OnDestroy {

    private map: L.Map | undefined;

    // Motor de mapa: misma imagen base que Online (8192×8192, tiles 256px)
    private readonly maxZoom = 9;
    private readonly imageSize = 8192;

    private _cachedMapTypesHistoria: { id: string; label: string }[] | null = null;
    private _lastLangHistoria = '';
    get mapTypes() {
        if (!this._cachedMapTypesHistoria || this._lastLangHistoria !== this.translationService.currentLang) {
            this._lastLangHistoria = this.translationService.currentLang;
            this._cachedMapTypesHistoria = [
                { id: 'Satellite', label: this.translationService.t('gta5.maps.satellite') },
                { id: 'Roadmap',   label: this.translationService.t('gta5.maps.roadmap') },
                { id: 'Atlas',     label: this.translationService.t('gta5.maps.atlas') },
                { id: 'Juego',     label: this.translationService.t('gta5.maps.game') },
                { id: 'UV',        label: this.translationService.t('gta5.maps.uv') },
                { id: 'UV2',       label: this.translationService.t('gta5.maps.uv2') }
            ];
        }
        return this._cachedMapTypesHistoria;
    }

    currentMapType = 'Satellite';

    // -----------------------------------------------------------------------
    // CATEGORÍAS DE HISTORIA (completamente distintas del Online)
    // -----------------------------------------------------------------------

    // Propiedades en modo historia: Casas divididas por protagonista
    readonly storyPropertyKeys = [
        'safehouse_michael',
        'safehouse_franklin',
        'safehouse_trevor'
    ];

    // Negocios comprables en modo historia
    readonly storyBusinessKeys = [
        'purchasable_business'
    ];

    // Talleres disponibles en historia
    readonly storyVehicleKeys = [
        'ls_customs',
        'hao_garage'
    ];

    // Servicios comunes a ambos modos
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

    // Actividades y deportes
    readonly activityKeys = [
        'golf',
        'darts',
        'tennis',
        'stunt_jump',
        'under_the_bridge',
        'knife_flight',
        'parachuting'
    ];

    // Lugares extraños (presentes también en historia)
    readonly strangeKeys = [
        'fake_ufo',
        'shipwreck',
        'cave'
    ];

    // Coleccionables EXCLUSIVOS de Modo Historia
    // Fragmentos de carta (50), Piezas de nave espacial (50), Desperdicios nucleares (30), Piezas de submarino (30), Tratados de Epsilon (10)
    readonly storyCollectibleKeys = [
        'letter_scrap',     // 50 fragmentos de carta
        'spaceship_part',   // 50 piezas de nave espacial
        'nuclear_waste',    // 30 desperdicios nucleares
        'submarine_part',   // 30 piezas de submarino
        'epsilon_tract'     // 10 tratados de Epsilon
    ];

    private _storyCharacters: LocationItem[] = [];
    private _storyAnimals: LocationItem[] = [];
    private _characterKeys: string[] = [];
    private _faunaKeys: string[] = [];

    recomputeDerivedLists() {
        this._storyCharacters = this.allProperties.filter(p =>
            p.category === 'character' && (p.gameMode === 'both' || p.gameMode === 'story')
        );
        this._storyAnimals = this.allProperties.filter(p =>
            p.category === 'animal' && (p.gameMode === 'both' || p.gameMode === 'story')
        );
        this._characterKeys = this._storyCharacters.map(c => c.id);
        this._faunaKeys = this._storyAnimals.map(a => a.id);
    }

    get characterKeys(): string[] { return this._characterKeys; }
    get faunaKeys(): string[] { return this._faunaKeys; }

    // -----------------------------------------------------------------------
    // ESTADO DE FILTROS DE CAPAS
    // -----------------------------------------------------------------------
    layerFilters: { [key: string]: boolean } = {
        // Casas de protagonistas
        safehouse_michael:    true,
        safehouse_franklin:   true,
        safehouse_trevor:     true,
        // Negocios comprables historia
        purchasable_business: true,
        // Talleres
        ls_customs:  true,
        hao_garage:  true,
        // Servicios
        police_station:    true,
        hospital:          true,
        fire_station:      true,
        service:           true,
        convenience_store: true,
        mask_shop:         true,
        car_wash:          true,
        strip_club:        true,
        // Actividades
        activity: true,
        golf: true,
        darts: true,
        tennis: true,
        stunt_jump: true,
        under_the_bridge: true,
        knife_flight: true,
        parachuting: true,
        // Lugares extraños
        fake_ufo:   true,
        shipwreck:  true,
        cave:       true,
        // Coleccionables de Historia
        letter_scrap:   true,
        spaceship_part: true,
        nuclear_waste:  true,
        submarine_part: true,
        epsilon_tract:  true
    };

    // -----------------------------------------------------------------------
    // DATOS CARGADOS DEL BACKEND
    // -----------------------------------------------------------------------
    allProperties: LocationItem[] = [];
    private propertyMarkers: { marker: L.Marker; property: LocationItem }[] = [];

    // Coleccionables de Modo Historia
    allCollectibles: CollectibleItem[] = [];
    private collectibleMarkers: { marker: L.Marker; item: CollectibleItem }[] = [];
    private collectibleMarkersLayer: L.LayerGroup | undefined;

    private playerMarkersLayer: L.LayerGroup | undefined;



    // -----------------------------------------------------------------------
    // ESTADO DE UI
    // -----------------------------------------------------------------------
    legendOpen = true;
    settingsOpen = true;

    accordion: { [key: string]: boolean } = {
        propiedades: false,
        negocios:    false,
        vehiculos:   false,
        servicios:   false,
        actividades: false,
        personajes:  false,
        fauna:       false,
        coleccionables: false,
        lugares:     false,
        juego:       false,
        mapa:        false,
        zona:        false,
        marcadores:  false
    };

    selectedGame = 'gta5';

    switchGame(game: string): void {
        this.selectedGame = game;
        if (game === 'gta6') {
            this.router.navigate(['/gta6-historia']);
        } else {
            this.router.navigate(['/gta5-historia']);
        }
    }

    selectedZone = 'all';

    // Panel de Transportes
    readonly selectedGameMode = 'story';
    profileDrawerOpen = false;

    toggleProfileDrawer(): void {
        this.profileDrawerOpen = !this.profileDrawerOpen;
    }

    closeProfileDrawer(): void {
        this.profileDrawerOpen = false;
    }

    // Estilo de iconos
    iconTheme: 'neon' | 'classic' | 'standard' | 'simple' = 'classic';
    iconSize: 'compact' | 'standard' | 'large' = 'standard';

    // Menú contextual
    ctxOpen = false;
    ctxX = 0;
    ctxY = 0;
    private ctxLatLng: L.LatLng | null = null;
    userCustomMarkers: { id: string; name: string; marker: L.Marker; latLng: L.LatLng; color?: string }[] = [];
    targetCustomMarker: { id: string; name: string; marker: L.Marker; latLng: L.LatLng; color?: string } | null = null;
    isMarkerContext = false;

    // Telemetría de coordenadas
    mouseCoords: { x: number; y: number } = { x: 0, y: 0 };
    coordsCopied = false;

    // Reloj de Los Santos
    inGameHours = 12;
    inGameMinutes = 0;
    inGameTimeStr = '12:00';
    private clockInterval: any;

    // -----------------------------------------------------------------------
    // GETTERS Y MÉTODOS DINÁMICOS
    // -----------------------------------------------------------------------
    getSafehouseCharacter(p: LocationItem): 'michael' | 'franklin' | 'trevor' | null {
        if (p.category !== 'safehouse') return null;
        const idLower = (p.id || '').toLowerCase();
        if (idLower.includes('michael')) return 'michael';
        if (idLower.includes('franklin')) return 'franklin';
        if (idLower.includes('trevor')) return 'trevor';
        const ownerLower = (p.owner || '').toLowerCase();
        if (ownerLower.includes('michael')) return 'michael';
        if (ownerLower.includes('franklin')) return 'franklin';
        if (ownerLower.includes('trevor')) return 'trevor';
        return null;
    }

    getPropertyFilterKey(p: LocationItem): string {
        if (p.category === 'safehouse') {
            const char = this.getSafehouseCharacter(p);
            if (char) return `safehouse_${char}`;
        }
        const isIndividual = p.category === 'character' || p.category === 'animal';
        return isIndividual ? p.id : p.category;
    }

    getSafehouseCount(char: 'michael' | 'franklin' | 'trevor'): number {
        return this.allProperties.filter(p => this.getSafehouseCharacter(p) === char).length;
    }

    get storyCharacters(): LocationItem[] {
        return this._storyCharacters;
    }

    get storyAnimals(): LocationItem[] {
        return this._storyAnimals;
    }

    get purchasablePropertiesCount(): number {
        return this.allProperties.filter(p =>
            this.isPurchasable(p) && (p.gameMode === 'both' || p.gameMode === 'story')
        ).length;
    }

    // -----------------------------------------------------------------------
    constructor(
        private locationService: LocationService,
        readonly translationService: TranslationService,
        private router: Router,
        public gotyService: GotyService
    ) {
        effect(() => {
            const lang = this.translationService.currentLanguage();
            if (this.map) {
                this.loadProperties();
                this.loadCollectibles();
            }
        });
    }

    // -----------------------------------------------------------------------
    // CICLO DE VIDA
    // -----------------------------------------------------------------------
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
                ...this.storyBusinessKeys,
                // Servicios
                ...this.serviceKeys,
                // Actividades
                ...this.activityKeys,
                'activity',
                // Coleccionables
                ...this.storyCollectibleKeys
            ];
            lowResDisabledKeys.forEach(k => {
                this.layerFilters[k] = false;
            });
        }
        this.startInGameClock();

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

        (window as any)._gtaSetMarkerColor = (id: string, color: string) => {
            const found = this.userCustomMarkers.find(m => m.id === id);
            if (found) {
                found.color = color;
                found.marker.setIcon(this.createPushpinIcon(color));
                this.updateCustomMarkerPopup(found);
                found.marker.openPopup();
            }
        };
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
        window.removeEventListener('resize', this.onWindowResize);
        if (this.clockInterval) clearInterval(this.clockInterval);
        delete (window as any)._gtaRenameMarker;
        delete (window as any)._gtaDeleteMarker;
        delete (window as any)._gtaSetMarkerColor;
        delete (window as any)._gtaSaveMarkerName;
        if (this.map) this.map.remove();
    }

    // -----------------------------------------------------------------------
    // MOTOR DE MAPA LEAFLET (duplicado intencionadamente — código legible)
    // -----------------------------------------------------------------------
    private initMap(mapType: string): void {
        if (this.map) this.map.remove();

        const mapContainer = document.getElementById('gta-map-historia');

        if (mapType === 'Satellite') {
            const lsOceanColor = '#0D2B4F'; // SatelliteHD: RGB(13, 43, 79)
            if (mapContainer) {
                mapContainer.style.backgroundColor = lsOceanColor;
            }
            // ---- Mapa oficial Rockstar Games Social Club — Ultra Alta Resolución ----
            const mapBounds = L.latLngBounds([[-192, 0], [0, 128]]);
            const maxBounds = L.latLngBounds([[-230, -25], [25, 155]]);
            const hdMinZoom = this.computeHdMinZoom();
            const isNarrow = typeof window !== 'undefined' && window.innerWidth <= 850;
            const initialZoom = isNarrow ? hdMinZoom : 2.5;

            this.map = L.map('gta-map-historia', {
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

            const tileLayer = L.tileLayer('assets/SatelliteHD/{z}_{x}_{y}.jpg', {
                tileSize: 256,
                minZoom: 0,
                maxNativeZoom: 7,
                maxZoom: this.maxZoom,
                noWrap: true,
                bounds: mapBounds
            });
            tileLayer.addTo(this.map);

        } else {
            // Tonos RGB exactos muestreados píxel a píxel del océano de Los Santos
            let lsOceanColor = '#143D6B';
            if (mapType === 'Roadmap') {
                lsOceanColor = '#1862AD';
            } else if (mapType === 'Atlas') {
                lsOceanColor = '#16A9D2';
            } else if (mapType === 'Juego') {
                lsOceanColor = '#434343'; // Radar en escala de grises: RGB(67, 67, 67)
            } else if (mapType === 'UV' || mapType === 'UV2') {
                lsOceanColor = '#05080c';
            }

            if (mapContainer) {
                mapContainer.style.backgroundColor = lsOceanColor;
            }

            // ---- Mapas estándar (Satellite, Roadmap, Atlas, Juego, UV) ----
            const mapBounds = L.latLngBounds([-64, 0], [0, 64]);
            const minZoom = this.computeMinZoom(this.imageSize);

            this.map = L.map('gta-map-historia', {
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
                tileUrl = 'assets/tiles/uv/{z}/{x}/{y}.jpg';
                if (mapType === 'UV2') tileClass = 'leaflet-tile-uv2';
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
        }

        this.playerMarkersLayer = L.layerGroup().addTo(this.map);
        this.collectibleMarkersLayer = L.layerGroup().addTo(this.map);

        this.renderDistrictLabels();
        this.loadProperties();
        this.loadCollectibles();
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

    private readonly onWindowResize = () => {
        if (!this.map) return;
        this.map.invalidateSize();
        if (this.currentMapType === 'Satellite') {
            const minZoom = this.computeHdMinZoom();
            this.map.setMinZoom(minZoom);
            if (this.map.getZoom() < minZoom) {
                this.map.setZoom(minZoom);
            }
        } else {
            const minZoom = this.computeMinZoom(this.imageSize);
            this.map.setMinZoom(minZoom);
            if (this.map.getZoom() < minZoom) {
                this.map.setZoom(minZoom);
            }
        }
        this.renderDistrictLabels();
    };

    private computeHdMinZoom(): number {
        const el = document.getElementById('gta-map-historia');
        const width  = el ? el.clientWidth  : 0;
        const height = el ? el.clientHeight : 0;
        if (width <= 0 || height <= 0) return 2.0;
        // El mapa HD mide 128×192 unidades en CRS.Simple a zoom 0
        const zoomForWidth  = Math.log2((width * 0.88) / 128);
        const zoomForHeight = Math.log2((height * 0.88) / 192);
        const targetZoom = Math.min(zoomForWidth, zoomForHeight);
        return Math.max(1.2, Math.min(this.maxZoom, Math.round(targetZoom * 10) / 10));
    }

    private computeMinZoom(imageSize: number): number {
        const el = document.getElementById('gta-map-historia');
        const width = el ? el.clientWidth : 0;
        const height = el ? el.clientHeight : 0;
        if (width <= 0 || height <= 0) return 2.0;
        const zoomForWidth = Math.log2((width * 0.88) / 64);
        const zoomForHeight = Math.log2((height * 0.88) / 64);
        const min = Math.min(zoomForWidth, zoomForHeight);
        return Math.max(1.2, Math.min(this.maxZoom, Math.round(min * 10) / 10));
    }

    // -----------------------------------------------------------------------
    // CONVERSIÓN COORDENADAS GTA ↔ LEAFLET
    // -----------------------------------------------------------------------
    worldToLatLng(x: number, y: number): [number, number] {
        if (this.currentMapType === 'Satellite') {
            const lng = 128 * ((x + 4140) / 9000);
            const lat = -192 * ((8400 - y) / 13500);
            return [lat, lng];
        }
        const originX = 3753.6;
        const originY = 5529.6;
        const scale   = 0.660;
        const px = originX + (scale * x);
        const py = originY - (scale * y);
        return [-py / 128, px / 128];
    }

    latLngToWorld(lat: number, lng: number): { x: number; y: number } {
        if (this.currentMapType === 'Satellite') {
            return {
                x: Math.round(((lng / 128) * 9000 - 4140) * 10) / 10,
                y: Math.round((8400 - (-lat / 192) * 13500) * 10) / 10
            };
        }
        const originX = 3753.6;
        const originY = 5529.6;
        const scale   = 0.660;
        const px = lng * 128;
        const py = -lat * 128;
        return {
            x: Math.round(((px - originX) / scale) * 10) / 10,
            y: Math.round(((originY - py) / scale) * 10) / 10
        };
    }


    // -----------------------------------------------------------------------
    // CARGA DE DATOS — Historia filtra solo gameMode 'story' | 'both'
    // -----------------------------------------------------------------------
    private loadProperties(): void {
        this.locationService.getProperties('story').subscribe({
            next: (properties) => {
                this.allProperties = properties;
                this.recomputeDerivedLists();
                this.allProperties.forEach(p => {
                    const filterKey = this.getPropertyFilterKey(p);
                    if (this.layerFilters[filterKey] === undefined) {
                        this.layerFilters[filterKey] = true;
                    }
                });
                this.renderPropertyMarkers();
            },
            error: (err) => console.error('[Historia] Error al cargar propiedades:', err)
        });
    }

    // -----------------------------------------------------------------------
    // CARGA DE COLECCIONABLES HISTORIA
    // -----------------------------------------------------------------------
    /**
     * Carga los coleccionables exclusivos de Modo Historia (fragmentos de carta, piezas de nave, tratados de Epsilon, etc.).
     */
    private loadCollectibles(): void {
        this.locationService.getCollectibles(undefined, undefined, 'story').subscribe({
            next: (items) => {
                this.allCollectibles = items;
                this.allCollectibles.forEach(c => {
                    if (this.layerFilters[c.category] === undefined) {
                        this.layerFilters[c.category] = true;
                    }
                });
                this.renderCollectibleMarkers();
            },
            error: (err) => console.error('[Historia] Error al cargar coleccionables:', err)
        });
    }

    /**
     * Dibuja los marcadores de propiedades de Modo Historia (casas de Michael, Franklin, Trevor, negocios, tiendas y servicios).
     */
    private renderPropertyMarkers(): void {
        const map = this.map;
        if (!map) return;

        this.propertyMarkers.forEach(p => p.marker.remove());
        this.propertyMarkers = [];

        this.allProperties.forEach(p => {
            const filterKey = this.getPropertyFilterKey(p);
            if (this.layerFilters[filterKey] === false) return;

            const [lat, lng] = this.worldToLatLng(p.position.x, p.position.y);
            const isPurchasable = this.isPurchasable(p);

            let pinSymbol = (p.badge?.symbol || (p as any).icon) || '•';
            if (p.category === 'safehouse')      pinSymbol = '🏠';
            if (p.category === 'police_station') pinSymbol = '⭐';
            if (p.category === 'hospital')       pinSymbol = '🩸';
            if (p.category === 'fire_station')   pinSymbol = '🚒';
            if (p.category === 'bunker')         pinSymbol = '🔻';
            if (p.category === 'shipwreck')      pinSymbol = '⚓';
            if (p.category === 'car_wash')       pinSymbol = '🚿';
            if (p.category === 'golf')             pinSymbol = '⛳';
            if (p.category === 'darts')            pinSymbol = '🎯';
            if (p.category === 'tennis')           pinSymbol = '🎾';
            if (p.category === 'stunt_jump')       pinSymbol = '🚧';
            if (p.category === 'under_the_bridge') pinSymbol = '🛩️';
            if (p.category === 'knife_flight')     pinSymbol = '✈️';
            if (p.category === 'parachuting')      pinSymbol = '🪂';
            if (p.category === 'service' || p.id.startsWith('ammu-')) pinSymbol = '🔫';

            let pinColor = (p.badge?.color || (p as any).color);
            if (p.category === 'safehouse') {
                const char = this.getSafehouseCharacter(p);
                if (char === 'michael') pinColor = '#3498db';
                else if (char === 'franklin') pinColor = '#2ecc71';
                else if (char === 'trevor') pinColor = '#e67e22';
            }

            // Icono: FA "simple" o círculo neón según tema seleccionado
            let faIcon = p.badge?.icon || (p as any).icon || 'location-dot';
            if (p.category === 'service' || p.id.startsWith('ammu-')) faIcon = 'gun';
            const iconSizeVal: [number, number] = (p.category === 'shipwreck' || p.category === 'fake_ufo') ? [22, 22] : [20, 20];

            let htmlContent: string;
            let iconDivClass: string;
            let iconSize: [number, number];
            let iconAnchor: [number, number];
            let popupAnchor: [number, number];

            if (p.category === 'fake_ufo') {
                const ufoSymbol = p.badge?.symbol || '🛸';
                htmlContent = `<div style="font-size: 26px; filter: drop-shadow(0 0 8px ${pinColor}) drop-shadow(0px 2px 4px rgba(0,0,0,0.9)); text-align: center; line-height:1; cursor: pointer;">${ufoSymbol}</div>`;
                iconDivClass = 'gta-pin-wrapper-fa';
                iconSize = [26, 26];
                iconAnchor = [13, 13];
                popupAnchor = [0, -13];
            } else if (this.iconTheme === 'standard') {
                // Estándar se deja vacío sin vincular a nada (a rellenar más adelante)
                htmlContent = `<div class="gta-pin-standard-empty"></div>`;
                iconDivClass = 'gta-pin-wrapper-empty';
                iconSize = [0, 0];
                iconAnchor = [0, 0];
                popupAnchor = [0, 0];
            } else if (this.iconTheme === 'simple') {
                htmlContent = `<div style="color: ${pinColor}; font-size: ${iconSizeVal[0]}px; filter: drop-shadow(0px 2px 3px rgba(0,0,0,0.9)); text-align: center; line-height:1;"><i class="fa-solid fa-${faIcon}"></i></div>`;
                iconDivClass = 'gta-pin-wrapper-fa';
                iconSize = iconSizeVal;
                iconAnchor = [iconSizeVal[0] / 2, iconSizeVal[1] / 2];
                popupAnchor = [0, -iconSizeVal[1] / 2];
            } else {
                htmlContent = `<div class="gta-pin gta-pin-${p.category}" style="--pin-color: ${pinColor}"><span class="gta-pin-symbol" style="color: ${p.category === 'character' ? '#f5cd2f' : 'var(--pin-color, #ffb833)'}; font-weight: 800;">${pinSymbol}</span></div>`;
                iconDivClass = 'gta-pin-wrapper';
                iconSize = [22, 22];
                iconAnchor = [11, 22];
                popupAnchor = [0, -20];
            }

            const icon = L.divIcon({
                className: iconDivClass,
                html: htmlContent,
                iconSize,
                iconAnchor,
                popupAnchor
            });

            const priceLbl = this.translationService.t('gta5.popups.price');
            const poiLbl = this.translationService.t('gta5.popups.pointOfInterest');

            const priceSectionHtml = isPurchasable
                ? `<div class="popup-price-box"><span class="price-title">${priceLbl}</span><span class="price-num">${p.priceFormatted}</span></div>`
                : `<div class="popup-service-tag-box"><span class="service-type-badge">${p.categoryLabel}</span><span class="service-status-text">${p.priceFormatted || poiLbl}</span></div>`;

            const popupHtml = `
                <div class="gta-popup-card">
                    <div class="popup-banner" style="background: linear-gradient(135deg, ${pinColor}33, #0b0f14 85%); border-bottom: 2px solid ${pinColor};">
                        <span class="popup-badge" style="color: ${pinColor}; border-color: ${pinColor}66">${p.categoryLabel}</span>
                        <h4 class="popup-title">${p.name}</h4>
                        <div class="popup-zone">${p.zone}</div>
                    </div>
                    <div class="popup-content">
                        ${priceSectionHtml}
                        <p class="popup-desc">${p.description}</p>
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
     * Dibuja los coleccionables del Modo Historia sobre su propia capa de grupo en Leaflet.
     */
    private renderCollectibleMarkers(): void {
        const map = this.map;
        if (!map) return;

        if (!this.collectibleMarkersLayer) {
            this.collectibleMarkersLayer = L.layerGroup().addTo(map);
        }
        this.collectibleMarkersLayer.clearLayers();
        this.collectibleMarkers = [];

        const rewardLabel = this.translationService.t('gta5.popups.reward') || 'Recompensa:';

        this.allCollectibles.forEach(item => {
            if (this.layerFilters[item.category] === false) return;

            const [lat, lng] = this.worldToLatLng(item.position.x, item.position.y);
            const colColor = item.badge?.color || (item as any).color || '#ffb833';
            const isEpsilon = item.category === 'epsilon_tract';
            const pinSymbol = isEpsilon ? '✝' : (item.badge?.symbol || '•');
            const symbolStyle = isEpsilon
                ? 'color: #ffffff !important; font-size: 14px; font-weight: 900; line-height: 1; text-shadow: 0 0 4px #ffffff, 0 0 8px #38bdf8;'
                : `color: ${colColor}; font-weight: 700; line-height: 1;`;
            const colFaIcon = item.badge?.icon || (item as any).icon || 'star';

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
                // 2. Font Awesome: icono fa-solid
                htmlContent = `<div style="color: ${colColor}; font-size: 13px; filter: drop-shadow(0px 1px 2px rgba(0,0,0,0.8)); text-align: center; line-height:1;"><i class="fa-solid fa-${colFaIcon}"></i></div>`;
                iconDivClass = 'gta-pin-collectible-wrapper-fa';
                iconSize = [16, 16];
                iconAnchor = [8, 8];
                popupAnchor = [0, -8];
            } else {
                // 3. Clásico: cuadrado o círculo con color de categoría y símbolo/emoji
                htmlContent = `<div class="gta-pin-collectible" style="background: ${colColor}"><span class="gta-pin-col-symbol" style="${symbolStyle}">${pinSymbol}</span></div>`;
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

            const rewardHtml = item.reward
                ? `<div class="popup-reward-badge" style="display: flex; align-items: center; gap: 6px; font-size: 11px; background: rgba(56, 189, 248, 0.12); border: 1px solid rgba(56, 189, 248, 0.35); border-radius: 6px; padding: 6px 10px; color: #bae6fd; margin-top: 8px;">
                    <span style="font-size: 13px;">🎁</span>
                    <span><strong>${rewardLabel}:</strong> ${item.reward}</span>
                   </div>`
                : '';

            const popupHtml = `
                <div class="gta-popup-card">
                    <div class="popup-banner" style="background: linear-gradient(135deg, ${(item.badge?.color || (item as any).color)}33, #0b0f14 85%); border-bottom: 2px solid ${(item.badge?.color || (item as any).color)};">
                        <span class="popup-badge" style="color: ${(item.badge?.color || (item as any).color)}; border-color: ${(item.badge?.color || (item as any).color)}66">${item.categoryLabel} (#${item.number}/${item.total})</span>
                        <h4 class="popup-title">${item.name}</h4>
                        <div class="popup-zone">${item.zone}</div>
                    </div>
                    <div class="popup-content">
                        <p class="popup-desc" style="margin: 0; font-size: 12px; line-height: 1.45; color: rgba(255,255,255,0.9);">${item.hint}</p>
                        ${rewardHtml}
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

            this.collectibleMarkersLayer?.addLayer(marker);
            this.collectibleMarkers.push({ marker, item });
        });
    }

    // -----------------------------------------------------------------------
    // CONTROLES DE UI — Panel de capas
    // -----------------------------------------------------------------------
    toggleLayer(categoryKey: string): void {
        const current = this.layerFilters[categoryKey] !== false;
        this.layerFilters[categoryKey] = !current;
        this.renderPropertyMarkers();
        this.renderCollectibleMarkers();
    }

    toggleLegend(): void {
        this.legendOpen = !this.legendOpen;
    }

    toggleSettings(): void {
        this.settingsOpen = !this.settingsOpen;
    }
    toggleSection(section: string): void { this.accordion[section] = !this.accordion[section]; }

    isSectionAllActive(keys: string[]): boolean {
        return keys.length > 0 && keys.every(k => this.layerFilters[k] !== false);
    }

    onSectionCheckboxChange(keys: string[], event: Event): void {
        const input = event.target as HTMLInputElement;
        keys.forEach(k => { this.layerFilters[k] = input.checked; });
        this.renderPropertyMarkers();
        this.renderCollectibleMarkers();
    }

    getCategoryCount(categoryKey: string): number {
        return this.allProperties.filter(p => p.category === categoryKey).length;
    }

    getCollectibleCount(categoryKey: string): number {
        return this.allCollectibles.filter(c => c.category === categoryKey).length;
    }

    // -----------------------------------------------------------------------
    // NAVEGACIÓN POR ZONAS
    // -----------------------------------------------------------------------
    onZoneChange(zone: string): void {
        this.selectedZone = zone;
        if (!this.map) return;
        switch (zone) {
            case 'city':   this.map.flyTo([-45.5, 29],  4.2, { duration: 1.2 }); break;
            case 'sandy':  this.map.flyTo([-23, 40],    4.2, { duration: 1.2 }); break;
            case 'paleto': this.map.flyTo([-10.5, 27.5],4.4, { duration: 1.2 }); break;
            case 'blaine': this.map.flyTo([-22, 34],    3.5, { duration: 1.2 }); break;
            case 'chumash':this.map.flyTo([-34, 11],    4.2, { duration: 1.2 }); break;
            default:
                this.map.flyTo([-36, 30], this.computeMinZoom(this.imageSize), { duration: 1 });
        }
    }

    switchMapType(mapType: string): void {
        this.currentMapType = mapType;
        this.initMap(mapType);
    }

    zoomIn():  void { if (this.map) this.map.zoomIn(); }
    zoomOut(): void { if (this.map) this.map.zoomOut(); }

    // -----------------------------------------------------------------------
    // ZOOM A PERSONAJE
    // -----------------------------------------------------------------------
    zoomToCharacter(char: LocationItem, event?: MouseEvent): void {
        if (event) event.stopPropagation();
        if (!this.map) return;

        if (!this.layerFilters[char.id]) {
            this.layerFilters[char.id] = true;
            this.renderPropertyMarkers();
        }

        const [lat, lng] = this.worldToLatLng(char.position.x, char.position.y);
        this.map.flyTo([lat, lng], Math.min(this.maxZoom, 5.5), { animate: true, duration: 1.1 });

        setTimeout(() => {
            const match = this.propertyMarkers.find(pm => pm.property.id === char.id);
            if (match) match.marker.openPopup();
        }, 850);
    }

    // -----------------------------------------------------------------------
    // MENÚ CONTEXTUAL Y MARCADORES DE USUARIO
    // -----------------------------------------------------------------------
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
            this.ctxLatLng = this.map.containerPointToLatLng(L.point(event.clientX, event.clientY));
        }
    }

    closeContextMenu(): void { this.ctxOpen = false; }

    runCtxAction(action: string): void {
        this.ctxOpen = false;
        if (!this.map) return;

        switch (action) {
            case 'centrar':
                if (this.ctxLatLng) this.map.panTo(this.ctxLatLng, { animate: true });
                break;
            case 'marcador':
                if (this.ctxLatLng && this.playerMarkersLayer) {
                    const id = 'custom-' + Date.now();
                    const name = 'Marcador ' + (this.userCustomMarkers.length + 1);
                    const m = L.marker(this.ctxLatLng, { icon: this.createPushpinIcon('red') });
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
                    const newName = prompt('Nuevo nombre del marcador:', this.targetCustomMarker.name);
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

    focusCustomMarker(cm: { id: string; name: string; marker: L.Marker; latLng: L.LatLng; color?: string }): void {
        if (!this.map || !cm) return;
        const targetZoom = Math.max(this.map.getZoom(), 4.5);
        this.map.flyTo(cm.latLng, targetZoom, { animate: true, duration: 0.8 });
        setTimeout(() => {
            cm.marker.openPopup();
        }, 500);
    }

    private readonly pushpinPalettes: Record<string, { s0: string; s35: string; s85: string; s100: string }> = {
        red:    { s0: '#ff7575', s35: '#e61919', s85: '#a80707', s100: '#5a0000' },
        blue:   { s0: '#60a5fa', s35: '#2563eb', s85: '#1d4ed8', s100: '#1e3a8a' },
        green:  { s0: '#4ade80', s35: '#16a34a', s85: '#15803d', s100: '#14532d' },
        yellow: { s0: '#fef08a', s35: '#eab308', s85: '#ca8a04', s100: '#713f12' },
        orange: { s0: '#fdba74', s35: '#ea580c', s85: '#c2410c', s100: '#7c2d12' },
        purple: { s0: '#d8b4fe', s35: '#9333ea', s85: '#7e22ce', s100: '#581c87' },
        white:  { s0: '#ffffff', s35: '#e2e8f0', s85: '#94a3b8', s100: '#475569' }
    };

    private createPushpinIcon(colorKey = 'red'): L.DivIcon {
        const pal = this.pushpinPalettes[colorKey] || this.pushpinPalettes['red'];
        const gradId = 'gtaPinHead_' + colorKey;
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
                        </defs>
                        <polygon points="14.8,20 17.2,20 16.3,38 15.7,38" fill="#d6dadf"/>
                        <ellipse cx="16" cy="7.5" rx="7.8" ry="6.8" fill="url(#${gradId})"/>
                    </svg>
                </div>
            `,
            iconSize: [32, 40],
            iconAnchor: [16, 38],
            popupAnchor: [0, -36]
        });
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
                    <button type="button" class="btn-marker-action btn-marker-delete" onclick="window._gtaDeleteMarker('${item.id}')" style="width: 100%; padding: 4px 6px; font-size: 10px;">🗑️ ${deleteLbl}</button>
                </div>
            </div>
        `;
        item.marker.bindPopup(html, { className: 'gta-custom-pin-popup', maxWidth: 170, minWidth: 135, autoPan: true });
    }

    // -----------------------------------------------------------------------
    // TELEMETRÍA Y UTILIDADES
    // -----------------------------------------------------------------------
    copyCurrentCoords(): void {
        const text = `X: ${this.mouseCoords.x.toFixed(1)}, Y: ${this.mouseCoords.y.toFixed(1)}`;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                this.coordsCopied = true;
                setTimeout(() => this.coordsCopied = false, 1800);
            });
        }
    }

    isPurchasable(p: LocationItem): boolean {
        const nonPurchasable = ['safehouse','police_station','hospital','fire_station','car_wash','convenience_store','service','strip_club','ls_customs','hao_garage','character','animal'];
        if (nonPurchasable.includes(p.category)) return false;
        return (p.price || 0) > 0;
    }

    // -----------------------------------------------------------------------
    // RELOJ DE LOS SANTOS
    // -----------------------------------------------------------------------
    private startInGameClock(): void {
        const now = new Date();
        const totalReal = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
        const inGameTotal = (totalReal * 30) % 86400;
        this.inGameHours = Math.floor(inGameTotal / 3600);
        this.inGameMinutes = Math.floor((inGameTotal % 3600) / 60);
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

    updateIconStyle(): void {
        if (!this.map) return;
        const container = this.map.getContainer();
        container.classList.remove('icon-size-compact','icon-size-standard','icon-size-large','icon-theme-neon','icon-theme-classic',
            'icon-theme-standard', 'icon-theme-simple');
        container.classList.add(`icon-size-${this.iconSize}`, `icon-theme-${this.iconTheme}`);
        // Rerenderizamos para aplicar el nuevo estilo de icono
        this.renderPropertyMarkers();
        this.renderCollectibleMarkers();
    }

    private mysteryMarker: L.Marker | null = null;

    /**
     * Centra el mapa sobre la ubicación del misterio, cierra el drawer lateral
     * y genera un marcador destacado con animación y popup informativo.
     */
    focusMysteryLocation(mystery: any): void {
        if (!this.map || !mystery?.position) return;
        this.closeProfileDrawer();

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
