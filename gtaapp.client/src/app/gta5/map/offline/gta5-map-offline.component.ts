import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, HostListener, ViewChild, ChangeDetectorRef, effect, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import * as L from 'leaflet';
import { LocationService } from '../../../services/gta5/location.service';
import { LocationItem, FaunaAnimalGroup } from '../../../models/gta5/location';
import { CollectibleItem } from '../../../models/gta5/collectible';
import { GtaMystery, MysteryPoint } from '../../../models/gta5/mystery';
import { TranslationService } from '../../../i18n';
import { GotyService } from '../../../services/goty.service';
import { Gta5MysteryPopupService } from '../../../services/gta5/gta5-mystery-popup.service';
import { Gta5MapMarkerService } from '../../../services/gta5/gta5-map-marker.service';
import { gta5WorldToLatLng, gta5LatLngToWorld } from '../../../utils/gta5-map-projection';


// ---------------------------------------------------------------------------
// GTA V — MODO HISTORIA
// Componente completamente independiente del modo Online.
// Comparte el mismo mapa base (tiles Leaflet 8192x8192) pero tiene:
//   - Sus propios datasets (coleccionables de historia, misiones, personajes narrativos)
//   - Su propio panel de control (sin negocios Online, sin naipes, sin señalizadores...)
//   - Sus propias categorías y filtros de capa
// ---------------------------------------------------------------------------

@Component({
    selector: 'app-gta5-map-offline',
    templateUrl: './gta5-map-offline.component.html',
    styleUrls: ['./gta5-map-offline.component.css'],
    standalone: false
})
export class Gta5MapOfflineComponent implements OnInit, AfterViewInit, OnDestroy {

    @ViewChild('mapWrapper', { static: true }) private mapWrapper!: ElementRef<HTMLElement>;
    isFullscreen = false;

    private propertiesSub?: Subscription;
    private collectiblesSub?: Subscription;

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
        'strip_club',
        'barber',
        'tattoo'
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
    // Fragmentos de carta (50), Piezas de nave espacial (50), Desperdicios nucleares (30), Piezas de submarino (30), Tratados de Epsilon (10), Plantas de peyote (27), Mosaicos de mono (50)
    readonly storyCollectibleKeys = [
        'letter_scrap',     // 50 fragmentos de carta
        'spaceship_part',   // 50 piezas de nave espacial
        'nuclear_waste',    // 30 desperdicios nucleares
        'submarine_part',   // 30 piezas de submarino
        'epsilon_tract',    // 10 tratados de Epsilon
        'peyote_plant',     // 27 plantas de peyote
        'monkey_mosaic'     // 50 mosaicos de mono
    ];

