import * as L from 'leaflet';
import { LocationItem } from '../models/location';
import { CollectibleItem } from '../models/collectible';

/**
 * Fábrica de Iconos, Popups y Tooltips de Leaflet para el mapa de GTA V.
 * Desacopla toda la generación de maquetación HTML y estilos del componente principal.
 */
export class MapMarkerFactory {

    /**
     * Crea el DivIcon gráfico para una propiedad, servicio o punto de interés.
     */
    static createPropertyIcon(p: LocationItem): L.DivIcon {
        let pinSymbol = p.badge.symbol || '•';
        if (p.category === 'police_station' && (!pinSymbol || pinSymbol === 'POL')) pinSymbol = '🚓';
        if (p.category === 'hospital' && (!pinSymbol || pinSymbol === 'MED' || pinSymbol === '✚')) pinSymbol = '🏥';
        if (p.category === 'fire_station' && (!pinSymbol || pinSymbol === 'BOM')) pinSymbol = '🚒';
        if (p.category === 'car_wash') pinSymbol = '🚿';
        if (p.category === 'arena_war') pinSymbol = '🏟️';

        const pinInnerHtml = `<span class="gta-pin-symbol" style="color: ${p.category === 'character' ? '#f5cd2f' : 'var(--pin-color, #ffb833)'}; font-weight: 800;">${pinSymbol}</span>`;

        return L.divIcon({
            className: 'gta-pin-wrapper',
            html: `
                <div class="gta-pin gta-pin-${p.category}" style="--pin-color: ${p.badge.color}">
                    ${pinInnerHtml}
                </div>
            `,
            iconSize: [30, 30],
            iconAnchor: [15, 30],
            popupAnchor: [0, -28]
        });
    }

    /**
     * Genera la estructura HTML de la tarjeta popup de una propiedad.
     */
    static createPropertyPopupHtml(p: LocationItem, isPurchasable: boolean): string {
        const featuresHtml = p.features && p.features.length > 0
            ? `<ul class="popup-features">${p.features.map(f => `<li>${f}</li>`).join('')}</ul>`
            : '';

        const incomeHtml = p.income
            ? `<div class="popup-row"><span class="popup-tag-lbl">Ingresos:</span> <span class="popup-tag-val val-income">${p.income}</span></div>`
            : '';

        const ownerHtml = p.owner
            ? `<div class="popup-row"><span class="popup-tag-lbl">Comprador:</span> <span class="popup-tag-val">${p.owner}</span></div>`
            : '';

        const imageHtml = p.imageUrl
            ? `<div class="popup-image-box"><img src="${p.imageUrl}" alt="${p.name}" class="popup-img" loading="lazy" onerror="this.parentElement.style.display='none'" /></div>`
            : '';

        const priceSectionHtml = isPurchasable
            ? `
                <div class="popup-price-box">
                    <span class="price-title">PRECIO</span>
                    <span class="price-num">${p.priceFormatted}</span>
                </div>
              `
            : `
                <div class="popup-service-tag-box">
                    <span class="service-type-badge">${p.categoryLabel}</span>
                    <span class="service-status-text">${p.priceFormatted || 'Punto de Interés'}</span>
                </div>
              `;

        return `
            <div class="gta-popup-card">
                ${imageHtml}
                <div class="popup-banner" style="background: linear-gradient(135deg, ${p.badge.color}33, #0b0f14 85%); border-bottom: 2px solid ${p.badge.color};">
                    <span class="popup-badge" style="color: ${p.badge.color}; border-color: ${p.badge.color}66">${p.categoryLabel}</span>
                    <h4 class="popup-title">${p.name}</h4>
                    <div class="popup-zone">${p.zone}</div>
                </div>
                <div class="popup-content">
                    ${priceSectionHtml}
                    ${incomeHtml}
                    ${ownerHtml}
                    <p class="popup-desc">${p.description}</p>
                    ${featuresHtml}
                </div>
            </div>
        `;
    }

    /**
     * Genera el HTML del tooltip rápido para una propiedad.
     */
    static createPropertyTooltipHtml(p: LocationItem, isPurchasable: boolean): string {
        const tooltipPrice = isPurchasable
            ? `<br><span style="color:#2ecc71">${p.priceFormatted}</span>`
            : `<br><span style="color:#3498db">${p.categoryLabel}</span>`;
        return `<b>${p.name}</b>${tooltipPrice}`;
    }

    /**
     * Crea el DivIcon gráfico para un coleccionable.
     */
    static createCollectibleIcon(item: CollectibleItem): L.DivIcon {
        return L.divIcon({
            className: 'gta-pin-collectible-wrapper',
            html: `
                <div class="gta-pin-collectible gta-pin-col-${item.category}" style="--pin-color: ${item.badge.color}">
                    <span class="gta-pin-col-symbol">${item.badge.symbol || '•'}</span>
                </div>
            `,
            iconSize: [22, 22],
            iconAnchor: [11, 11],
            popupAnchor: [0, -13]
        });
    }

