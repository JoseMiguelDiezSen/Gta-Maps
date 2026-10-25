import { Injectable } from '@angular/core';
import * as L from 'leaflet';
import { LocationItem } from '../../models/gta5/location';
import { CollectibleItem } from '../../models/gta5/collectible';

export interface LocationPopupOptions {
    priceLabel: string;
    pointOfInterestLabel: string;
    incomeLabel?: string;
    buyerLabel?: string;
}

@Injectable({
    providedIn: 'root'
})
export class Gta5MapMarkerService {

    buildLocationPopupHtml(p: LocationItem, options: LocationPopupOptions): HTMLElement {
        const pinColor = p.badge?.color || '#ffb833';
        const isPurchasable = (p.price != null && p.price > 0) || !!p.priceFormatted;
        const isShipwreck = p.category === 'shipwreck';
        const isAnimal = p.category === 'animal' || (p.id && p.id.startsWith('animal-')) || p.categoryLabel === 'Fauna Salvaje';
        const isPublicService = p.category === 'hospital' || p.category === 'police_station' || p.category === 'fire_station';

        const card = document.createElement('div');
        card.className = 'gta-popup-card';

        const rawImg = p.imageUrl || '';
        const finalImg = rawImg ? (rawImg.startsWith('/') ? rawImg : '/' + rawImg) : '';
        if (finalImg) {
            const imgBox = document.createElement('div');
            imgBox.className = 'popup-image-box';
            const img = document.createElement('img');
            img.src = finalImg;
            img.alt = p.name;
            img.className = 'popup-img';
            img.loading = 'lazy';
            img.onerror = () => { imgBox.style.display = 'none'; };
            imgBox.appendChild(img);
            card.appendChild(imgBox);
        }

        const banner = document.createElement('div');
        banner.className = 'popup-banner';
        banner.style.background = `linear-gradient(135deg, ${pinColor}33, #0b0f14 85%)`;
        banner.style.borderBottom = `2px solid ${pinColor}`;

        const badge = document.createElement('span');
        badge.className = 'popup-badge';
        badge.style.color = pinColor;
        badge.style.borderColor = `${pinColor}66`;
        badge.textContent = p.categoryLabel || '';
        banner.appendChild(badge);

        const title = document.createElement('h4');
        title.className = 'popup-title';
        title.textContent = p.name;
        banner.appendChild(title);

        const zone = document.createElement('div');
        zone.className = 'popup-zone';
        zone.textContent = p.zone;
        banner.appendChild(zone);
        card.appendChild(banner);

        const content = document.createElement('div');
        content.className = 'popup-content';

        if (isAnimal) {
            // Sin sección de precio para fauna
        } else if (isShipwreck) {
            const tagBox = document.createElement('div');
            tagBox.className = 'popup-service-tag-box popup-shipwreck-box';
            const tagBadge = document.createElement('span');
            tagBadge.className = 'service-type-badge';
            tagBadge.textContent = p.categoryLabel;
            tagBox.appendChild(tagBadge);
            content.appendChild(tagBox);
        } else if (isPurchasable) {
            const priceBox = document.createElement('div');
            priceBox.className = 'popup-price-box';
            const priceTitle = document.createElement('span');
            priceTitle.className = 'price-title';
            priceTitle.textContent = options.priceLabel;
            const priceNum = document.createElement('span');
            priceNum.className = 'price-num';
            priceNum.textContent = p.priceFormatted || '';
            priceBox.append(priceTitle, document.createTextNode(' '), priceNum);
            content.appendChild(priceBox);
        } else {
            const tagBox = document.createElement('div');
            tagBox.className = 'popup-service-tag-box';
            const tagBadge = document.createElement('span');
            tagBadge.className = 'service-type-badge';
            tagBadge.textContent = p.categoryLabel;
            const tagText = document.createElement('span');
            tagText.className = 'service-status-text';
            tagText.textContent = p.priceFormatted || options.pointOfInterestLabel;
            tagBox.append(tagBadge, tagText);
            content.appendChild(tagBox);
        }

        if (p.income && !isPublicService && !isAnimal && options.incomeLabel) {
            const row = document.createElement('div');
            row.className = 'popup-row';
            const lbl = document.createElement('span');
            lbl.className = 'popup-tag-lbl';
            lbl.textContent = options.incomeLabel;
            const val = document.createElement('span');
            val.className = 'popup-tag-val val-income';
            val.textContent = p.income;
            row.append(lbl, document.createTextNode(' '), val);
            content.appendChild(row);
        }

        if (p.owner && !isPublicService && options.buyerLabel) {
            const row = document.createElement('div');
            row.className = 'popup-row';
            const lbl = document.createElement('span');
            lbl.className = 'popup-tag-lbl';
            lbl.textContent = options.buyerLabel;
            const val = document.createElement('span');
            val.className = 'popup-tag-val';
            val.textContent = p.owner;
            row.append(lbl, document.createTextNode(' '), val);
            content.appendChild(row);
        }

        if (p.description) {
            const desc = document.createElement('p');
            desc.className = 'popup-desc';
            desc.textContent = p.description;
            content.appendChild(desc);
        }

        card.appendChild(content);
        return card;
    }

