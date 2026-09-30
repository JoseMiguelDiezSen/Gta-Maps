const fs = require('fs');
let content = fs.readFileSync('gtaapp.client/src/app/gta5/online/gta5-online.component.ts', 'utf8');

// In renderPointsOfInterest we have pinColor. Replace it with (p.badge.color || '#f97316')
// But wait! There is a let htmlContent =  block that was pasted twice maybe?
// Let's replace 'pinColor' with '(p.badge?.color || "#f97316")' everywhere inside renderPointsOfInterest.

let start = content.indexOf('private renderPointsOfInterest(): void {');
let end = content.indexOf('private renderCollectibles(): void {', start);
if (start !== -1 && end !== -1) {
    let method = content.substring(start, end);
    method = method.replace(/\$\{pinColor\}/g, '');
    content = content.substring(0, start) + method + content.substring(end);
}

// In renderCayoPericoMarkers, maybe I missed some loc replacements because they were on another line or something.
let startCayo = content.indexOf('private renderCayoPericoMarkers(): void {');
let endCayo = content.indexOf('private renderPointsOfInterest(): void {', startCayo);
if (startCayo !== -1 && endCayo !== -1) {
    let method = content.substring(startCayo, endCayo);
    method = method.replace(/p\.category/g, 'loc.category');
    method = method.replace(/p\.badge/g, 'loc.badge');
    method = method.replace(/p\.features/g, 'loc.features');
    method = method.replace(/pinColor/g, 'badgeColor');
    method = method.replace(/pinSymbol/g, 'badgeSymbol');
    content = content.substring(0, startCayo) + method + content.substring(endCayo);
}

fs.writeFileSync('gtaapp.client/src/app/gta5/online/gta5-online.component.ts', content, 'utf8');
