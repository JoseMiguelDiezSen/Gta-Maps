import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslationService } from '../../i18n';
import { GotyService } from '../../services/goty.service';

export interface Gta6LegendItem {
    id: string;
    name: string;
    count: number;
    color: string;
    badgeType?: 'weapon' | 'identity' | 'clothes' | 'couple' | 'cctv';
    descEn?: string;
    descEs?: string;
}

export interface Gta6LegendCategory {
    key: string;
    title: string;
    items: Gta6LegendItem[];
}

export interface Gta6MarkerItem {
    id: string;
    itemId: string;
    name: string;
    categoryKey: string;
    color: string;
    x: number;
    y: number;
    desc?: string;
}

// ---------------------------------------------------------------------------
// GTA VI — MODO ONLINE (Plataforma táctica interactiva con sistema de marcadores)
// ---------------------------------------------------------------------------

@Component({
    selector: 'app-gta6-online',
    templateUrl: './gta6-online.component.html',
    styleUrls: ['./gta6-online.component.css'],
    standalone: false
})
export class Gta6OnlineComponent implements OnInit, OnDestroy {

    // Telemetría de coordenadas X, Y en tiempo real
    mouseCoords = { x: 1200, y: 1200 };
    coordsCopied = false;

    // Zoom del fondo con la rueda del ratón
    readonly minZoom = 1;
    readonly maxZoom = 8;
    zoom = 1;
    canvasW = 0;
    canvasH = 0;
    bgPosX = 0;
    bgPosY = 0;
    isPanning = false;
    private panStartX = 0;
    private panStartY = 0;
    private panStartBgX = 0;
    private panStartBgY = 0;

    // Menú contextual en el canvas
    ctxOpen = false;
    ctxX = 0;
    ctxY = 0;
    ctxWorldX = 0;
    ctxWorldY = 0;
    targetCustomMarker: any = null;

    // Marcador activo seleccionado
    activeMarker: Gta6MarkerItem | null = null;
    searchQuery = '';

    // Marcadores de puntos de interés iniciales en Leonida / Vice City (Plataforma táctica)
    allMarkers: Gta6MarkerItem[] = [
        // Propiedades
        { id: 'm_ap_lujo_1', itemId: 'apartamento_lujo', name: 'Ocean Drive Penthouse', categoryKey: 'propiedades', color: '#f39c12', x: 1450, y: 1100, desc: 'Apartamento de lujo frente a Ocean Beach con helipuerto privado.' },
        { id: 'm_ap_lujo_2', itemId: 'apartamento_lujo', name: 'Downtown Vice Tower Suite', categoryKey: 'propiedades', color: '#f39c12', x: 1280, y: 880, desc: 'Rascacielos céntrico con vistas panorámicas a la bahía de Vice City.' },
        { id: 'm_ap_med_1', itemId: 'apartamento_medio', name: 'Little Haiti Modern Flat', categoryKey: 'propiedades', color: '#3498db', x: 1050, y: 920, desc: 'Apartamento reformado con garaje de 6 plazas.' },
        { id: 'm_ap_bar_1', itemId: 'apartamento_barato', name: 'Bayside Studio', categoryKey: 'propiedades', color: '#95a5a6', x: 920, y: 1420, desc: 'Estudio económico cerca de los muelles.' },

        // Negocios
        { id: 'm_neg_1', itemId: 'negocio_1', name: 'Malibu Club & Lounge', categoryKey: 'negocios', color: '#7f8c8d', x: 1520, y: 1250, desc: 'Club nocturno emblemático de Vice City. Generación pasiva de ingresos.' },
        { id: 'm_neg_2', itemId: 'negocio_2', name: 'Port Gellhorn Shipping Hub', categoryKey: 'negocios', color: '#27ae60', x: 680, y: 1550, desc: 'Almacén logístico portuario para exportación de mercancías.' },
        { id: 'm_neg_3', itemId: 'negocio_3', name: 'Vice City Marina & Docks', categoryKey: 'negocios', color: '#8e44ad', x: 1380, y: 1380, desc: 'Amarre de yates de alta gama y lanchas rápidas.' },

        // Vehículos
        { id: 'm_veh_1', itemId: 'vehiculo_1', name: 'Sunshine Autos Showroom', categoryKey: 'vehiculos', color: '#e67e22', x: 1180, y: 1320, desc: 'Concesionario de vehículos deportivos e importaciones exóticas.' },
        { id: 'm_veh_2', itemId: 'vehiculo_2', name: 'Vice Custom Garages', categoryKey: 'vehiculos', color: '#f1c40f', x: 1100, y: 1050, desc: 'Taller de modificaciones de carrocería, neones y rendimiento.' },

        // Fauna
        { id: 'm_fau_1', itemId: 'fauna_caiman', name: 'Avistamiento de Caimán Gigante', categoryKey: 'fauna', color: '#2e7d32', x: 820, y: 750, desc: 'Humedales de los Everglades / Grassrivers. Gran densidad de reptiles.' },
        { id: 'm_fau_2', itemId: 'fauna_pantera', name: 'Refugio de Pantera de Florida', categoryKey: 'fauna', color: '#f9a825', x: 550, y: 980, desc: 'Zona boscosa protegida. Depredador ágil y escurridizo.' },
        { id: 'm_fau_3', itemId: 'fauna_delfin', name: 'Cardumen de Delfines', categoryKey: 'fauna', color: '#0288d1', x: 1850, y: 1600, desc: 'Aguas abiertas de los Cayos / Gator Keys.' },
        { id: 'm_fau_4', itemId: 'fauna_tiburon', name: 'Área de Tiburones Martillo', categoryKey: 'fauna', color: '#546e7a', x: 1950, y: 950, desc: 'Aguas profundas del arrecife este.' },

        // Coleccionables
        { id: 'm_col_1', itemId: 'coleccionable_1', name: 'Paquete Oculto #01', categoryKey: 'coleccionables', color: '#8e24aa', x: 1420, y: 990, desc: 'Paquete con contrabando secreto oculto en una azotea.' },
        { id: 'm_col_2', itemId: 'coleccionable_2', name: 'Estatua Tiki Antigua', categoryKey: 'coleccionables', color: '#5e35b1', x: 1680, y: 1820, desc: 'Reliquia oculta en los Gator Keys.' },

        // Lugares Extraños
        { id: 'm_lug_1', itemId: 'lugar_1', name: 'Pecio Hundido de Contrabandistas', categoryKey: 'lugares', color: '#7e57c2', x: 1750, y: 1350, desc: 'Barco carguero hundido con misteriosos contenedores sellados.' },
        { id: 'm_lug_2', itemId: 'lugar_2', name: 'Antena Radar Abandonada', categoryKey: 'lugares', color: '#0277bd', x: 420, y: 620, desc: 'Instalación militar secreta en desuso en el norte de Leonida.' }
    ];

