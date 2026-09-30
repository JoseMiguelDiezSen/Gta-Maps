import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslationService } from '../../i18n';

interface Gta6LegendItem {
    id: string;
    name: string;
    count: number;
    color: string;
}

interface Gta6LegendCategory {
    key: string;
    title: string;
    items: Gta6LegendItem[];
}

// ---------------------------------------------------------------------------
// GTA VI — MODO HISTORIA (Basado en filtraciones y canvas interactivo)
// Componente de visualización con soporte para zoom sobre mapa filtrado,
// panel de capas preliminares y categorías de Vice City / Leonida.
// ---------------------------------------------------------------------------

@Component({
    selector: 'app-gta6-historia',
    templateUrl: './gta6-historia.component.html',
    styleUrls: ['./gta6-historia.component.css'],
    standalone: false
})
export class Gta6HistoriaComponent implements OnInit, OnDestroy {

    // Telemetría de coordenadas. GTA6 no tiene mapa, así que se queda en 0,0
    mouseCoords = { x: 0, y: 0 };
    coordsCopied = false;

    // Zoom del fondo con la rueda del ratón, anclado al punto donde está el cursor
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

    readonly categories: Gta6LegendCategory[] = [
        {
            key: 'propiedades',
            title: 'Propiedades',
            items: [
                { id: 'casa_jason', name: 'Casa de Jason', count: 0, color: '#3498db' },
                { id: 'casa_lucia', name: 'Casa de Lucía', count: 0, color: '#ff5fa2' },
                { id: 'casa_jason_lucia', name: 'Casa de Jason y Lucía', count: 0, color: '#9b59b6' }
            ]
        },
        {
            key: 'negocios',
            title: 'Negocios',
            items: [
                { id: 'coke_lockup', name: 'Negocios de Cocaína', count: 0, color: '#7f8c8d' },
                { id: 'weed_farm', name: 'Negocios de Marihuana', count: 0, color: '#27ae60' },
                { id: 'warehouse', name: 'Almacenes de Cajas', count: 0, color: '#8e6e3a' },
                { id: 'nightclub', name: 'Clubes Nocturnos', count: 0, color: '#8e44ad' },
                { id: 'cash_factory', name: 'Fábricas de Dinero Falso', count: 0, color: '#16a085' },
                { id: 'meth_lab', name: 'Laboratorios de Metanfetamina', count: 0, color: '#c0392b' },
                { id: 'doc_forgery', name: 'Falsificación de Documentos', count: 0, color: '#2980b9' }
            ]
        },
        {
            key: 'vehiculos',
            title: 'Talleres',
            items: [
                { id: 'ls_customs', name: 'Los Santos Customs', count: 0, color: '#e67e22' },
                { id: 'hao_garage', name: 'Garaje de Hao', count: 0, color: '#f1c40f' },
                { id: 'bennys', name: "Benny's Original Motor Works", count: 0, color: '#c0392b' },
                { id: 'ls_car_meet', name: 'LS Car Meet (Cypress)', count: 0, color: '#16a085' }
            ]
        },
        {
            key: 'categoria_3',
            title: 'Categoria 3',
            items: [
                { id: 'categoria_3_item_1', name: 'item 1', count: 70, color: '#e67e22' },
                { id: 'categoria_3_item_2', name: 'item 2', count: 80, color: '#d35400' },
                { id: 'categoria_3_item_3', name: 'item 3', count: 90, color: '#16a085' }
            ]
        },
        {
            key: 'categoria_4',
            title: 'Categoria 4',
            items: [
                { id: 'categoria_4_item_1', name: 'item 1', count: 100, color: '#2980b9' },
                { id: 'categoria_4_item_2', name: 'item 2', count: 110, color: '#8e44ad' },
                { id: 'categoria_4_item_3', name: 'item 3', count: 120, color: '#c0392b' }
            ]
        },
        {
            key: 'categoria_5',
            title: 'Categoria 5',
            items: [
                { id: 'categoria_5_item_1', name: 'item 1', count: 130, color: '#d4af37' },
                { id: 'categoria_5_item_2', name: 'item 2', count: 140, color: '#27ae60' },
                { id: 'categoria_5_item_3', name: 'item 3', count: 150, color: '#95a5a6' }
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
                { id: 'fauna_bobcat', name: '🐆 Bobcat / Felino salvaje', count: 0, color: '#9e9e9e' },
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
                { id: 'coleccionable_carta', name: 'Carta de juego', count: 0, color: '#8e24aa' },
                { id: 'coleccionable_figura', name: 'Figura de acción', count: 0, color: '#5e35b1' },
                { id: 'coleccionable_jammer', name: 'Jammer de señal', count: 0, color: '#00897b' },
                { id: 'coleccionable_prop', name: 'Atrezo de cine', count: 0, color: '#d81b60' },
                { id: 'coleccionable_antena', name: 'Antena de radio', count: 0, color: '#3949ab' }
            ]
        },
        {
            key: 'lugares',
            title: 'Lugares Extraños',
            items: [
                { id: 'lugar_ovni', name: 'OVNI falso', count: 0, color: '#7e57c2' },
                { id: 'lugar_naufragio', name: 'Naufragio', count: 0, color: '#0277bd' },
                { id: 'lugar_cueva', name: 'Cueva', count: 0, color: '#5d4037' }
            ]
        }
    ];