    buildCayoPericoPopupHtml(loc: LocationItem, coordinatesLabel: string): HTMLElement {
        const badgeColor = loc.badge?.color || '#00d2be';
        const card = document.createElement('div');
        card.className = 'gta-popup-card';

        const rawCayoImg = loc.imageUrl || '';
        const finalCayoImg = rawCayoImg ? (rawCayoImg.startsWith('/') ? rawCayoImg : '/' + rawCayoImg) : '';
        if (finalCayoImg) {
            const imgBox = document.createElement('div');
            imgBox.className = 'popup-image-box';
            const img = document.createElement('img');
            img.src = finalCayoImg;
            img.alt = loc.name;
            img.className = 'popup-img';
            img.loading = 'lazy';
            img.onerror = () => { imgBox.style.display = 'none'; };
            imgBox.appendChild(img);
            card.appendChild(imgBox);
        }

        const banner = document.createElement('div');
        banner.className = 'popup-banner';
        banner.style.background = `linear-gradient(135deg, ${badgeColor}33, #0b0f14 85%)`;
        banner.style.borderBottom = `2px solid ${badgeColor}`;

        const badge = document.createElement('span');
        badge.className = 'popup-badge';
        badge.style.color = badgeColor;
        badge.style.borderColor = `${badgeColor}66`;
        badge.textContent = loc.categoryLabel || '';
        banner.appendChild(badge);

        const title = document.createElement('h4');
        title.className = 'popup-title';
        title.textContent = loc.name;
        banner.appendChild(title);

        const zone = document.createElement('div');
        zone.className = 'popup-zone';
        zone.textContent = `🌴 ${loc.zone}`;
        banner.appendChild(zone);
        card.appendChild(banner);

        const content = document.createElement('div');
        content.className = 'popup-content';

        if (loc.description) {
            const desc = document.createElement('p');
            desc.className = 'popup-desc';
            desc.textContent = loc.description;
            content.appendChild(desc);
        }

        const row = document.createElement('div');
        row.className = 'popup-row';
        row.style.marginTop = '8px';
        row.style.opacity = '0.7';
        row.style.fontSize = '11px';

        const coordsLbl = document.createElement('span');
        coordsLbl.textContent = `${coordinatesLabel}:`;
        const coordsVal = document.createElement('span');
        coordsVal.textContent = `X: ${loc.position.x.toFixed(1)}, Y: ${loc.position.y.toFixed(1)}`;
        row.append(coordsLbl, document.createTextNode(' '), coordsVal);
        content.appendChild(row);

        card.appendChild(content);
        return card;
    }

    buildCollectiblePopupHtml(item: CollectibleItem, rewardLabel: string): HTMLElement {
        const itemColor = item.badge?.color || '#38bdf8';
        const card = document.createElement('div');
        card.className = 'gta-popup-card';

        const banner = document.createElement('div');
        banner.className = 'popup-banner';
        banner.style.background = `linear-gradient(135deg, ${itemColor}33, #0b0f14 85%)`;
        banner.style.borderBottom = `2px solid ${itemColor}`;

        const badge = document.createElement('span');
        badge.className = 'popup-badge';
        badge.style.color = itemColor;
        badge.style.borderColor = `${itemColor}66`;
        badge.textContent = `${item.categoryLabel} (#${item.number}/${item.total})`;
        banner.appendChild(badge);

        const title = document.createElement('h4');
        title.className = 'popup-title';
        title.textContent = item.name;
        banner.appendChild(title);

        const zone = document.createElement('div');
        zone.className = 'popup-zone';
        zone.textContent = item.zone;
        banner.appendChild(zone);
        card.appendChild(banner);

        const content = document.createElement('div');
        content.className = 'popup-content';

        if (item.hint) {
            const desc = document.createElement('p');
            desc.className = 'popup-desc';
            desc.style.margin = '0';
            desc.style.fontSize = '12px';
            desc.style.lineHeight = '1.45';
            desc.style.color = 'rgba(255,255,255,0.9)';
            desc.textContent = item.hint;
            content.appendChild(desc);
        }

        if (item.reward) {
            const rewardBox = document.createElement('div');
            rewardBox.className = 'popup-reward-badge';
            rewardBox.style.display = 'flex';
            rewardBox.style.alignItems = 'center';
            rewardBox.style.gap = '6px';
            rewardBox.style.fontSize = '11px';
            rewardBox.style.background = 'rgba(56, 189, 248, 0.12)';
            rewardBox.style.border = '1px solid rgba(56, 189, 248, 0.35)';
            rewardBox.style.borderRadius = '6px';
            rewardBox.style.padding = '6px 10px';
            rewardBox.style.color = '#bae6fd';
            rewardBox.style.marginTop = '8px';

            const iconSpan = document.createElement('span');
            iconSpan.style.fontSize = '13px';
            iconSpan.textContent = '🎁';

            const textSpan = document.createElement('span');
            const strong = document.createElement('strong');
            strong.textContent = `${rewardLabel}:`;
            textSpan.append(strong, document.createTextNode(` ${item.reward}`));

            rewardBox.append(iconSpan, textSpan);
            content.appendChild(rewardBox);
        }

        card.appendChild(content);
        return card;
    }

