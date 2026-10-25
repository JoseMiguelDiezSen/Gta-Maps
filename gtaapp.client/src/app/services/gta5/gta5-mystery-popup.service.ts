import { Injectable } from '@angular/core';
import * as L from 'leaflet';
import { GtaMystery } from '../../models/gta5/mystery';
import { escapeHtml } from '../../utils/html-sanitizer';

export interface MysteryPopupData {
    mystery: GtaMystery;
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
        const safeColor = escapeHtml(pinColor);
        return L.divIcon({
            className: 'gta-pin-mystery-pulse',
            html: `
                <div class="gta-step-pin-wrap">
                    <div class="gta-step-pin-pulse" style="background: ${isSkull ? '#dc2626' : safeColor};"></div>
                    <div class="gta-step-pin-badge" style="background: ${isSkull ? '#b91c1c' : safeColor}; box-shadow: 0 0 16px ${isSkull ? '#dc2626' : safeColor}, 0 4px 10px rgba(0,0,0,0.8);">
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
        const safeColor = escapeHtml(pinColor);
        const safeIcon = escapeHtml(pinIcon);
        return L.divIcon({
            className: 'gta-pin-mystery-pulse',
            html: `
                <div class="gta-single-pin-wrap">
                    <div class="gta-single-pin-pulse" style="background: ${safeColor};"></div>
                    <div class="gta-single-pin-core" style="background: ${safeColor}; box-shadow: 0 0 16px ${safeColor}, 0 4px 10px rgba(0,0,0,0.8);">
                        <i class="fa-solid ${safeIcon}"></i>
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
        const pointTitle = escapeHtml(point?.title || `${mystery.title} (Punto ${stepNum})`);
        const pointDesc = escapeHtml(point?.description || point?.tip || mystery.description);
        const badgeLabel = escapeHtml(isSkull ? `Cadáver #${stepNum - 4}` : `${mystery.categoryLabel || 'Misterio'} #${stepNum}`);
        const badgeIcon = escapeHtml(isSkull ? 'fa-skull' : pinIcon);
        const safePinColor = escapeHtml(pinColor);
        const safeBgGradient = escapeHtml(bgGradient);

        const headerHtml = thumbnailUrl ? `
            <div class="gta-popup-hero" style="border-bottom: 2px solid ${safePinColor};">
                <img src="${escapeHtml(thumbnailUrl)}" alt="${pointTitle}" class="gta-popup-hero-img" onerror="this.style.display='none'" />
                <div class="gta-popup-hero-overlay"></div>
                <span class="popup-badge" style="color: ${safePinColor}; border: 1px solid ${safePinColor}88;">
                    <i class="fa-solid ${badgeIcon}"></i>${badgeLabel}
                </span>
                <div class="gta-popup-hero-text">
                    <h4 class="popup-title">${pointTitle}</h4>
                </div>
            </div>
        ` : `
            <div class="popup-banner" style="background: linear-gradient(135deg, ${safePinColor}44, rgba(5,10,18,0.95) 85%); border-bottom: 2px solid ${safePinColor};">
                <span class="popup-badge" style="color: ${safePinColor}; border: 1px solid ${safePinColor}88;">
                    <i class="fa-solid ${badgeIcon}"></i>${badgeLabel}
                </span>
                <h4 class="popup-title">${pointTitle}</h4>
            </div>
        `;

        const scheduleHtml = mystery.schedule ? `
            <div class="popup-row" style="margin-bottom: 6px; font-size: 11px; opacity: 0.85;">
                <i class="fa-solid fa-clock" style="margin-right: 4px;"></i>
                <span>${escapeHtml(mystery.schedule)}</span>
            </div>
        ` : '';

        return `
            <div class="gta-popup-card" style="background: ${safeBgGradient};">
                ${headerHtml}
                <div class="popup-content">
                    <div class="popup-zone">
                        <i class="fa-solid fa-location-dot"></i>
                        <span>${escapeHtml(mystery.zone || mystery.location || 'San Andreas')} (X: ${point.position.x.toFixed(1)} | Y: ${point.position.y.toFixed(1)})</span>
                    </div>
                    ${scheduleHtml}
                    <div class="popup-desc">
                        ${pointDesc}
                    </div>
                </div>
            </div>
        `;
    }

    buildSinglePopupHtml(data: MysteryPopupData): string {
        const { mystery, pinColor, pinIcon, bgGradient, thumbnailUrl } = data;
        const safeTitle = escapeHtml(mystery.title);
        const safePinColor = escapeHtml(pinColor);
        const safePinIcon = escapeHtml(pinIcon);
        const safeBgGradient = escapeHtml(bgGradient);
        const safeCategoryLabel = escapeHtml(mystery.categoryLabel || 'Misterio');

        const bannerHtml = thumbnailUrl ? `
            <div class="gta-popup-hero" style="border-bottom: 2px solid ${safePinColor};">
                <img src="${escapeHtml(thumbnailUrl)}" alt="${safeTitle}" class="gta-popup-hero-img" onerror="this.style.display='none'" />
                <div class="gta-popup-hero-overlay"></div>
                <span class="popup-badge" style="color: ${safePinColor}; border: 1px solid ${safePinColor}88;">
                    <i class="fa-solid ${safePinIcon}"></i>${safeCategoryLabel}
                </span>
                <div class="gta-popup-hero-text">
                    <h4 class="popup-title">${safeTitle}</h4>
                </div>
            </div>
        ` : `
            <div class="popup-banner" style="background: linear-gradient(135deg, ${safePinColor}44, rgba(5,10,18,0.95) 85%); border-bottom: 2px solid ${safePinColor};">
                <span class="popup-badge" style="color: ${safePinColor}; border: 1px solid ${safePinColor}88;">
                    <i class="fa-solid ${safePinIcon}"></i>${safeCategoryLabel}
                </span>
                <h4 class="popup-title">${safeTitle}</h4>
            </div>
        `;

        const scheduleHtml = mystery.schedule ? `
            <div class="popup-row" style="margin-bottom: 6px; font-size: 11px; opacity: 0.85;">
                <i class="fa-solid fa-clock" style="margin-right: 4px;"></i>
                <span>${escapeHtml(mystery.schedule)}</span>
            </div>
        ` : '';

        const stepsSummaryHtml = (mystery.points && Array.isArray(mystery.points) && mystery.points.length > 0) ? `
            <div class="gta-popup-steps-summary">
                <span class="gta-popup-steps-label"><i class="fa-solid fa-route"></i> Cadena de Investigación:</span>
                <span class="gta-popup-steps-val">${mystery.points.length} Localizaciones registradas</span>
            </div>
        ` : '';

        return `
            <div class="gta-popup-card" style="background: ${safeBgGradient};">
                ${bannerHtml}
                <div class="popup-content">
                    <div class="popup-zone">
                        <i class="fa-solid fa-location-dot"></i>
                        <span>${escapeHtml(mystery.zone || mystery.location || 'San Andreas')} (X: ${mystery.position.x.toFixed(1)} | Y: ${mystery.position.y.toFixed(1)})</span>
                    </div>
                    ${scheduleHtml}
                    <div class="popup-desc">
                        ${escapeHtml(mystery.description)}
                    </div>
                    ${stepsSummaryHtml}
                </div>
            </div>
        `;
    }
}