    readonly categories: Gta6LegendCategory[] = [
        {
            key: 'propiedades',
            title: 'Propiedades',
            items: [
                { id: 'apartamento_lujo', name: 'Apartamento de Lujo', count: 0, color: '#f39c12' },
                { id: 'apartamento_medio', name: 'Apartamento Medio', count: 0, color: '#3498db' },
                { id: 'apartamento_barato', name: 'Apartamento Barato', count: 0, color: '#95a5a6' }
            ]
        },
        {
            key: 'negocios',
            title: 'Negocios',
            items: [
                { id: 'negocio_1', name: 'Clubes y Ocio', count: 0, color: '#7f8c8d' },
                { id: 'negocio_2', name: 'Almacenes y Logística', count: 0, color: '#27ae60' },
                { id: 'negocio_3', name: 'Puertos y Marinas', count: 0, color: '#8e44ad' }
            ]
        },
        {
            key: 'vehiculos',
            title: 'Vehículos',
            items: [
                { id: 'vehiculo_1', name: 'Concesionarios', count: 0, color: '#e67e22' },
                { id: 'vehiculo_2', name: 'Talleres de Tuning', count: 0, color: '#f1c40f' },
                { id: 'vehiculo_3', name: 'Helipuertos / Pistas', count: 0, color: '#c0392b' }
            ]
        },
        {
            key: 'fauna',
            title: 'Fauna y Vida Silvestre',
            items: [
                { id: 'fauna_caiman', name: '🐊 Caimán', count: 0, color: '#2e7d32' },
                { id: 'fauna_ciervo', name: '🦌 Ciervo', count: 0, color: '#8d6e63' },
                { id: 'fauna_jabali', name: '🐗 Jabalí', count: 0, color: '#5d4037' },
                { id: 'fauna_zorro', name: '🦊 Zorro', count: 0, color: '#e65100' },
                { id: 'fauna_bobcat', name: '🐆 Felino salvaje', count: 0, color: '#9e9e9e' },
                { id: 'fauna_serpientes', name: '🐍 Serpientes', count: 0, color: '#388e3c' },
                { id: 'fauna_tiburon', name: '🦈 Tiburón', count: 0, color: '#546e7a' },
                { id: 'fauna_delfin', name: '🐬 Delfín', count: 0, color: '#0288d1' },
                { id: 'fauna_oso', name: '🐻 Oso', count: 0, color: '#4e342e' },
                { id: 'fauna_coyote', name: '🐺 Coyote', count: 0, color: '#a1887f' },
                { id: 'fauna_pantera', name: '🐆 Pantera de Florida', count: 0, color: '#f9a825' }
            ]
        },
        {
            key: 'coleccionables',
            title: 'Coleccionables',
            items: [
                { id: 'coleccionable_1', name: 'Paquetes Ocultos', count: 0, color: '#8e24aa' },
                { id: 'coleccionable_2', name: 'Reliquias y Estatuas', count: 0, color: '#5e35b1' },
                { id: 'coleccionable_3', name: 'Memorias USB', count: 0, color: '#00897b' }
            ]
        },
        {
            key: 'lugares',
            title: 'Lugares Extraños',
            items: [
                { id: 'lugar_1', name: 'Pecios y Naufragios', count: 0, color: '#7e57c2' },
                { id: 'lugar_2', name: 'Instalaciones Secretas', count: 0, color: '#0277bd' },
                { id: 'lugar_3', name: 'Cabañas Ocultas', count: 0, color: '#5d4037' }
            ]
        }
    ];

