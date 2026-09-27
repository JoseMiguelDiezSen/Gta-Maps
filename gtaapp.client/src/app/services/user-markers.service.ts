import { Injectable } from '@angular/core';
import * as L from 'leaflet';
import { MapMarkerFactory } from '../utils/map-marker.factory';

export interface UserCustomMarker {
    id: string;
    name: string;
    marker: L.Marker;
    latLng: L.LatLng;
}

@Injectable({
    providedIn: 'root'
})
export class UserMarkersService {
    private markers: UserCustomMarker[] = [];

    get allMarkers(): UserCustomMarker[] {
        return this.markers;
    }

    addMarker(
        latLng: L.LatLng,
        layer: L.LayerGroup,
        onContextMenu: (item: UserCustomMarker, e: L.LeafletMouseEvent) => void
    ): UserCustomMarker {
        const id = 'custom-' + Date.now();
        const name = 'Marcador ' + (this.markers.length + 1);
        const icon = MapMarkerFactory.createPushpinIcon();
        const marker = L.marker(latLng, { icon });
        const item: UserCustomMarker = { id, name, marker, latLng };

        marker.on('contextmenu', (e: L.LeafletMouseEvent) => {
            L.DomEvent.stopPropagation(e);
            onContextMenu(item, e);
        });

        this.updatePopup(item);
        marker.addTo(layer);
        this.markers.push(item);
        marker.openPopup();
        return item;
    }

    updatePopup(item: UserCustomMarker): void {
        const html = MapMarkerFactory.createCustomMarkerPopupHtml(item.id, item.name);
        item.marker.bindPopup(html, {
            className: 'gta-custom-pin-popup',
            maxWidth: 240,
            minWidth: 200,
            autoPan: true
        });
    }

    renameMarker(id: string, newName: string): void {
        const item = this.markers.find(m => m.id === id);
        if (item && newName && newName.trim() !== '') {
            item.name = newName.trim();
            this.updatePopup(item);
            item.marker.openPopup();
        }
    }

    deleteMarker(id: string, layer: L.LayerGroup): void {
        const item = this.markers.find(m => m.id === id);
        if (item) {
            layer.removeLayer(item.marker);
            this.markers = this.markers.filter(m => m.id !== id);
        }
    }

    clearAll(layer: L.LayerGroup): void {
        layer.clearLayers();
        this.markers = [];
    }

    findMarker(id: string): UserCustomMarker | undefined {
        return this.markers.find(m => m.id === id);
    }
}