    /**
     * Genera el contenido HTML del popup para un coleccionable.
     */
    static createCollectiblePopupHtml(item: CollectibleItem): string {
        return `
            <div class="gta-popup-card">
                <div class="popup-banner" style="background: linear-gradient(135deg, ${item.badge.color}33, #0b0f14 85%); border-bottom: 2px solid ${item.badge.color};">
                    <span class="popup-badge" style="color: ${item.badge.color}; border-color: ${item.badge.color}66">${item.categoryLabel} (#${item.number}/${item.total})</span>
                    <h4 class="popup-title">${item.name}</h4>
                    <div class="popup-zone">${item.zone}</div>
                </div>
                <div class="popup-content">
                    <div class="popup-row">
                        <span class="popup-tag-lbl">Pista / Ubicación:</span>
                        <span class="popup-tag-val">${item.hint}</span>
                    </div>
                    <div class="popup-row">
                        <span class="popup-tag-lbl">Recompensa:</span>
                        <span class="popup-tag-val val-income">${item.reward}</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Genera el HTML del tooltip para un coleccionable.
     */
    static createCollectibleTooltipHtml(item: CollectibleItem): string {
        return `<b>${item.name}</b><br><span style="color:${item.badge.color}">${item.categoryLabel} (#${item.number}/${item.total})</span>`;
    }

    /**
     * Crea el icono de chincheta roja clásica para marcadores personalizados del usuario.
     */
    static createPushpinIcon(): L.DivIcon {
        return L.divIcon({
            className: 'gta-classic-pushpin-icon',
            html: `
                <div class="classic-pushpin-wrapper">
                    <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <radialGradient id="gtaRedHead" cx="35%" cy="30%" r="65%">
                                <stop offset="0%" stop-color="#ff7575"/>
                                <stop offset="35%" stop-color="#e61919"/>
                                <stop offset="85%" stop-color="#a80707"/>
                                <stop offset="100%" stop-color="#5a0000"/>
                            </radialGradient>
                            <linearGradient id="gtaSteelNeedle" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stop-color="#d6dadf"/>
                                <stop offset="45%" stop-color="#ffffff"/>
                                <stop offset="75%" stop-color="#8c939a"/>
                                <stop offset="100%" stop-color="#4d5156"/>
                            </linearGradient>
                            <filter id="gtaPinShadow" x="0" y="0" width="32" height="40" filterUnits="userSpaceOnUse">
                                <feDropShadow dx="1" dy="3" stdDeviation="1.8" flood-color="#000000" flood-opacity="0.65"/>
                            </filter>
                        </defs>
                        <g filter="url(#gtaPinShadow)">
                            <polygon points="14.8,20 17.2,20 16.3,38 15.7,38" fill="url(#gtaSteelNeedle)"/>
                            <line x1="16" y1="20" x2="16" y2="38" stroke="#ffffff" stroke-width="0.6" opacity="0.9"/>
                            <path d="M10.5,20 C10.5,15.5 12.5,13.5 16,13.5 C19.5,13.5 21.5,15.5 21.5,20 Z" fill="url(#gtaRedHead)"/>
                            <ellipse cx="16" cy="13.5" rx="7.2" ry="2.2" fill="#8f0505"/>
                            <ellipse cx="16" cy="12.8" rx="6.9" ry="1.9" fill="#ff4444"/>
                            <ellipse cx="16" cy="7.5" rx="7.8" ry="6.8" fill="url(#gtaRedHead)"/>
                            <ellipse cx="13.5" cy="5.2" rx="3.2" ry="1.9" fill="#ffffff" opacity="0.8" transform="rotate(-18 13.5 5.2)"/>
                        </g>
                    </svg>
                </div>
            `,
            iconSize: [32, 40],
            iconAnchor: [16, 38],
            popupAnchor: [0, -36]
        });
    }

    /**
     * Genera el HTML del popup de un marcador personalizado del jugador con botones de renombrar y borrar.
     */
    static createCustomMarkerPopupHtml(id: string, name: string): string {
        return `
            <div class="custom-marker-popup-card">
                <div class="custom-marker-title-row">
                    <h4 class="custom-marker-name">${name}</h4>
                </div>
                <div class="custom-marker-actions">
                    <button type="button" class="btn-marker-action btn-marker-edit" onclick="window._gtaRenameMarker('${id}')">
                        <span>✏️</span> Editar
                    </button>
                    <button type="button" class="btn-marker-action btn-marker-delete" onclick="window._gtaDeleteMarker('${id}')">
                        <span>🗑️</span> Borrar
                    </button>
                </div>
            </div>
        `;
    }
}
