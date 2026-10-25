import { Injectable } from '@angular/core';
import * as L from 'leaflet';

export interface MysteryPopupData {
    mystery: any;
    point?: any;
    stepNum?: number;
    isSkull?: boolean;
    pinColor: string;
    pinIcon: string;
    bgGradient: string;
    thumbnailUrl?: string;
}

@Injectable({
    providedIn: 'root'
})
export class Gta5MysteryPopupService {

    createStepIcon(stepNum: number, isSkull: boolean, pinColor: string): L.DivIcon {
        return L.divIcon({
            className: 'gta-pin-mystery-pulse',
            html: `
                <div class="gta-step-pin-wrap">
                    <div class="gta-step-pin-pulse" style="background: ${isSkull ? '#dc2626' : pinColor};"></div>
                    <div class="gta-step-pin-badge" style="background: ${isSkull ? '#b91c1c' : pinColor}; box-shadow: 0 0 16px ${isSkull ? '#dc2626' : pinColor}, 0 4px 10px rgba(0,0,0,0.8);">
                        ${isSkull ? '<i class="fa-solid fa-skull"></i>' : stepNum}
                    </div>
                    ${isSkull ? `
                    <div class="gta-step-pin-skull-idx">
                        ${stepNum}
                    </div>` : ''}
                </div>
            `,
            iconSize: [38, 38],
            iconAnchor: [19, 19],
            popupAnchor: [0, -20]
        });
    }

    createSingleMysteryIcon(pinIcon: string, pinColor: string): L.DivIcon {
        return L.divIcon({
            className: 'gta-pin-mystery-pulse',
            html: `
                <div class="gta-single-pin-wrap">
                    <div class="gta-single-pin-pulse" style="background: ${pinColor};"></div>
                    <div class="gta-single-pin-core" style="background: ${pinColor}; box-shadow: 0 0 16px ${pinColor}, 0 4px 10px rgba(0,0,0,0.8);">
                        <i class="fa-solid ${pinIcon}"></i>
                    </div>
                </div>
            `,
            iconSize: [38, 38],
            iconAnchor: [19, 19],
            popupAnchor: [0, -20]
        });
    }

    buildStepPopupHtml(data: MysteryPopupData): string {
        const { mystery, point, stepNum = 1, isSkull = false, pinColor, pinIcon, bgGradient, thumbnailUrl } = data;
        const pointTitle = point?.title || `${mystery.title} (Punto ${stepNum})`;
        const pointDesc = point?.description || point?.tip || mystery.description;
        const badgeLabel = isSkull ? `Cadáver #${stepNum - 4}` : `${mystery.categoryLabel || 'Misterio'} #${stepNum}`;
        const badgeIcon = isSkull ? 'fa-skull' : pinIcon;

        const headerHtml = thumbnailUrl ? `
            <div class="gta-popup-hero" style="border-bottom: 2px solid ${pinColor};">
                <img src="${thumbnailUrl}" alt="${pointTitle}" class="gta-popup-hero-img" onerror="this.style.display='none'" />
                <div class="gta-popup-hero-overlay"></div>
                <span class="popup-badge" style="color: ${pinColor}; border: 1px solid ${pinColor}88;">
                    <i class="fa-solid ${badgeIcon}"></i>${badgeLabel}
                </span>
                <button type="button" onclick="window._closeGtaMapPopup()" class="popup-card-close-btn" title="Cerrar">
                    <i class="fa-solid fa-xmark"></i>
                </button>
                <div class="gta-popup-hero-text">
                    <h4 class="popup-title">${pointTitle}</h4>
                </div>
            </div>
        ` : `
            <div class="popup-banner" style="background: linear-gradient(135deg, ${pinColor}44, rgba(5,10,18,0.95) 85%); border-bottom: 2px solid ${pinColor};">
                <span class="popup-badge" style="color: ${pinColor}; border: 1px solid ${pinColor}88;">
                    <i class="fa-solid ${badgeIcon}"></i>${badgeLabel}
                </span>
                <button type="button" onclick="window._closeGtaMapPopup()" class="popup-card-close-btn" title="Cerrar">
                    <i class="fa-solid fa-xmark"></i>
                </button>
                <h4 class="popup-title">${pointTitle}</h4>
            </div>
        `;

        return `
            <div class="gta-popup-card" style="background: ${bgGradient};">
                ${headerHtml}
                <div class="popup-content">
                    <div class="popup-zone">
                        <i class="fa-solid fa-location-dot"></i>
                        <span>X: ${point.position.x.toFixed(1)} | Y: ${point.position.y.toFixed(1)}</span>
                    </div>
                    <div class="popup-desc">
                        ${pointDesc}
                    </div>
                </div>
            </div>
        `;
    }

    buildSinglePopupHtml(data: MysteryPopupData): string {
        const { mystery, pinColor, pinIcon, bgGradient, thumbnailUrl } = data;
        const bannerHtml = thumbnailUrl ? `
            <div class="gta-popup-hero" style="border-bottom: 2px solid ${pinColor};">
                <img src="${thumbnailUrl}" alt="${mystery.title}" class="gta-popup-hero-img" onerror="this.style.display='none'" />
                <div class="gta-popup-hero-overlay"></div>
                <span class="popup-badge" style="color: ${pinColor}; border: 1px solid ${pinColor}88;">
                    <i class="fa-solid ${pinIcon}"></i>${mystery.categoryLabel || 'Misterio'}
                </span>
                <button type="button" onclick="window._closeGtaMapPopup()" class="popup-card-close-btn" title="Cerrar">
                    <i class="fa-solid fa-xmark"></i>
                </button>
                <div class="gta-popup-hero-text">
                    <h4 class="popup-title">${mystery.title}</h4>
                </div>
            </div>
        ` : `
            <div class="popup-banner" style="background: linear-gradient(135deg, ${pinColor}44, rgba(5,10,18,0.95) 85%); border-bottom: 2px solid ${pinColor};">
                <span class="popup-badge" style="color: ${pinColor}; border: 1px solid ${pinColor}88;">
                    <i class="fa-solid ${pinIcon}"></i>${mystery.categoryLabel || 'Misterio'}
                </span>
                <button type="button" onclick="window._closeGtaMapPopup()" class="popup-card-close-btn" title="Cerrar">
                    <i class="fa-solid fa-xmark"></i>
                </button>
                <h4 class="popup-title">${mystery.title}</h4>
            </div>
        `;

        const stepsSummaryHtml = (mystery.points && Array.isArray(mystery.points) && mystery.points.length > 0) ? `
            <div class="gta-popup-steps-summary">
                <span class="gta-popup-steps-label"><i class="fa-solid fa-route"></i> Cadena de Investigación:</span>
                <span class="gta-popup-steps-val">${mystery.points.length} Localizaciones registradas</span>
            </div>
        ` : '';

        return `
            <div class="gta-popup-card" style="background: ${bgGradient};">
                ${bannerHtml}
                <div class="popup-content">
                    <div class="popup-zone">
                        <i class="fa-solid fa-location-dot"></i>
                        <span>${mystery.location || 'San Andreas'} (X: ${mystery.position.x.toFixed(1)} | Y: ${mystery.position.y.toFixed(1)})</span>
                    </div>
                    <div class="popup-desc">
                        ${mystery.description}
                    </div>
                    ${stepsSummaryHtml}
                </div>
            </div>
        `;
    }
}
