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
    isMarkerContext = false;
    targetCustomMarker: any = null;

    // Marcador activo seleccionado
    activeMarker: Gta6MarkerItem | null = null;

    // Sin marcadores predefinidos en el mapa según lo solicitado
    allMarkers: Gta6MarkerItem[] = [];

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
                    h: 1350
                }
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

    infoDrawerOpen = false;

    toggleInfoDrawer(): void {
        this.infoDrawerOpen = !this.infoDrawerOpen;
    }

    closeInfoDrawer(): void {
        this.infoDrawerOpen = false;
    }

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
        if (this.zoom <= this.minZoom || !this.canvasW || !this.canvasH) {
            return 'contain';
        }
        const base = this.coverScale();
        return `${this.bgNatural.w * base * this.zoom}px ${this.bgNatural.h * base * this.zoom}px`;
    }

    get canvasBgPos(): string {
        if (this.zoom <= this.minZoom || !this.canvasW || !this.canvasH) {
            return 'center center';
        }
        return `${this.bgPosX}px ${this.bgPosY}px`;
    }

    // Filtro activo de marcadores según categorías activas
    get visibleMarkers(): Gta6MarkerItem[] {
        return this.allMarkers.filter(m => this.layerFilters[m.itemId]);
    }

    ngOnInit(): void {
        if (typeof window !== 'undefined' && window.innerWidth <= 850) {
            this.legendOpen = false;
            this.settingsOpen = false;
        }
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
        const isLowRes = typeof window !== 'undefined' && window.innerWidth <= 850;
        const lowResDisabledCategories = ['negocios', 'servicios', 'actividades', 'coleccionables'];

        this.categories.forEach(cat => {
            const shouldDisable = isLowRes && lowResDisabledCategories.includes(cat.key);
            cat.items.forEach(item => {
                this.layerFilters[item.id] = !shouldDisable;
            });
        });
        this.policiaItems.forEach(item => {
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
        const posX = this.zoom <= this.minZoom ? (this.canvasW - curW) / 2 : this.bgPosX;
        const posY = this.zoom <= this.minZoom ? (this.canvasH - curH) / 2 : this.bgPosY;
        const screenX = posX + (m.x / this.bgNatural.w) * curW;
        const screenY = posY + (m.y / this.bgNatural.h) * curH;
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
        const target = event.target as HTMLElement;
        if (target && target.closest('.hud, .hud-panel, .hud-profile-drawer, .profile-drawer, .hud-drawer-backdrop, app-info-panel, aside, .hud-coords-dev, .hud-ctx, .gta6-marker-card-modal, button, input, select, a')) {
            return;
        }
        event.preventDefault();
        this.isMarkerContext = false;
        this.targetCustomMarker = null;
        this.ctxOpen = true;
        this.ctxX = event.clientX;
        this.ctxY = event.clientY;
        this.ctxWorldX = this.mouseCoords.x;
        this.ctxWorldY = this.mouseCoords.y;
    }

    closeContextMenu(): void {
        this.ctxOpen = false;
        this.isMarkerContext = false;
        this.targetCustomMarker = null;
    }

    activeCustomMarker: { id: string; name: string; color?: string; x?: number; y?: number } | null = null;

    readonly pushpinPalettes: Record<string, { s0: string; s35: string; s85: string; s100: string; rim1: string; rim2: string; hex: string }> = {
        red:    { s0: '#ff7575', s35: '#e61919', s85: '#a80707', s100: '#5a0000', rim1: '#8f0505', rim2: '#ff4444', hex: '#e61919' },
        blue:   { s0: '#60a5fa', s35: '#2563eb', s85: '#1d4ed8', s100: '#1e3a8a', rim1: '#1e40af', rim2: '#60a5fa', hex: '#2563eb' },
        green:  { s0: '#4ade80', s35: '#16a34a', s85: '#15803d', s100: '#14532d', rim1: '#166534', rim2: '#4ade80', hex: '#16a34a' },
        yellow: { s0: '#fef08a', s35: '#eab308', s85: '#ca8a04', s100: '#713f12', rim1: '#854d0e', rim2: '#fde047', hex: '#eab308' },
        orange: { s0: '#fdba74', s35: '#ea580c', s85: '#c2410c', s100: '#7c2d12', rim1: '#9a3412', rim2: '#fb923c', hex: '#ea580c' },
        purple: { s0: '#d8b4fe', s35: '#9333ea', s85: '#7e22ce', s100: '#581c87', rim1: '#6b21a8', rim2: '#c084fc', hex: '#9333ea' },
        white:  { s0: '#ffffff', s35: '#e2e8f0', s85: '#94a3b8', s100: '#475569', rim1: '#64748b', rim2: '#f8fafc', hex: '#f8fafc' }
    };

    readonly customColorList = [
        { key: 'red', hex: '#e61919', title: 'Rojo' },
        { key: 'blue', hex: '#2563eb', title: 'Azul' },
        { key: 'green', hex: '#16a34a', title: 'Verde' },
        { key: 'yellow', hex: '#eab308', title: 'Amarillo' },
        { key: 'orange', hex: '#ea580c', title: 'Naranja' },
        { key: 'purple', hex: '#9333ea', title: 'Morado' },
        { key: 'white', hex: '#f8fafc', title: 'Blanco' }
    ];

    getPushpinColor(color?: string): string {
        const c = color || 'red';
        return this.pushpinPalettes[c] ? c : 'red';
    }

    selectCustomMarker(cm: any, event?: MouseEvent): void {
        if (event) {
            event.stopPropagation();
        }
        this.activeCustomMarker = cm;
        this.activeMarker = null;
    }

    closeCustomMarkerPopup(): void {
        this.activeCustomMarker = null;
    }

    setCustomMarkerColor(cm: any, colorKey: string): void {
        cm.color = colorKey;
        this.saveCustomMarkers();
    }

    updateCustomMarkerName(cm: any, newName: string): void {
        if (newName && newName.trim() !== '') {
            cm.name = newName.trim();
            this.saveCustomMarkers();
        }
    }

    deleteCustomMarker(cm: any): void {
        this.userCustomMarkers = this.userCustomMarkers.filter(m => m.id !== cm.id);
        if (this.activeCustomMarker?.id === cm.id) {
            this.activeCustomMarker = null;
        }
        if (this.targetCustomMarker?.id === cm.id) {
            this.targetCustomMarker = null;
        }
        this.saveCustomMarkers();
    }

    getMarkerPopupStyle(m: { x?: number; y?: number }): { [key: string]: string } {
        if (m.x === undefined || m.y === undefined || !this.canvasW) {
            return { display: 'none' };
        }
        const base = this.coverScale();
        const curW = this.bgNatural.w * base * this.zoom;
        const curH = this.bgNatural.h * base * this.zoom;
        const posX = this.zoom <= this.minZoom ? (this.canvasW - curW) / 2 : this.bgPosX;
        const posY = this.zoom <= this.minZoom ? (this.canvasH - curH) / 2 : this.bgPosY;
        const screenX = posX + (m.x / this.bgNatural.w) * curW;
        const screenY = posY + (m.y / this.bgNatural.h) * curH - 24;
        return {
            left: `${screenX}px`,
            top: `${screenY}px`,
            transform: 'translate(-50%, -100%)',
            position: 'absolute',
            zIndex: '1500'
        };
    }

    focusCustomMarker(cm: any): void {
        if (cm.x !== undefined && cm.y !== undefined && this.canvasW && this.canvasH) {
            this.zoom = 2.5;
            const base = this.coverScale();
            const curW = this.bgNatural.w * base * this.zoom;
            const curH = this.bgNatural.h * base * this.zoom;
            this.bgPosX = this.clampPan((this.canvasW / 2) - (cm.x / this.bgNatural.w) * curW, this.canvasW, curW);
            this.bgPosY = this.clampPan((this.canvasH / 2) - (cm.y / this.bgNatural.h) * curH, this.canvasH, curH);
            this.activeCustomMarker = cm;
            this.activeMarker = null;
        }
    }

    openMarkerContext(cm: any, event: MouseEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.targetCustomMarker = cm;
        this.isMarkerContext = true;
        this.ctxX = event.clientX;
        this.ctxY = event.clientY;
        this.ctxOpen = true;
    }

    runCtxAction(action: string): void {
        if (action === 'marcador') {
            const num = this.userCustomMarkers.length + 1;
            const defaultName = (this.translationService.currentLang === 'es' ? 'Marcador ' : 'Marker ') + num;
            const newMarker = {
                id: 'cm_' + Date.now(),
                name: defaultName,
                color: 'red',
                x: this.ctxWorldX !== undefined ? this.ctxWorldX : 1200,
                y: this.ctxWorldY !== undefined ? this.ctxWorldY : 675
            };
            this.userCustomMarkers.push(newMarker);
            this.saveCustomMarkers();
            this.activeCustomMarker = newMarker;
            this.activeMarker = null;
        } else if (action === 'editar_marcador' && this.targetCustomMarker) {
            this.activeCustomMarker = this.targetCustomMarker;
            this.activeMarker = null;
        } else if (action === 'borrar_este_marcador' && this.targetCustomMarker) {
            this.deleteCustomMarker(this.targetCustomMarker);
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
        this.canvasW = el.clientWidth;
        this.canvasH = el.clientHeight;
        const cursorX = event.clientX - rect.left;
        const cursorY = event.clientY - rect.top;
        const base = this.coverScale();
        const curW = this.bgNatural.w * base * this.zoom;
        const curH = this.bgNatural.h * base * this.zoom;
        const posX = this.zoom <= this.minZoom ? (this.canvasW - curW) / 2 : this.bgPosX;
        const posY = this.zoom <= this.minZoom ? (this.canvasH - curH) / 2 : this.bgPosY;
        if (curW && curH) {
            const fracX = (cursorX - posX) / curW;
            const fracY = (cursorY - posY) / curH;
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
        const prevPosX = this.zoom <= this.minZoom ? (cw - prevW) / 2 : this.bgPosX;
        const prevPosY = this.zoom <= this.minZoom ? (ch - prevH) / 2 : this.bgPosY;

        const fracX = (cursorX - prevPosX) / prevW;
        const fracY = (cursorY - prevPosY) / prevH;

        const factor = event.deltaY < 0 ? 1.25 : 1 / 1.25;
        const next = Math.min(this.maxZoom, Math.max(this.minZoom, this.zoom * factor));
        if (next === this.zoom) { return; }
        this.zoom = next;

        const newW = this.bgNatural.w * base * next;
        const newH = this.bgNatural.h * base * next;

        if (next <= this.minZoom) {
            this.bgPosX = (cw - newW) / 2;
            this.bgPosY = (ch - newH) / 2;
            return;
        }

        this.bgPosX = this.clampPan(cursorX - fracX * newW, cw, newW);
        this.bgPosY = this.clampPan(cursorY - fracY * newH, ch, newH);
    }

    onCanvasMouseDown(event: MouseEvent): void {
        if (event.button !== 0) return;
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

    @HostListener('window:resize')
    onWindowResize(): void {
        const el = document.getElementById('gta6-map-canvas');
        if (el) {
            this.canvasW = el.clientWidth;
            this.canvasH = el.clientHeight;
        }
    }

    private coverScale(): number {
        if (!this.canvasW || !this.canvasH || !this.bgNatural.w || !this.bgNatural.h) return 1;
        return Math.max(this.canvasW / this.bgNatural.w, this.canvasH / this.bgNatural.h);
    }

    private clampPan(value: number, containerSize: number, imageSize: number): number {
        if (imageSize <= containerSize) {
            return (containerSize - imageSize) / 2;
        }
        const min = containerSize - imageSize;
        return Math.max(min, Math.min(0, value));
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

    ngOnDestroy(): void {
        if (this.clockInterval) {
            clearInterval(this.clockInterval);
        }
    }
}