    buildOnlineCollectiblePopupHtml(item: CollectibleItem, hintLabel: string, rewardLabel: string): HTMLElement {
        const itemColor = item.badge?.color || '#38bdf8';
        const card = document.createElement('div');
        card.className = 'gta-popup-card';

        const banner = document.createElement('div');
        banner.className = 'popup-banner';
        banner.style.background = `linear-gradient(135deg, ${itemColor}33, #0b0f14 85%)`;
        banner.style.borderBottom = `2px solid ${itemColor}`;

        const badge = document.createElement('span');
        badge.className = 'popup-badge';
        badge.style.color = itemColor;
        badge.style.borderColor = `${itemColor}66`;
        badge.textContent = `${item.categoryLabel} (#${item.number}/${item.total})`;
        banner.appendChild(badge);

        const title = document.createElement('h4');
        title.className = 'popup-title';
        title.textContent = item.name;
        banner.appendChild(title);

        const zone = document.createElement('div');
        zone.className = 'popup-zone';
        zone.textContent = item.zone;
        banner.appendChild(zone);
        card.appendChild(banner);

        const content = document.createElement('div');
        content.className = 'popup-content';

        const hintRow = document.createElement('div');
        hintRow.className = 'popup-row';
        const hintLbl = document.createElement('span');
        hintLbl.className = 'popup-tag-lbl';
        hintLbl.textContent = hintLabel;
        const hintVal = document.createElement('span');
        hintVal.className = 'popup-tag-val';
        hintVal.textContent = item.hint || '';
        hintRow.append(hintLbl, document.createTextNode(' '), hintVal);
        content.appendChild(hintRow);

        if (item.reward) {
            const rewardRow = document.createElement('div');
            rewardRow.className = 'popup-row';
            const rewardLbl = document.createElement('span');
            rewardLbl.className = 'popup-tag-lbl';
            rewardLbl.textContent = rewardLabel;
            const rewardVal = document.createElement('span');
            rewardVal.className = 'popup-tag-val val-income';
            rewardVal.textContent = item.reward;
            rewardRow.append(rewardLbl, document.createTextNode(' '), rewardVal);
            content.appendChild(rewardRow);
        }

        card.appendChild(content);
        return card;
    }

    createPushpinIcon(colorKey = 'red'): L.DivIcon {
        const iconColors: Record<string, string> = {
            red: '#ff3b30',
            blue: '#007aff',
            green: '#34c759',
            yellow: '#ffcc00',
            purple: '#af52de',
            orange: '#ff9500'
        };
        const hex = iconColors[colorKey] ?? '#ff3b30';

        const wrap = document.createElement('div');
        wrap.className = 'custom-pin-stem-wrap';

        const beacon = document.createElement('div');
        beacon.className = 'custom-pin-beacon';
        beacon.style.background = hex;
        beacon.style.boxShadow = `0 0 8px ${hex}, 0 0 16px ${hex}88`;

        const needle = document.createElement('div');
        needle.className = 'custom-pin-needle';

        const anchor = document.createElement('div');
        anchor.className = 'custom-pin-anchor';

        wrap.append(beacon, needle, anchor);

        return L.divIcon({
            className: `gta-custom-pin-marker gta-custom-pin-marker--${colorKey}`,
            html: wrap,
            iconSize: [28, 36],
            iconAnchor: [14, 36],
            popupAnchor: [0, -36]
        });
    }

    buildPushpinPopupHtml(item: { note: string; color: string; lat: number; lng: number }): HTMLElement {
        const hex = item.color || '#ff3b30';

        const card = document.createElement('div');
        card.className = 'custom-pin-popup-inner';

        const head = document.createElement('div');
        head.className = 'custom-pin-popup-head';
        head.style.borderLeft = `3px solid ${hex}`;

        const title = document.createElement('span');
        title.className = 'custom-pin-popup-title';
        const icon = document.createElement('i');
        icon.className = 'fa-solid fa-thumbtack';
        title.append(icon, document.createTextNode(' Marcador'));

        const delBtn = document.createElement('button');
        delBtn.className = 'custom-pin-del-btn';
        delBtn.setAttribute('data-pin-id', `${item.lat}_${item.lng}`);
        delBtn.setAttribute('data-action', 'delete');
        const trashIcon = document.createElement('i');
        trashIcon.className = 'fa-solid fa-trash-can';
        delBtn.appendChild(trashIcon);

        head.append(title, delBtn);
        card.appendChild(head);

        const body = document.createElement('div');
        body.className = 'custom-pin-popup-body';
        const note = document.createElement('p');
        note.className = 'custom-pin-note';
        note.textContent = item.note || 'Sin nota';
        body.appendChild(note);
        card.appendChild(body);

        return card;
    }
}