    readonly policiaItems: Gta6LegendItem[] = [
        {
            id: 'policia-weapon',
            name: 'Arma utilizada identificada',
            count: 1,
            color: '#b3262e',
            badgeType: 'weapon',
            descEn: 'police know what weapon you used'
        },
        {
            id: 'policia-identity',
            name: 'Identidad reconocida',
            count: 1,
            color: '#b3262e',
            badgeType: 'identity',
            descEn: 'police know your identity'
        },
        {
            id: 'policia-clothes',
            name: 'Vestimenta registrada',
            count: 1,
            color: '#b3262e',
            badgeType: 'clothes',
            descEn: 'police know what clothes you wear'
        },
        {
            id: 'policia-couple',
            name: 'Búsqueda de una pareja',
            count: 2,
            color: '#b3262e',
            badgeType: 'couple',
            descEn: 'police on the lookout for a couple'
        },
        {
            id: 'policia-cctv',
            name: 'Captado por cámaras CCTV',
            count: 1,
            color: '#b3262e',
            badgeType: 'cctv',
            descEn: 'you have been spotted on CCTV'
        }
    ];

    readonly policiaKeys: string[] = this.policiaItems.map(i => i.id);

    getPoliceTitle(item: Gta6LegendItem): string {
        if (!item.badgeType) return item.name;
        const key = 'gta6.police.' + item.badgeType;
        const translated = this.translationService.t(key);
        return translated && translated !== key ? translated : item.name;
    }

    getPoliceDesc(item: Gta6LegendItem): string {
        if (!item.badgeType) return item.descEn || '';
        const key = 'gta6.police.' + item.badgeType + 'Desc';
        const translated = this.translationService.t(key);
        return translated && translated !== key ? translated : (item.descEn || '');
    }

    get hasAnyPoliceAlert(): boolean {
        return this.policiaItems.some(item => this.layerFilters[item.id]);
    }

    constructor(
        readonly translationService: TranslationService,
        public gotyService: GotyService,
        private router: Router
    ) {}

    private _cachedMapTypesGta6O: any[] | null = null;
    private _lastLangGta6O = '';
    get mapTypes() {
        if (!this._cachedMapTypesGta6O || this._lastLangGta6O !== this.translationService.currentLang) {
            this._lastLangGta6O = this.translationService.currentLang;
            this._cachedMapTypesGta6O = [
                {
                    id: 'Grid',
                    label: this.translationService.currentLang === 'es' ? 'Plataforma Táctica (Próximamente)' : 'Tactical Grid (Coming Soon)',
                    file: '/assets/gta6/tactical-grid.svg',
                    w: 2400,
                    h: 2400
                },
                { id: 'Satellite', label: this.translationService.t('gta5.maps.satellite'), file: '/assets/filtracionesGta6/satelite.jpg', w: 912, h: 1136 },
                { id: 'Roadmap', label: this.translationService.t('gta5.maps.roadmap'), file: '/assets/filtracionesGta6/image.jpg', w: 880, h: 1168 },
                { id: 'Atlas', label: this.translationService.t('gta5.maps.atlas'), file: '/assets/filtracionesGta6/image.jpg', w: 880, h: 1168 }
            ];
        }
        return this._cachedMapTypesGta6O;
    }