    readonly policiaItems: Gta6LegendItem[] = [
        { id: 'policia-missionrow', name: 'Comisaría de Mission Row', count: 0, color: '#2980b9' },
        { id: 'policia-vespucci', name: 'Comisaría de Vespucci', count: 0, color: '#2980b9' },
        { id: 'policia-vinewood', name: 'Comisaría de Vinewood', count: 0, color: '#2980b9' },
        { id: 'policia-davis', name: 'Comisaría Sheriff de Davis', count: 0, color: '#2980b9' },
        { id: 'policia-rockford', name: 'Comisaría de Rockford Hills', count: 0, color: '#2980b9' },
        { id: 'policia-sandyshores', name: 'Comisaría Sheriff de Sandy Shores', count: 0, color: '#2980b9' },
        { id: 'policia-paletobay', name: 'Comisaría Sheriff de Paleto Bay', count: 0, color: '#2980b9' }
    ];

    readonly policiaKeys: string[] = this.policiaItems.map(i => i.id);

    constructor(
        readonly translationService: TranslationService,
        private router: Router
    ) {}

    get mapTypes() {
        return [
            { id: 'Satellite', label: this.translationService.t('gta5.maps.satellite'), file: '/assets/filtracionesGta6/satelite.jpg', w: 912, h: 1136 },
            { id: 'Roadmap', label: this.translationService.t('gta5.maps.roadmap'), file: '/assets/filtracionesGta6/image.jpg', w: 880, h: 1168 },
            { id: 'Atlas', label: this.translationService.t('gta5.maps.atlas'), file: '/assets/filtracionesGta6/image.jpg', w: 880, h: 1168 }
        ];
    }

    legendOpen = true;
    settingsOpen = true;
    selectedGame = 'gta6';
    selectedGameMode: 'story' | 'online' = 'online';
    currentMapType = 'Satellite';
    iconTheme: 'modern' | 'classic' | 'standard' | 'simple' = 'classic';
    iconSize = 'standard';
    inGameTimeStr = '00:00';

    accordion: { [key: string]: boolean } = {
        propiedades: false,
        vehiculos: false,
        negocios: false,
        categoria_3: false,
        categoria_4: false,
        categoria_5: false,
        fauna: false,
        coleccionables: false,
        lugares: false,
        policia: false,
        mapa: false,
        zona: false,
        juego: false
    };

    switchGame(game: string): void {
        this.selectedGame = game;
        if (game === 'gta5') {
            this.router.navigate(['/gta5-online']);
        } else {
            this.router.navigate(['/gta6-online']);
        }
    }

    layerFilters: { [key: string]: boolean } = [
        ...this.categories.reduce((acc, category) => acc.concat(category.items), [] as Gta6LegendItem[]),
        ...this.policiaItems
    ].reduce((acc, item) => {
        acc[item.id] = true;
        return acc;
    }, {} as { [key: string]: boolean });

    private clockInterval: ReturnType<typeof setInterval> | undefined;

    get totalItems(): number {
        return this.categories.reduce((sum, category) => sum + category.items.length, 0);
    }

    get activeMapType() {
        return this.mapTypes.find(t => t.id === this.currentMapType) || this.mapTypes[0];
    }

    /** Medidas reales de la imagen activa: el zoom depende de ellas */
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

    ngOnInit(): void {
        this.startInGameClock();
    }

    ngOnDestroy(): void {
        if (this.clockInterval) {
            clearInterval(this.clockInterval);
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

    onZoneChange(zone: string): void { }

    recenterMap(): void { }

    copyCurrentCoords(): void {
        const text = `X: ${this.mouseCoords.x.toFixed(1)}, Y: ${this.mouseCoords.y.toFixed(1)}`;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                this.coordsCopied = true;
                setTimeout(() => this.coordsCopied = false, 1800);
            });
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

        // Qué punto de la foto hay justo debajo del cursor, para no perderlo al hacer zoom
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
