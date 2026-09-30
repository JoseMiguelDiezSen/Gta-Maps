import { Component, OnInit, AfterViewInit, OnDestroy, effect } from '@angular/core';
import * as L from 'leaflet';
import { LocationService } from '../../services/location.service';
import { LocationItem } from '../../models/location';
import { CollectibleItem } from '../../models/collectible';
import { TranslationService } from '../../i18n';

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

    // Selector de mapa base — Historia tiene acceso a todos los mapas (incluido UV blueprint)
    readonly mapTypes = [
        { id: 'Satellite', label: 'Satélite' },
        { id: 'Roadmap',   label: 'Carreteras' },
        { id: 'Atlas',     label: 'Atlas' },
        { id: 'Juego',     label: 'Juego' },
        { id: 'UV',        label: 'Blueprint' },
        { id: 'UV2',       label: 'Blueprint Alt.' }
    ];

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

    // Personajes narrativos de Modo Historia
    get characterKeys(): string[] {
        return this.storyCharacters.map(c => c.id);
    }

    // Fauna (compartida con Online en datos, pero filtrada por gameMode)
    get faunaKeys(): string[] {
        return this.storyAnimals.map(a => a.id);
    }

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
        mapa:        false,
        zona:        false
    };

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
    iconTheme: 'modern' | 'classic' | 'standard' | 'simple' = 'simple';
    iconSize: 'compact' | 'standard' | 'large' = 'standard';

    // Menú contextual
    ctxOpen = false;
    ctxX = 0;
    ctxY = 0;
    private ctxLatLng: L.LatLng | null = null;
    userCustomMarkers: { id: string; name: string; marker: L.Marker; latLng: L.LatLng }[] = [];
    targetCustomMarker: { id: string; name: string; marker: L.Marker; latLng: L.LatLng } | null = null;
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
        return this.allProperties.filter(p =>
            p.category === 'character' && (p.gameMode === 'both' || p.gameMode === 'story')
        );
    }

    get storyAnimals(): LocationItem[] {
        return this.allProperties.filter(p =>
            p.category === 'animal' && (p.gameMode === 'both' || p.gameMode === 'story')
        );
    }

    get purchasablePropertiesCount(): number {
        return this.allProperties.filter(p =>
            this.isPurchasable(p) && (p.gameMode === 'both' || p.gameMode === 'story')
        ).length;
    }

    // -----------------------------------------------------------------------
    constructor(
        private locationService: LocationService,
        readonly translationService: TranslationService
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

    ngAfterViewInit(): void {
        this.initMap(this.currentMapType);
        window.addEventListener('resize', this.onWindowResize);
    }

    ngOnDestroy(): void {
        window.removeEventListener('resize', this.onWindowResize);
        if (this.clockInterval) clearInterval(this.clockInterval);
        delete (window as any)._gtaRenameMarker;
        delete (window as any)._gtaDeleteMarker;
        if (this.map) this.map.remove();
    }

    // -----------------------------------------------------------------------
    // MOTOR DE MAPA LEAFLET (duplicado intencionadamente — código legible)
    // -----------------------------------------------------------------------
    private initMap(mapType: string): void {
        if (this.map) this.map.remove();

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
            tileUrl = 'https://tiles.mapgenie.io/games/gta5/los-santos/uv/{z}/{x}/{y}.jpg';
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
            errorTileUrl: mapType.startsWith('UV') ? undefined : `assets/${mapType === 'Juego' ? 'Roadmap' : mapType}/empty.jpg`,
            noWrap: true,
            className: tileClass
        });

        tileLayer.addTo(this.map);
        this.playerMarkersLayer = L.layerGroup().addTo(this.map);
        this.collectibleMarkersLayer = L.layerGroup().addTo(this.map);

        this.loadProperties();
        this.loadCollectibles();
        this.updateIconStyle();

        this.map.on('mousemove', (e: L.LeafletMouseEvent) => {
            this.mouseCoords = this.latLngToWorld(e.latlng.lat, e.latlng.lng);
        });
    }

    private readonly onWindowResize = () => {
        if (this.map) {
            this.map.setMinZoom(this.computeMinZoom(this.imageSize));
        }
    };

    private computeMinZoom(imageSize: number): number {
        const el = document.getElementById('gta-map-historia');
        const width = el ? el.clientWidth : 0;
        if (width <= 0) return 2;
        const nativeZoom = 7;
        const min = nativeZoom + Math.log2(width / imageSize);
        return Math.min(this.maxZoom, Math.max(1, Math.ceil(min)));
    }

    // -----------------------------------------------------------------------
    // CONVERSIÓN COORDENADAS GTA ↔ LEAFLET
    // -----------------------------------------------------------------------
    worldToLatLng(x: number, y: number): [number, number] {
        const originX = 3753.6;
        const originY = 5529.6;
        const scale   = 0.660;
        const px = originX + (scale * x);
        const py = originY - (scale * y);
        return [-py / 128, px / 128];
    }

    latLngToWorld(lat: number, lng: number): { x: number; y: number } {
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

    // -----------------------------------------------------------------------
    // RENDER DE MARCADORES
    // -----------------------------------------------------------------------
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
            if (p.category === 'police_station') pinSymbol = '🚓';
            if (p.category === 'hospital')       pinSymbol = '🏥';
            if (p.category === 'fire_station')   pinSymbol = '🚒';
            if (p.category === 'car_wash')       pinSymbol = '🚿';
            if (p.category === 'golf')             pinSymbol = '⛳';
            if (p.category === 'darts')            pinSymbol = '🎯';
            if (p.category === 'tennis')           pinSymbol = '🎾';
            if (p.category === 'stunt_jump')       pinSymbol = '🏎️';
            if (p.category === 'under_the_bridge') pinSymbol = '🌉';
            if (p.category === 'knife_flight')     pinSymbol = '✈️';
            if (p.category === 'parachuting')      pinSymbol = '🪂';

            let pinColor = (p.badge?.color || (p as any).color);
            if (p.category === 'safehouse') {
                const char = this.getSafehouseCharacter(p);
                if (char === 'michael') pinColor = '#3498db';
                else if (char === 'franklin') pinColor = '#2ecc71';
                else if (char === 'trevor') pinColor = '#e67e22';
            }

            // Icono: FA "simple" o círculo neón según tema seleccionado
            const faIcon = p.badge?.icon || (p as any).icon || 'location-dot';
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
            } else if (this.iconTheme === 'simple') {
                htmlContent = `<div style="color: ${pinColor}; font-size: ${iconSizeVal[0]}px; filter: drop-shadow(0px 2px 3px rgba(0,0,0,0.9)); text-align: center; line-height:1;"><i class="fa-solid fa-${faIcon}"></i></div>`;
                iconDivClass = 'gta-pin-wrapper-fa';
                iconSize = iconSizeVal;
                iconAnchor = [iconSizeVal[0] / 2, iconSizeVal[1] / 2];
                popupAnchor = [0, -iconSizeVal[1] / 2];
            } else {
                htmlContent = `<div class="gta-pin gta-pin-${p.category}" style="--pin-color: ${pinColor}"><span class="gta-pin-symbol" style="color: ${p.category === 'character' ? '#f5cd2f' : 'var(--pin-color, #ffb833)'}; font-weight: 800;">${pinSymbol}</span></div>`;
                iconDivClass = 'gta-pin-wrapper';
                iconSize = [30, 30];
                iconAnchor = [15, 30];
                popupAnchor = [0, -28];
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

    private renderCollectibleMarkers(): void {
        const map = this.map;
        if (!map) return;

        if (!this.collectibleMarkersLayer) {
            this.collectibleMarkersLayer = L.layerGroup().addTo(map);
        }
        this.collectibleMarkersLayer.clearLayers();
        this.collectibleMarkers = [];

        const isEs = this.translationService.currentLanguage() !== 'en';
        const rewardLabel = isEs ? 'Recompensa' : 'Reward';

        this.allCollectibles.forEach(item => {
            if (this.layerFilters[item.category] === false) return;

            const [lat, lng] = this.worldToLatLng(item.position.x, item.position.y);
            const isEpsilon = item.category === 'epsilon_tract';
            const pinSymbol = isEpsilon ? '✝' : ((item.badge?.symbol || (item as any).icon) || '•');
            const symbolStyle = isEpsilon
                ? 'color: #ffffff !important; font-size: 14px; font-weight: 900; line-height: 1; text-shadow: 0 0 4px #ffffff, 0 0 8px #38bdf8;'
                : `color: ${(item.badge?.color || (item as any).color) || '#ffb833'}; font-weight: 700; line-height: 1;`;

            const colColor = item.badge?.color || (item as any).color || '#ffb833';
            const colFaIcon = item.badge?.icon || (item as any).icon || 'star';
            const icon = L.divIcon({
                  className: 'gta-pin-collectible-wrapper-fa',
                  html: `<div style="color: ${colColor}; font-size: 13px; filter: drop-shadow(0px 1px 2px rgba(0,0,0,0.8)); text-align: center; line-height:1;"><i class="fa-solid fa-${colFaIcon}"></i></div>`,
                  iconSize: [16, 16],
                  iconAnchor: [8, 8],
                  popupAnchor: [0, -8]
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

    toggleLegend(): void { this.legendOpen = !this.legendOpen; }
    toggleSettings(): void { this.settingsOpen = !this.settingsOpen; }
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
                    const m = L.marker(this.ctxLatLng, { icon: this.createPushpinIcon() });
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
                        </defs>
                        <polygon points="14.8,20 17.2,20 16.3,38 15.7,38" fill="#d6dadf"/>
                        <ellipse cx="16" cy="7.5" rx="7.8" ry="6.8" fill="url(#gtaRedHead)"/>
                    </svg>
                </div>
            `,
            iconSize: [32, 40],
            iconAnchor: [16, 38],
            popupAnchor: [0, -36]
        });
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
                    <button type="button" class="btn-marker-action btn-marker-edit" onclick="window._gtaRenameMarker('${item.id}')">✏️ ${editLbl}</button>
                    <button type="button" class="btn-marker-action btn-marker-delete" onclick="window._gtaDeleteMarker('${item.id}')">🗑️ ${deleteLbl}</button>
                </div>
            </div>
        `;
        item.marker.bindPopup(html, { className: 'gta-custom-pin-popup', maxWidth: 240, minWidth: 200, autoPan: true });
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
        container.classList.remove('icon-size-compact','icon-size-standard','icon-size-large','icon-theme-modern','icon-theme-classic',
            'icon-theme-standard', 'icon-theme-simple');
        container.classList.add(`icon-size-${this.iconSize}`, `icon-theme-${this.iconTheme}`);
        // Rerenderizamos para aplicar el nuevo estilo de icono
        this.renderPropertyMarkers();
        this.renderCollectibleMarkers();
    }
}
