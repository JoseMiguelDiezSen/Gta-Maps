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

    buildLocationPopupHtml(p: LocationItem, options: LocationPopupOptions): string {
        const pinColor = p.badge?.color || (p as any).color || '#ffb833';
        const isPurchasable = (p.price != null && p.price > 0) || !!p.priceFormatted;
        const isShipwreck = p.category === 'shipwreck';
        const isAnimal = p.category === 'animal' || (p.id && p.id.startsWith('animal-')) || p.categoryLabel === 'Fauna Salvaje';
        const isPublicService = p.category === 'hospital' || p.category === 'police_station' || p.category === 'fire_station';

        let priceSectionHtml = '';
        if (isAnimal) {
            priceSectionHtml = '';
        } else if (isShipwreck) {
            priceSectionHtml = `<div class="popup-service-tag-box popup-shipwreck-box"><span class="service-type-badge">${p.categoryLabel}</span></div>`;
        } else if (isPurchasable) {
            priceSectionHtml = `<div class="popup-price-box"><span class="price-title">${options.priceLabel}</span> <span class="price-num">${p.priceFormatted}</span></div>`;
        } else {
            priceSectionHtml = `<div class="popup-service-tag-box"><span class="service-type-badge">${p.categoryLabel}</span><span class="service-status-text">${p.priceFormatted || options.pointOfInterestLabel}</span></div>`;
        }

        const incomeHtml = (p.income && !isPublicService && !isAnimal && options.incomeLabel)
            ? `<div class="popup-row"><span class="popup-tag-lbl">${options.incomeLabel}</span> <span class="popup-tag-val val-income">${p.income}</span></div>`
            : '';

        const ownerHtml = (p.owner && !isPublicService && options.buyerLabel)
            ? `<div class="popup-row"><span class="popup-tag-lbl">${options.buyerLabel}</span> <span class="popup-tag-val">${p.owner}</span></div>`
            : '';

        let rawImg = p.imageUrl || (p as any).thumbnail || (p as any).image;
        const finalImg = rawImg ? (rawImg.startsWith('/') ? rawImg : '/' + rawImg) : '';
        const imageHtml = finalImg
            ? `<div class="popup-image-box"><img src="${finalImg}" alt="${p.name}" class="popup-img" loading="lazy" onerror="this.parentElement.style.display='none'" /></div>`
            : '';

        return `
            <div class="gta-popup-card">
                ${imageHtml}
                <div class="popup-banner" style="background: linear-gradient(135deg, ${pinColor}33, #0b0f14 85%); border-bottom: 2px solid ${pinColor};">
                    <span class="popup-badge" style="color: ${pinColor}; border-color: ${pinColor}66">${p.categoryLabel}</span>
                    <h4 class="popup-title">${p.name}</h4>
                    <div class="popup-zone">${p.zone}</div>
                </div>
                <div class="popup-content">
                    ${priceSectionHtml}
                    ${incomeHtml}
                    ${ownerHtml}
                    <p class="popup-desc">${p.description}</p>
                </div>
            </div>
        `;
    }

    buildCayoPericoPopupHtml(loc: LocationItem, coordinatesLabel: string): string {
        const badgeColor = loc.badge?.color || '#00d2be';
        const rawCayoImg = loc.imageUrl || (loc as any).thumbnail || (loc as any).image;
        const finalCayoImg = rawCayoImg ? (rawCayoImg.startsWith('/') ? rawCayoImg : '/' + rawCayoImg) : '';
        const imageHtml = finalCayoImg
            ? `<div class="popup-image-box"><img src="${finalCayoImg}" alt="${loc.name}" class="popup-img" loading="lazy" onerror="this.parentElement.style.display='none'" /></div>`
            : '';

        return `
            <div class="gta-popup-card">
                ${imageHtml}
                <div class="popup-banner" style="background: linear-gradient(135deg, ${badgeColor}33, #0b0f14 85%); border-bottom: 2px solid ${badgeColor};">
                    <span class="popup-badge" style="color: ${badgeColor}; border-color: ${badgeColor}66">${loc.categoryLabel}</span>
                    <h4 class="popup-title">${loc.name}</h4>
                    <div class="popup-zone">🌴 ${loc.zone}</div>
                </div>
                <div class="popup-content">
                    <p class="popup-desc">${loc.description}</p>
                    <div class="popup-row" style="margin-top: 8px; opacity: 0.7; font-size: 11px;">
                        <span>${coordinatesLabel}:</span> <span>X: ${loc.position.x.toFixed(1)}, Y: ${loc.position.y.toFixed(1)}</span>
                    </div>
                </div>
            </div>
        `;
    }

    buildCollectiblePopupHtml(item: CollectibleItem, rewardLabel: string): string {
        const itemColor = item.badge?.color || (item as any).color || '#38bdf8';
        const rewardHtml = item.reward
            ? `<div class="popup-reward-badge" style="display: flex; align-items: center; gap: 6px; font-size: 11px; background: rgba(56, 189, 248, 0.12); border: 1px solid rgba(56, 189, 248, 0.35); border-radius: 6px; padding: 6px 10px; color: #bae6fd; margin-top: 8px;">
                <span style="font-size: 13px;">🎁</span>
                <span><strong>${rewardLabel}:</strong> ${item.reward}</span>
               </div>`
            : '';

        return `
            <div class="gta-popup-card">
                <div class="popup-banner" style="background: linear-gradient(135deg, ${itemColor}33, #0b0f14 85%); border-bottom: 2px solid ${itemColor};">
                    <span class="popup-badge" style="color: ${itemColor}; border-color: ${itemColor}66">${item.categoryLabel} (#${item.number}/${item.total})</span>
                    <h4 class="popup-title">${item.name}</h4>
                    <div class="popup-zone">${item.zone}</div>
                </div>
                <div class="popup-content">
                    <p class="popup-desc" style="margin: 0; font-size: 12px; line-height: 1.45; color: rgba(255,255,255,0.9);">${item.hint}</p>
                    ${rewardHtml}
                </div>
            </div>
        `;
    }

    buildOnlineCollectiblePopupHtml(item: CollectibleItem, hintLabel: string, rewardLabel: string): string {
        const itemColor = item.badge?.color || (item as any).color || '#38bdf8';
        return `
            <div class="gta-popup-card">
                <div class="popup-banner" style="background: linear-gradient(135deg, ${itemColor}33, #0b0f14 85%); border-bottom: 2px solid ${itemColor};">
                    <span class="popup-badge" style="color: ${itemColor}; border-color: ${itemColor}66">${item.categoryLabel} (#${item.number}/${item.total})</span>
                    <h4 class="popup-title">${item.name}</h4>
                    <div class="popup-zone">${item.zone}</div>
                </div>
                <div class="popup-content">
                    <div class="popup-row">
                        <span class="popup-tag-lbl">${hintLabel}</span>
                        <span class="popup-tag-val">${item.hint}</span>
                    </div>
                    <div class="popup-row">
                        <span class="popup-tag-lbl">${rewardLabel}</span>
                        <span class="popup-tag-val val-income">${item.reward}</span>
                    </div>
                </div>
            </div>
        `;
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

        return L.divIcon({
            className: `gta-custom-pin-marker gta-custom-pin-marker--${colorKey}`,
            html: `
                <div class="custom-pin-stem-wrap">
                    <div class="custom-pin-beacon" style="background:${hex}; box-shadow: 0 0 8px ${hex}, 0 0 16px ${hex}88;"></div>
                    <div class="custom-pin-needle"></div>
                    <div class="custom-pin-anchor"></div>
                </div>
            `,
            iconSize: [28, 36],
            iconAnchor: [14, 36],
            popupAnchor: [0, -36]
        });
    }

    buildPushpinPopupHtml(item: { note: string; color: string; lat: number; lng: number }): string {
        const hex = item.color || '#ff3b30';
        return `
            <div class="custom-pin-popup-inner">
                <div class="custom-pin-popup-head" style="border-left: 3px solid ${hex};">
                    <span class="custom-pin-popup-title"><i class="fa-solid fa-thumbtack"></i> Marcador</span>
                    <button class="custom-pin-del-btn" data-pin-id="${item.lat}_${item.lng}" title="Eliminar"><i class="fa-solid fa-trash-can"></i></button>
                </div>
                <div class="custom-pin-popup-body">
                    <p class="custom-pin-note">${item.note || 'Sin nota'}</p>
                </div>
            </div>
        `;
    }
}
