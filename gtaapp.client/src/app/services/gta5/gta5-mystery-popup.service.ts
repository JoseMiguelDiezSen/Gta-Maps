import { Injectable } from '@angular/core';
import * as L from 'leaflet';
import { GtaMystery } from '../../models/gta5/mystery';

export interface MysteryPopupData {
    mystery: GtaMystery;
    point?: {
        title?: string;
        description?: string;
        tip?: string;
        position: { x: number; y: number };
    };
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
        const wrap = document.createElement('div');
        wrap.className = 'gta-step-pin-wrap';

        const pulse = document.createElement('div');
        pulse.className = 'gta-step-pin-pulse';
        pulse.style.background = isSkull ? '#dc2626' : pinColor;

        const badge = document.createElement('div');
        badge.className = 'gta-step-pin-badge';
        const color = isSkull ? '#b91c1c' : pinColor;
        badge.style.background = color;
        badge.style.boxShadow = `0 0 16px ${isSkull ? '#dc2626' : pinColor}, 0 4px 10px rgba(0,0,0,0.8)`;

        if (isSkull) {
            const icon = document.createElement('i');
            icon.className = 'fa-solid fa-skull';
            badge.appendChild(icon);
        } else {
            badge.textContent = String(stepNum);
        }

        wrap.append(pulse, badge);

        if (isSkull) {
            const skullIdx = document.createElement('div');
            skullIdx.className = 'gta-step-pin-skull-idx';
            skullIdx.textContent = String(stepNum);
            wrap.appendChild(skullIdx);
        }

