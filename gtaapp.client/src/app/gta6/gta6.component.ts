import { Component, OnDestroy, OnInit } from '@angular/core';

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

@Component({
    selector: 'app-gta6',
    templateUrl: './gta6.component.html',
    styleUrls: ['./gta6.component.css'],
    standalone: false
})
export class Gta6Component implements OnInit, OnDestroy {

    readonly categories: Gta6LegendCategory[] = [
        {
            key: 'categoria_1',
            title: 'Categoria 1',
            items: [
                { id: 'categoria_1_item_1', name: 'item 1', count: 10, color: '#2ecc71' },
                { id: 'categoria_1_item_2', name: 'item 2', count: 20, color: '#3498db' },
                { id: 'categoria_1_item_3', name: 'item 3', count: 30, color: '#e74c3c' }
            ]
        },
        {
            key: 'categoria_2',
            title: 'Categoria 2',
            items: [
                { id: 'categoria_2_item_1', name: 'item 1', count: 40, color: '#f1c40f' },
                { id: 'categoria_2_item_2', name: 'item 2', count: 50, color: '#9b59b6' },
                { id: 'categoria_2_item_3', name: 'item 3', count: 60, color: '#1abc9c' }
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
            key: 'categoria_6',
            title: 'Categoria 6',
            items: [
                { id: 'categoria_6_item_1', name: 'item 1', count: 160, color: '#e91e63' },
                { id: 'categoria_6_item_2', name: 'item 2', count: 170, color: '#00cec9' },
                { id: 'categoria_6_item_3', name: 'item 3', count: 180, color: '#e056fd' }
            ]
        }
    ];

    readonly mapTypes = [
        { id: 'Satellite', label: 'Satélite' },
        { id: 'Roadmap', label: 'Carreteras' },
        { id: 'Atlas', label: 'Atlas' }
    ];

    legendOpen = true;
    settingsOpen = true;
    selectedGameMode: 'story' | 'online' = 'online';
    currentMapType = 'Satellite';
    iconTheme = 'modern';
    iconSize = 'standard';
    inGameTimeStr = '00:00';

    accordion: { [key: string]: boolean } = {
        categoria_1: false,
        categoria_2: false,
        categoria_3: false,
        categoria_4: false,
        categoria_5: false,
        categoria_6: false,
        modo: false,
        mapa: false,
        zona: false
    };

    layerFilters: { [key: string]: boolean } = this.categories.reduce((acc, category) => {
        category.items.forEach(item => {
            acc[item.id] = true;
        });
        return acc;
    }, {} as { [key: string]: boolean });

    private clockInterval: ReturnType<typeof setInterval> | undefined;

    get totalItems(): number {
        return this.categories.reduce((sum, category) => sum + category.items.length, 0);
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
    }

    updateIconStyle(): void { }

    onZoneChange(zone: string): void { }

    recenterMap(): void { }

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