    private _storyCharacters: LocationItem[] = [];
    private _storyAnimals: LocationItem[] = [];
    private _faunaGroups: FaunaAnimalGroup[] = [];
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
        this.updateFaunaGroups();
    }

    get characterKeys(): string[] { return this._characterKeys; }
    get faunaKeys(): string[] { return this._faunaKeys; }

    // -----------------------------------------------------------------------
    // ESTADO DE FILTROS DE CAPAS
    // -----------------------------------------------------------------------
    layerFilters: { [key: string]: boolean } = {
        // Casas de protagonistas
        safehouse_michael:    false,
        safehouse_franklin:   false,
        safehouse_trevor:     false,
        // Negocios comprables historia
        purchasable_business: true,
        // Talleres
        ls_customs:  false,
        hao_garage:  false,
        // Servicios
        police_station:    false,
        hospital:          false,
        fire_station:      false,
        service:           false,
        convenience_store: false,
        mask_shop:         false,
        car_wash:          false,
        strip_club:        false,
        barber:            false,
        tattoo:            false,
        // Actividades
        activity: false,
        golf: false,
        darts: false,
        tennis: false,
        stunt_jump: false,
        under_the_bridge: false,
        knife_flight: false,
        parachuting: false,
        // Lugares extraños
        fake_ufo:   false,
        shipwreck:  false,
        cave:       false,
        // Coleccionables de Historia
        letter_scrap:   false,
        spaceship_part: false,
        nuclear_waste:  false,
        submarine_part: false,
        epsilon_tract:  false,
        peyote_plant:   false,
        monkey_mosaic:  false
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
            this.router.navigate(['/gta6-map-offline']).catch(err => console.error('[Historia] Error en la navegación entre mapas:', err));
        } else {
            this.router.navigate(['/gta5-map-offline']).catch(err => console.error('[Historia] Error en la navegación entre mapas:', err));
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
    userCustomMarkers: { id: string; name: string; marker: L.Marker; latLng: L.LatLng; color?: string; x?: number; y?: number; visible?: boolean }[] = [];
    targetCustomMarker: { id: string; name: string; marker: L.Marker; latLng: L.LatLng; color?: string; x?: number; y?: number; visible?: boolean } | null = null;
    isMarkerContext = false;

    // Telemetría de coordenadas
    mouseCoords: { x: number; y: number } = { x: 0, y: 0 };
    coordsCopied = false;

    // Reloj de Los Santos
    inGameHours = 12;
    inGameMinutes = 0;
    inGameTimeStr = '12:00';
    private clockInterval: ReturnType<typeof setInterval> | null = null;

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

    private updateFaunaGroups(): void {
        const groupsMap = new Map<string, FaunaAnimalGroup>();
        this._storyAnimals.forEach(animal => {
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

    private _faunaCycleIndex: Record<string, number> = {};

    zoomToFaunaGroup(group: FaunaAnimalGroup, event?: MouseEvent): void {
        if (event) event.stopPropagation();
        if (!this.map || !group.keys.length) return;

        let reRender = false;
        group.keys.forEach(k => {
            if (!this.layerFilters[k]) {
                this.layerFilters[k] = true;
                reRender = true;
            }
        });
        if (reRender) {
            this.renderPropertyMarkers();
        }

        const currIndex = this._faunaCycleIndex[group.name] || 0;
        const targetKey = group.keys[currIndex % group.keys.length];
        this._faunaCycleIndex[group.name] = (currIndex + 1) % group.keys.length;

        const targetAnimal = this.allProperties.find(p => p.id === targetKey);
        if (targetAnimal && targetAnimal.position) {
            const [lat, lng] = this.worldToLatLng(targetAnimal.position.x, targetAnimal.position.y);
            this.map.flyTo([lat, lng], Math.min(this.maxZoom, 5.5), { animate: true, duration: 1.1 });
        }
    }

    get purchasablePropertiesCount(): number {
        return this.allProperties.filter(p =>
            this.isPurchasable(p) && (p.gameMode === 'both' || p.gameMode === 'story')
        ).length;
    }

    private readonly locationService = inject(LocationService);
    readonly translationService = inject(TranslationService);
    private readonly router = inject(Router);
    public readonly gotyService = inject(GotyService);
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly mysteryPopupService = inject(Gta5MysteryPopupService);
    private readonly mapMarkerService = inject(Gta5MapMarkerService);

    // -----------------------------------------------------------------------
    constructor() {
        effect(() => {
            this.translationService.currentLanguage();
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
        if (typeof window !== 'undefined' && window.innerWidth <= 850) {
            this.iconTheme = 'simple';
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

        this.bindCustomMarkerEvents();
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
            found.name = newName;
            if (this.targetCustomMarker?.id === id) {
                this.targetCustomMarker.name = found.name;
            }
            if (found.marker.getTooltip()) {
                const tooltipBold = document.createElement('b');
                tooltipBold.textContent = found.name || (this.translationService.currentLang === 'es' ? 'Marcador' : 'Marker');
                found.marker.setTooltipContent(tooltipBold);
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
        window.removeEventListener('resize', this.onWindowResize);
        if (this.clockInterval) clearInterval(this.clockInterval);
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

            const tileLayer = L.tileLayer('assets/mapas/gta5/SatelliteHD/{z}_{x}_{y}.jpg', {
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
                tileUrl = 'assets/mapas/gta5/tiles/uv/{z}/{x}/{y}.jpg';
                if (mapType === 'UV2') tileClass = 'leaflet-tile-uv2';
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
        }

        this.playerMarkersLayer = L.layerGroup().addTo(this.map);
        this.collectibleMarkersLayer = L.layerGroup().addTo(this.map);

        this.bindCustomMarkerEvents();
        this.renderDistrictLabels();
        this.loadProperties();
        this.loadCollectibles();
        this.loadCustomMarkers();
        this.updateIconStyle();

        this.map.on('mousemove', (e: L.LeafletMouseEvent) => {
            this.mouseCoords = this.latLngToWorld(e.latlng.lat, e.latlng.lng);
        });

        let currentTooltip: L.Tooltip | null = null;
        this.map.on('tooltipopen', (e: L.TooltipEvent) => {
            if (currentTooltip && currentTooltip !== e.tooltip) {
                this.map?.closeTooltip(currentTooltip);
            }
            currentTooltip = e.tooltip;
        });
        this.map.on('tooltipclose', (e: L.TooltipEvent) => {
            if (currentTooltip === e.tooltip) {
                currentTooltip = null;
            }
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

    private computeMinZoom(_imageSize: number): number {
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
        return gta5WorldToLatLng(x, y, { mapType: this.currentMapType });
    }

    latLngToWorld(lat: number, lng: number): { x: number; y: number } {
        return gta5LatLngToWorld(lat, lng, { mapType: this.currentMapType });
    }


    // -----------------------------------------------------------------------
    // CARGA DE DATOS — Historia filtra solo gameMode 'story' | 'both'
    // -----------------------------------------------------------------------
    private loadProperties(): void {
        this.propertiesSub?.unsubscribe();
        this.propertiesSub = this.locationService.getProperties('story').subscribe({
            next: (properties) => {
                this.allProperties = properties;
                this.recomputeDerivedLists();
                this.allProperties.forEach(p => {
                    const filterKey = this.getPropertyFilterKey(p);
                    if (this.layerFilters[filterKey] === undefined) {
                        this.layerFilters[filterKey] = false;
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
        this.collectiblesSub?.unsubscribe();
        this.collectiblesSub = this.locationService.getCollectibles(undefined, undefined, 'story').subscribe({
            next: (items) => {
                this.allCollectibles = items;
                this.allCollectibles.forEach(c => {
                    if (this.layerFilters[c.category] === undefined) {
                        this.layerFilters[c.category] = false;
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

            let pinSymbol = p.badge?.symbol || '•';
            if (p.category === 'safehouse')      pinSymbol = '🏠';
            if (p.category === 'police_station') pinSymbol = '⭐';
            if (p.category === 'hospital')       pinSymbol = '🩸';
            if (p.category === 'fire_station')   pinSymbol = '🚒';
            if (p.category === 'bunker')         pinSymbol = '🔻';
            if (p.category === 'shipwreck')      pinSymbol = '⚓';
            if (p.category === 'cave')           pinSymbol = '🕳️';
            if (p.category === 'car_wash')       pinSymbol = '🚿';
            if (p.category === 'golf')             pinSymbol = '⛳';
            if (p.category === 'darts')            pinSymbol = '🎯';
            if (p.category === 'tennis')           pinSymbol = '🎾';
            if (p.category === 'stunt_jump')       pinSymbol = '🚧';
            if (p.category === 'under_the_bridge') pinSymbol = '🛩️';
            if (p.category === 'knife_flight')     pinSymbol = '✈️';
            if (p.category === 'parachuting')      pinSymbol = '🪂';
            if (p.category === 'service' || p.id.startsWith('ammu-')) pinSymbol = '🔫';
            if (p.category === 'barber') pinSymbol = '✂️';
            if (p.category === 'tattoo') pinSymbol = '🎨';

            let pinColor = p.badge?.color || '#ffb833';
            if (p.category === 'safehouse') {
                const char = this.getSafehouseCharacter(p);
                if (char === 'michael') pinColor = '#3498db';
                else if (char === 'franklin') pinColor = '#2ecc71';
                else if (char === 'trevor') pinColor = '#e67e22';
            }

            // Icono: FA "simple" o círculo neón según tema seleccionado
            let faIcon = p.badge?.icon || 'location-dot';
            if (p.category === 'service' || p.id.startsWith('ammu-')) faIcon = 'gun';
            if (p.category === 'barber') faIcon = 'scissors';
            if (p.category === 'tattoo') faIcon = 'pen-nib';
            const iconSizeVal: [number, number] = (p.category === 'shipwreck' || p.category === 'fake_ufo') ? [22, 22] : [20, 20];

            let iconElement: HTMLElement;
            let iconDivClass: string;
            let iconSize: [number, number];
            let iconAnchor: [number, number];
            let popupAnchor: [number, number];

            if (p.category === 'fake_ufo') {
                const ufoSymbol = p.badge?.symbol || '🛸';
                const el = document.createElement('div');
                el.style.fontSize = '26px';
                el.style.filter = `drop-shadow(0 0 8px ${pinColor}) drop-shadow(0px 2px 4px rgba(0,0,0,0.9))`;
                el.style.textAlign = 'center';
                el.style.lineHeight = '1';
                el.style.cursor = 'pointer';
                el.textContent = ufoSymbol;
                iconElement = el;
                iconDivClass = 'gta-pin-wrapper-fa';
                iconSize = [26, 26];
                iconAnchor = [13, 13];
                popupAnchor = [0, -13];
            } else if (this.iconTheme === 'standard') {
                const el = document.createElement('div');
                el.className = 'gta-pin-standard-empty';
                iconElement = el;
                iconDivClass = 'gta-pin-wrapper-empty';
                iconSize = [0, 0];
                iconAnchor = [0, 0];
                popupAnchor = [0, 0];
            } else if (this.iconTheme === 'simple') {
                const el = document.createElement('div');
                el.style.color = pinColor;
                el.style.fontSize = `${iconSizeVal[0]}px`;
                el.style.filter = 'drop-shadow(0px 2px 3px rgba(0,0,0,0.9))';
                el.style.textAlign = 'center';
                el.style.lineHeight = '1';
                const iEl = document.createElement('i');
                iEl.className = `fa-solid fa-${faIcon}`;
                el.appendChild(iEl);
                iconElement = el;
                iconDivClass = 'gta-pin-wrapper-fa';
                iconSize = iconSizeVal;
                iconAnchor = [iconSizeVal[0] / 2, iconSizeVal[1] / 2];
                popupAnchor = [0, -iconSizeVal[1] / 2];
            } else {
                const el = document.createElement('div');
                el.className = `gta-pin gta-pin-${p.category}`;
                el.style.setProperty('--pin-color', pinColor);
                const span = document.createElement('span');
                span.className = 'gta-pin-symbol';
                span.style.color = p.category === 'character' ? '#f5cd2f' : 'var(--pin-color, #ffb833)';
                span.style.fontWeight = '800';
                span.textContent = pinSymbol;
                el.appendChild(span);
                iconElement = el;
                iconDivClass = 'gta-pin-wrapper';
                iconSize = [22, 22];
                iconAnchor = [11, 22];
                popupAnchor = [0, -20];
            }

            const icon = L.divIcon({
                className: iconDivClass,
                html: iconElement,
                iconSize,
                iconAnchor,
                popupAnchor
            });

            const popupHtml = this.mapMarkerService.buildLocationPopupHtml(p, {
                priceLabel: this.translationService.t('gta5.popups.price'),
                pointOfInterestLabel: this.translationService.t('gta5.popups.pointOfInterest'),
                robbableStoreLabel: this.translationService.t('gta5.popups.robbableStore')
            });

            const tooltipEl = document.createElement('div');
            const nameB = document.createElement('b');
            nameB.textContent = p.name;
            tooltipEl.appendChild(nameB);
            const subSpan = document.createElement('span');
            subSpan.style.display = 'block';
            if (isPurchasable) {
                subSpan.style.color = '#2ecc71';
                subSpan.textContent = p.priceFormatted || '';
            } else {
                subSpan.style.color = '#3498db';
                subSpan.textContent = p.categoryLabel;
            }
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
            const colColor = item.badge?.color || '#ffb833';
            const isEpsilon = item.category === 'epsilon_tract';
            const pinSymbol = isEpsilon ? '✝' : (item.badge?.symbol || '•');
            const colFaIcon = item.badge?.icon || 'star';

            let iconElement: HTMLElement;
            let iconDivClass: string;
            let iconSize: [number, number];
            let iconAnchor: [number, number];
            let popupAnchor: [number, number];

            // 1. Estándar: vacío sin vincular
            if (this.iconTheme === 'standard') {
                const el = document.createElement('div');
                el.className = 'gta-pin-collectible-standard-empty';
                iconElement = el;
                iconDivClass = 'gta-pin-collectible-wrapper-empty';
                iconSize = [0, 0];
                iconAnchor = [0, 0];
                popupAnchor = [0, 0];
            } else if (this.iconTheme === 'simple') {
                // 2. Font Awesome: icono fa-solid
                const el = document.createElement('div');
                el.style.color = colColor;
                el.style.fontSize = '13px';
                el.style.filter = 'drop-shadow(0px 1px 2px rgba(0,0,0,0.8))';
                el.style.textAlign = 'center';
                el.style.lineHeight = '1';
                const iEl = document.createElement('i');
                iEl.className = `fa-solid fa-${colFaIcon}`;
                el.appendChild(iEl);
                iconElement = el;
                iconDivClass = 'gta-pin-collectible-wrapper-fa';
                iconSize = [16, 16];
                iconAnchor = [8, 8];
                popupAnchor = [0, -8];
            } else {
                // 3. Clásico: cuadrado o círculo con color de categoría y símbolo/emoji
                const el = document.createElement('div');
                el.className = 'gta-pin-collectible';
                el.style.background = colColor;
                const span = document.createElement('span');
                span.className = 'gta-pin-col-symbol';
                if (isEpsilon) {
                    span.style.color = '#ffffff';
                    span.style.fontSize = '14px';
                    span.style.fontWeight = '900';
                    span.style.lineHeight = '1';
                    span.style.textShadow = '0 0 4px #ffffff, 0 0 8px #38bdf8';
                } else {
                    span.style.color = colColor;
                    span.style.fontWeight = '700';
                    span.style.lineHeight = '1';
                }
                span.textContent = pinSymbol;
                el.appendChild(span);
                iconElement = el;
                iconDivClass = 'gta-pin-collectible-wrapper';
                iconSize = [17, 17];
                iconAnchor = [8.5, 17];
                popupAnchor = [0, -15];
            }

            const icon = L.divIcon({
                className: iconDivClass,
                html: iconElement,
                iconSize,
                iconAnchor,
                popupAnchor
            });

            const popupHtml = this.mapMarkerService.buildCollectiblePopupHtml(item, rewardLabel);

            const tooltipEl = document.createElement('div');
            const nameB = document.createElement('b');
            nameB.textContent = item.name;
            tooltipEl.appendChild(nameB);
            const subSpan = document.createElement('span');
            subSpan.style.display = 'block';
            subSpan.style.color = item.badge?.color || '#ffb833';
            subSpan.textContent = `${item.categoryLabel} (#${item.number}/${item.total})`;
            tooltipEl.appendChild(subSpan);

            const marker = L.marker([lat, lng], { icon })
                .bindPopup(popupHtml, { maxWidth: 320, className: 'gta-leaflet-popup' })
                .bindTooltip(tooltipEl, {
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
        this.saveCustomMarkers();
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
                    const id = 'custom-' + Date.now() + '-' + crypto.randomUUID();
                    const name = 'Marcador ' + (this.userCustomMarkers.length + 1);
                    const world = this.latLngToWorld(this.ctxLatLng.lat, this.ctxLatLng.lng);
                    const m = L.marker(this.ctxLatLng, { icon: this.createPushpinIcon('red') });
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
        localStorage.setItem('gta5_custom_markers_story', JSON.stringify(serializable));
    }

    loadCustomMarkers(): void {
        if (typeof localStorage === 'undefined' || !this.playerMarkersLayer) return;
        this.playerMarkersLayer.clearLayers();
        this.userCustomMarkers = [];
        try {
            let saved = localStorage.getItem('gta5_custom_markers_story');
            if (!saved) {
                saved = localStorage.getItem('gta5_custom_markers_ls');
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
        if (this._locatingMarkerHandler) {
            this.map.off('moveend', this._locatingMarkerHandler);
            this._locatingMarkerHandler = null;
        }
        this.updateCustomMarkerPopup(cm);
        const targetZoom = Math.max(this.map.getZoom(), 4.5);
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

        const stops = [
            { offset: '0%', color: pal.s0 },
            { offset: '35%', color: pal.s35 },
            { offset: '85%', color: pal.s85 },
            { offset: '100%', color: pal.s100 }
        ];
        stops.forEach(s => {
            const stop = document.createElementNS(svgNS, 'stop');
            stop.setAttribute('offset', s.offset);
            stop.setAttribute('stop-color', s.color);
            radial.appendChild(stop);
        });
        defs.appendChild(radial);
        svg.appendChild(defs);

        const polygon = document.createElementNS(svgNS, 'polygon');
        polygon.setAttribute('points', '14.8,20 17.2,20 16.3,38 15.7,38');
        polygon.setAttribute('fill', '#d6dadf');
        svg.appendChild(polygon);

        const ellipse = document.createElementNS(svgNS, 'ellipse');
        ellipse.setAttribute('cx', '16');
        ellipse.setAttribute('cy', '7.5');
        ellipse.setAttribute('rx', '7.8');
        ellipse.setAttribute('ry', '6.8');
        ellipse.setAttribute('fill', `url(#${gradId})`);
        svg.appendChild(ellipse);

        wrap.appendChild(svg);
        return L.divIcon({
            className: 'gta-classic-pushpin-icon',
            html: wrap,
            iconSize: [32, 40],
            iconAnchor: [16, 38],
            popupAnchor: [0, -36]
        });
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
        titleRow.style.cssText = 'display: flex; justify-content: center; text-align: center; margin: 0 14px 4px 14px;';

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
        L.DomEvent.disableClickPropagation(input);
        L.DomEvent.disableScrollPropagation(input);
        input.addEventListener('mousedown', (e) => e.stopPropagation());
        input.addEventListener('click', (e) => e.stopPropagation());
        input.addEventListener('dblclick', (e) => e.stopPropagation());
        input.addEventListener('keydown', (event: KeyboardEvent) => {
            event.stopPropagation();
            if (event.key === 'Enter') {
                event.preventDefault();
                input.blur();
            }
        });
        input.addEventListener('blur', () => {
            const defaultName = this.translationService.currentLang === 'es' ? 'Marcador' : 'Marker';
            const trimmed = input.value.trim();
            const finalName = trimmed || defaultName;
            input.value = finalName;
            this.onSaveCustomMarkerName(item.id, finalName);
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
        deleteBtn.textContent = `🗑️ ${deleteLbl}`;
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
                offset: [0, -36],
                className: 'gta-leaflet-tooltip'
            });
        }
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
            }).catch(err => console.error('[Historia] Error al copiar coordenadas al portapapeles:', err));
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
        this.inGameHours = (Math.floor(inGameTotal / 3600) - 6 + 24) % 24;
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
    private mysteryMarkers: L.Marker[] = [];

    /**
     * Centra el mapa sobre la ubicación del misterio, cierra el drawer lateral
     * y genera un marcador destacado con animación y popup informativo.
     */
    focusMysteryLocation(mystery: GtaMystery): void {
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
        } else if (mystery.category === 'Historia' || (mystery.categoryLabel && mystery.categoryLabel.includes('Historia'))) {
            themeClass = 'mystery-theme-mission';
            bgGradient = 'linear-gradient(180deg, #091a13 0%, #040c08 100%)';
            accentColor = mystery.badgeColor || '#2ecc71';
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
                    thumbnailUrl: pt.thumbnail || mystery.thumbnail
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
            thumbnailUrl: mystery.thumbnail
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