    legendOpen = true;
    settingsOpen = true;
    selectedGame = 'gta6';
    selectedGameMode: 'story' | 'online' = 'online';
    currentMapType = 'Grid';
    iconTheme: 'neon' | 'classic' | 'standard' | 'simple' = 'classic';
    iconSize = 'standard';
    inGameTimeStr = '00:00';

    accordion: { [key: string]: boolean } = {
        propiedades: false,
        vehiculos: false,
        negocios: false,
        fauna: false,
        coleccionables: false,
        lugares: false,
        policia: false,
        mapa: false,
        zona: false,
        juego: false,
        marcadores: false,
        goty: false
    };

    userCustomMarkers: { id: string; name: string; color?: string; x?: number; y?: number }[] = [];

    layerFilters: { [key: string]: boolean } = {};

    private clockInterval: ReturnType<typeof setInterval> | undefined;

    get totalItems(): number {
        return this.allMarkers.length + this.userCustomMarkers.length;
    }

    get activeMapType() {
        return this.mapTypes.find(t => t.id === this.currentMapType) || this.mapTypes[0];
    }

    get bgNatural(): { w: number; h: number } {
        return { w: this.activeMapType.w, h: this.activeMapType.h };
    }

    get canvasBgImage(): string {
        return `url('${this.activeMapType.file}')`;
    }

    get canvasBgSize(): string {
        if (this.zoom <= this.minZoom || !this.canvasW) {
            return 'cover';
        }
        const base = this.coverScale();
        return `${this.bgNatural.w * base * this.zoom}px ${this.bgNatural.h * base * this.zoom}px`;
    }

    get canvasBgPos(): string {
        if (this.zoom <= this.minZoom || !this.canvasW) {
            return 'center center';
        }
        return `${this.bgPosX}px ${this.bgPosY}px`;
    }

    // Filtro activo de marcadores
    get visibleMarkers(): Gta6MarkerItem[] {
        return this.allMarkers.filter(m => {
            if (!this.layerFilters[m.itemId]) return false;
            if (this.searchQuery && this.searchQuery.trim().length > 0) {
                const q = this.searchQuery.toLowerCase().trim();
                return m.name.toLowerCase().includes(q) || (m.desc && m.desc.toLowerCase().includes(q));
            }
            return true;
        });
    }

    ngOnInit(): void {
        this.initFilters();
        this.updateItemCounts();
        this.loadCustomMarkers();
        this.startInGameClock();
    }

    ngOnDestroy(): void {
        if (this.clockInterval) {
            clearInterval(this.clockInterval);
        }
    }

    private initFilters(): void {
        const allKeys = [
            ...this.categories.reduce((acc, category) => acc.concat(category.items), [] as Gta6LegendItem[]),
            ...this.policiaItems
        ];
        allKeys.forEach(item => {
            this.layerFilters[item.id] = true;
        });
    }

    private updateItemCounts(): void {
        this.categories.forEach(cat => {
            cat.items.forEach(item => {
                item.count = this.allMarkers.filter(m => m.itemId === item.id).length;
            });
        });
    }

    getMarkerStyle(m: { x?: number; y?: number }): { [key: string]: string } {
        if (m.x === undefined || m.y === undefined || !this.canvasW) {
            return { display: 'none' };
        }
        const base = this.coverScale();
        const curW = this.bgNatural.w * base * this.zoom;
        const curH = this.bgNatural.h * base * this.zoom;
        const screenX = this.bgPosX + (m.x / this.bgNatural.w) * curW;
        const screenY = this.bgPosY + (m.y / this.bgNatural.h) * curH;
        return {
            left: `${screenX}px`,
            top: `${screenY}px`,
            transform: 'translate(-50%, -50%)',
            position: 'absolute'
        };
    }

    selectMarker(m: Gta6MarkerItem, event?: MouseEvent): void {
        if (event) {
            event.stopPropagation();
        }
        this.activeMarker = m;
    }

    closeMarkerModal(): void {
        this.activeMarker = null;
    }