        return L.divIcon({
            className: 'gta-pin-mystery-pulse',
            html: wrap,
            iconSize: [38, 38],
            iconAnchor: [19, 19],
            popupAnchor: [0, -20]
        });
    }

    createSingleMysteryIcon(pinIcon: string, pinColor: string): L.DivIcon {
        const wrap = document.createElement('div');
        wrap.className = 'gta-single-pin-wrap';

        const pulse = document.createElement('div');
        pulse.className = 'gta-single-pin-pulse';
        pulse.style.background = pinColor;

        const core = document.createElement('div');
        core.className = 'gta-single-pin-core';
        core.style.background = pinColor;
        core.style.boxShadow = `0 0 16px ${pinColor}, 0 4px 10px rgba(0,0,0,0.8)`;

        const icon = document.createElement('i');
        icon.className = `fa-solid ${pinIcon}`;
        core.appendChild(icon);

        wrap.append(pulse, core);

        return L.divIcon({
            className: 'gta-pin-mystery-pulse',
            html: wrap,
            iconSize: [38, 38],
            iconAnchor: [19, 19],
            popupAnchor: [0, -20]
        });
    }

    buildStepPopupHtml(data: MysteryPopupData): HTMLElement {
        const { mystery, point, stepNum = 1, isSkull = false, pinColor, pinIcon, bgGradient, thumbnailUrl } = data;
        const pointTitle = point?.title || `${mystery.title} (Punto ${stepNum})`;
        const pointDesc = point?.description || point?.tip || mystery.description;
        const badgeLabel = isSkull ? `Cadáver #${stepNum - 4}` : `${mystery.categoryLabel || 'Misterio'} #${stepNum}`;
        const badgeIcon = isSkull ? 'fa-skull' : pinIcon;

        const card = document.createElement('div');
        card.className = 'gta-popup-card';
        card.style.background = bgGradient;

        if (thumbnailUrl) {
            const hero = document.createElement('div');
            hero.className = 'gta-popup-hero';
            hero.style.borderBottom = `2px solid ${pinColor}`;

            const img = document.createElement('img');
            img.src = thumbnailUrl;
            img.alt = pointTitle;
            img.className = 'gta-popup-hero-img';
            img.onerror = () => { img.style.display = 'none'; };

            const overlay = document.createElement('div');
            overlay.className = 'gta-popup-hero-overlay';

            const badge = document.createElement('span');
            badge.className = 'popup-badge';
            badge.style.color = pinColor;
            badge.style.border = `1px solid ${pinColor}88`;
            const bIcon = document.createElement('i');
            bIcon.className = `fa-solid ${badgeIcon}`;
            badge.append(bIcon, document.createTextNode(badgeLabel));

            const textWrap = document.createElement('div');
            textWrap.className = 'gta-popup-hero-text';
            const title = document.createElement('h4');
            title.className = 'popup-title';
            title.textContent = pointTitle;
            textWrap.appendChild(title);

            hero.append(img, overlay, badge, textWrap);
            card.appendChild(hero);
        } else {
            const banner = document.createElement('div');
            banner.className = 'popup-banner';
            banner.style.background = `linear-gradient(135deg, ${pinColor}44, rgba(5,10,18,0.95) 85%)`;
            banner.style.borderBottom = `2px solid ${pinColor}`;

            const badge = document.createElement('span');
            badge.className = 'popup-badge';
            badge.style.color = pinColor;
            badge.style.border = `1px solid ${pinColor}88`;
            const bIcon = document.createElement('i');
            bIcon.className = `fa-solid ${badgeIcon}`;
            badge.append(bIcon, document.createTextNode(badgeLabel));

            const title = document.createElement('h4');
            title.className = 'popup-title';
            title.textContent = pointTitle;

            banner.append(badge, title);
            card.appendChild(banner);
        }

        const content = document.createElement('div');
        content.className = 'popup-content';

        const zone = document.createElement('div');
        zone.className = 'popup-zone';
        const locIcon = document.createElement('i');
        locIcon.className = 'fa-solid fa-location-dot';
        const posText = point?.position
            ? ` (X: ${point.position.x.toFixed(1)} | Y: ${point.position.y.toFixed(1)})`
            : '';
        zone.append(locIcon, document.createTextNode(` ${mystery.zone || mystery.location || 'San Andreas'}${posText}`));
        content.appendChild(zone);

        if (mystery.schedule) {
            const schedRow = document.createElement('div');
            schedRow.className = 'popup-row';
            schedRow.style.marginBottom = '6px';
            schedRow.style.fontSize = '11px';
            schedRow.style.opacity = '0.85';
            const clockIcon = document.createElement('i');
            clockIcon.className = 'fa-solid fa-clock';
            clockIcon.style.marginRight = '4px';
            schedRow.append(clockIcon, document.createTextNode(mystery.schedule));
            content.appendChild(schedRow);
        }

        if (pointDesc) {
            const desc = document.createElement('div');
            desc.className = 'popup-desc';
            desc.textContent = pointDesc;
            content.appendChild(desc);
        }

        card.appendChild(content);
        return card;
    }

    buildSinglePopupHtml(data: MysteryPopupData): HTMLElement {
        const { mystery, pinColor, pinIcon, bgGradient, thumbnailUrl } = data;
        const safeTitle = mystery.title;
        const safeCategoryLabel = mystery.categoryLabel || 'Misterio';

        const card = document.createElement('div');
        card.className = 'gta-popup-card';
        card.style.background = bgGradient;

        if (thumbnailUrl) {
            const hero = document.createElement('div');
            hero.className = 'gta-popup-hero';
            hero.style.borderBottom = `2px solid ${pinColor}`;

            const img = document.createElement('img');
            img.src = thumbnailUrl;
            img.alt = safeTitle;
            img.className = 'gta-popup-hero-img';
            img.onerror = () => { img.style.display = 'none'; };

            const overlay = document.createElement('div');
            overlay.className = 'gta-popup-hero-overlay';

            const badge = document.createElement('span');
            badge.className = 'popup-badge';
            badge.style.color = pinColor;
            badge.style.border = `1px solid ${pinColor}88`;
            const bIcon = document.createElement('i');
            bIcon.className = `fa-solid ${pinIcon}`;
            badge.append(bIcon, document.createTextNode(safeCategoryLabel));

            const textWrap = document.createElement('div');
            textWrap.className = 'gta-popup-hero-text';
            const title = document.createElement('h4');
            title.className = 'popup-title';
            title.textContent = safeTitle;
            textWrap.appendChild(title);

            hero.append(img, overlay, badge, textWrap);
            card.appendChild(hero);
        } else {
            const banner = document.createElement('div');
            banner.className = 'popup-banner';
            banner.style.background = `linear-gradient(135deg, ${pinColor}44, rgba(5,10,18,0.95) 85%)`;
            banner.style.borderBottom = `2px solid ${pinColor}`;

            const badge = document.createElement('span');
            badge.className = 'popup-badge';
            badge.style.color = pinColor;
            badge.style.border = `1px solid ${pinColor}88`;
            const bIcon = document.createElement('i');
            bIcon.className = `fa-solid ${pinIcon}`;
            badge.append(bIcon, document.createTextNode(safeCategoryLabel));

            const title = document.createElement('h4');
            title.className = 'popup-title';
            title.textContent = safeTitle;

            banner.append(badge, title);
            card.appendChild(banner);
        }

        const content = document.createElement('div');
        content.className = 'popup-content';

        const zone = document.createElement('div');
        zone.className = 'popup-zone';
        const locIcon = document.createElement('i');
        locIcon.className = 'fa-solid fa-location-dot';
        const posText = mystery.position
            ? ` (X: ${mystery.position.x.toFixed(1)} | Y: ${mystery.position.y.toFixed(1)})`
            : '';
        zone.append(locIcon, document.createTextNode(` ${mystery.zone || mystery.location || 'San Andreas'}${posText}`));
        content.appendChild(zone);

        if (mystery.schedule) {
            const schedRow = document.createElement('div');
            schedRow.className = 'popup-row';
            schedRow.style.marginBottom = '6px';
            schedRow.style.fontSize = '11px';
            schedRow.style.opacity = '0.85';
            const clockIcon = document.createElement('i');
            clockIcon.className = 'fa-solid fa-clock';
            clockIcon.style.marginRight = '4px';
            schedRow.append(clockIcon, document.createTextNode(mystery.schedule));
            content.appendChild(schedRow);
        }

        if (mystery.description) {
            const desc = document.createElement('div');
            desc.className = 'popup-desc';
            desc.textContent = mystery.description;
            content.appendChild(desc);
        }

        if (mystery.points && Array.isArray(mystery.points) && mystery.points.length > 0) {
            const summary = document.createElement('div');
            summary.className = 'gta-popup-steps-summary';
            const label = document.createElement('span');
            label.className = 'gta-popup-steps-label';
            const routeIcon = document.createElement('i');
            routeIcon.className = 'fa-solid fa-route';
            label.append(routeIcon, document.createTextNode(' Cadena de Investigación:'));
            const val = document.createElement('span');
            val.className = 'gta-popup-steps-val';
            val.textContent = `${mystery.points.length} Localizaciones registradas`;
            summary.append(label, val);
            content.appendChild(summary);
        }

        card.appendChild(content);
        return card;
    }
}