    focusCustomMarker(cm: any): void {
        if (cm.x !== undefined && cm.y !== undefined && this.canvasW && this.canvasH) {
            this.zoom = 2.5;
            const base = this.coverScale();
            const curW = this.bgNatural.w * base * this.zoom;
            const curH = this.bgNatural.h * base * this.zoom;
            this.bgPosX = this.clampPan((this.canvasW / 2) - (cm.x / this.bgNatural.w) * curW, this.canvasW, curW);
            this.bgPosY = this.clampPan((this.canvasH / 2) - (cm.y / this.bgNatural.h) * curH, this.canvasH, curH);
        }
    }

    switchGame(game: string): void {
        this.selectedGame = game;
        if (game === 'gta5') {
            this.router.navigate(['/gta5-online']);
        } else {
            this.router.navigate(['/gta6-online']);
        }
    }

    itemKeys(category: Gta6LegendCategory): string[] {
        return category.items.map(item => item.id);
    }

    getCategoryTitle(category: Gta6LegendCategory): string {
        return this.translationService.t('gta6.categories.' + category.key) || category.title;
    }

    getItemName(item: Gta6LegendItem): string {
        const key = 'gta6.items.' + item.id;
        const translated = this.translationService.t(key);
        return translated && translated !== key ? translated : item.name;
    }

    toggleLegend(): void {
        this.legendOpen = !this.legendOpen;
    }

    toggleSettings(): void {
        this.settingsOpen = !this.settingsOpen;
    }

    toggleSection(section: string): void {
        this.accordion[section] = !this.accordion[section];
    }

    toggleLayer(itemId: string): void {
        this.layerFilters[itemId] = !this.layerFilters[itemId];
    }

    isSectionAllActive(keys: string[]): boolean {
        return keys.length > 0 && keys.every(k => this.layerFilters[k]);
    }

    onSectionCheckboxChange(keys: string[], event: Event): void {
        const checked = (event.target as HTMLInputElement).checked;
        keys.forEach(key => {
            this.layerFilters[key] = checked;
        });
    }

    setGameMode(mode: 'story' | 'online'): void {
        this.selectedGameMode = mode;
    }

    switchMapType(mapType: string): void {
        this.currentMapType = mapType;
        this.zoom = this.minZoom;
        this.bgPosX = 0;
        this.bgPosY = 0;
        this.isPanning = false;
    }

    updateIconStyle(): void { }

    recenterMap(): void {
        this.zoom = this.minZoom;
        this.bgPosX = 0;
        this.bgPosY = 0;
        this.isPanning = false;
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

    // Context menu handlers
    openContextMenu(event: MouseEvent): void {
        event.preventDefault();
        this.ctxX = event.clientX;
        this.ctxY = event.clientY;
        this.ctxWorldX = this.mouseCoords.x;
        this.ctxWorldY = this.mouseCoords.y;
        this.targetCustomMarker = null;
        this.ctxOpen = true;
    }

    closeContextMenu(): void {
        this.ctxOpen = false;
        this.targetCustomMarker = null;
    }

    openMarkerContext(cm: any, event: MouseEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.ctxX = event.clientX;
        this.ctxY = event.clientY;
        this.targetCustomMarker = cm;
        this.ctxOpen = true;
    }

    runCtxAction(action: string): void {
        if (action === 'marcador') {
            const name = prompt(this.translationService.currentLang === 'es' ? 'Nombre del nuevo marcador:' : 'New marker name:', 'Punto Táctico');
            if (name) {
                const colors = ['#f39c12', '#3498db', '#2ecc71', '#e74c3c', '#9b59b6', '#ff4fe0'];
                const color = colors[Math.floor(Math.random() * colors.length)];
                const newMarker = {
                    id: 'cm_' + Date.now(),
                    name,
                    color,
                    x: this.ctxWorldX || 1200,
                    y: this.ctxWorldY || 1200
                };
                this.userCustomMarkers.push(newMarker);
                this.saveCustomMarkers();
            }
        } else if (action === 'editar_marcador' && this.targetCustomMarker) {
            const newName = prompt(this.translationService.currentLang === 'es' ? 'Editar nombre del marcador:' : 'Edit marker name:', this.targetCustomMarker.name);
            if (newName) {
                this.targetCustomMarker.name = newName;
                this.saveCustomMarkers();
            }
        } else if (action === 'borrar_este_marcador' && this.targetCustomMarker) {
            this.userCustomMarkers = this.userCustomMarkers.filter(m => m.id !== this.targetCustomMarker.id);
            this.saveCustomMarkers();
        }
        this.closeContextMenu();
    }

    saveCustomMarkers(): void {
        localStorage.setItem('gta6_custom_markers_' + this.selectedGameMode, JSON.stringify(this.userCustomMarkers));
    }

    loadCustomMarkers(): void {
        try {
            const saved = localStorage.getItem('gta6_custom_markers_' + this.selectedGameMode);
            if (saved) {
                this.userCustomMarkers = JSON.parse(saved);
            }
        } catch { }
    }

    onCanvasMouseMove(event: MouseEvent): void {
        const el = event.currentTarget as HTMLElement | null;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const cursorX = event.clientX - rect.left;
        const cursorY = event.clientY - rect.top;
        const base = this.coverScale();
        const curW = this.bgNatural.w * base * this.zoom;
        const curH = this.bgNatural.h * base * this.zoom;
        if (curW && curH) {
            const fracX = (cursorX - this.bgPosX) / curW;
            const fracY = (cursorY - this.bgPosY) / curH;
            this.mouseCoords.x = Math.round(fracX * this.bgNatural.w * 10) / 10;
            this.mouseCoords.y = Math.round(fracY * this.bgNatural.h * 10) / 10;
        }
    }

    onCanvasWheel(event: WheelEvent): void {
        event.preventDefault();

        const el = event.currentTarget as HTMLElement | null;
        if (!el) { return; }

        const cw = el.clientWidth;
        const ch = el.clientHeight;
        if (!cw || !ch) { return; }
        this.canvasW = cw;
        this.canvasH = ch;

        const rect = el.getBoundingClientRect();
        const cursorX = event.clientX - rect.left;
        const cursorY = event.clientY - rect.top;

        const base = this.coverScale();
        const prevW = this.bgNatural.w * base * this.zoom;
        const prevH = this.bgNatural.h * base * this.zoom;

        const fracX = (cursorX - this.bgPosX) / prevW;
        const fracY = (cursorY - this.bgPosY) / prevH;

        const factor = event.deltaY < 0 ? 1.2 : 1 / 1.2;
        const next = Math.min(this.maxZoom, Math.max(this.minZoom, this.zoom * factor));
        if (next === this.zoom) { return; }
        this.zoom = next;

        if (next <= this.minZoom) {
            this.bgPosX = 0;
            this.bgPosY = 0;
            return;
        }

        const newW = this.bgNatural.w * base * next;
        const newH = this.bgNatural.h * base * next;
        this.bgPosX = this.clampPan(cursorX - fracX * newW, cw, newW);
        this.bgPosY = this.clampPan(cursorY - fracY * newH, ch, newH);
    }

    onCanvasMouseDown(event: MouseEvent): void {
        if (event.button !== 0) return; // solo botón izquierdo para pan
        const el = event.currentTarget as HTMLElement | null;
        if (el) {
            this.canvasW = el.clientWidth;
            this.canvasH = el.clientHeight;
        }
        if (this.zoom <= this.minZoom || !this.canvasW) { return; }

        event.preventDefault();
        this.isPanning = true;
        this.panStartX = event.clientX;
        this.panStartY = event.clientY;
        this.panStartBgX = this.bgPosX;
        this.panStartBgY = this.bgPosY;
    }

    @HostListener('document:mousemove', ['$event'])
    onDocumentMouseMove(event: MouseEvent): void {
        if (!this.isPanning) { return; }
        const base = this.coverScale();
        this.bgPosX = this.clampPan(
            this.panStartBgX + (event.clientX - this.panStartX),
            this.canvasW,
            this.bgNatural.w * base * this.zoom
        );
        this.bgPosY = this.clampPan(
            this.panStartBgY + (event.clientY - this.panStartY),
            this.canvasH,
            this.bgNatural.h * base * this.zoom
        );
    }

    @HostListener('document:mouseup')
    @HostListener('document:mouseleave')
    onDocumentMouseUp(): void {
        this.isPanning = false;
    }

    private coverScale(): number {
        return Math.max(this.canvasW / this.bgNatural.w, this.canvasH / this.bgNatural.h);
    }

    private clampPan(value: number, containerSize: number, imageSize: number): number {
        const min = containerSize - imageSize;
        return Math.max(Math.min(0, min), Math.min(0, value));
    }

    private startInGameClock(): void {
        const tick = (): void => {
            const now = new Date();
            this.inGameTimeStr =
                `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        };

        tick();
        this.clockInterval = setInterval(tick, 30000);
    }
}
