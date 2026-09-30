const fs = require('fs');
let content = fs.readFileSync('gtaapp.client/src/app/gta5/online/gta5-online.component.ts', 'utf8');

// The problematic block in renderCayoPericoMarkers starts after 'badgeSymbol ='
let parts = content.split('private renderCayoPericoMarkers(): void {');
let before = parts[0];
let after = parts[1];

let endIdx = after.indexOf('private updateCityUI(): void {');
let method = after.substring(0, endIdx);
let rest = after.substring(endIdx);

// Replace p. with loc. in method
method = method.replace(/p\.category/g, 'loc.category');
method = method.replace(/p\.badge/g, 'loc.badge');
method = method.replace(/pinColor/g, 'badgeColor');
method = method.replace(/pinSymbol/g, 'badgeSymbol');

fs.writeFileSync('gtaapp.client/src/app/gta5/online/gta5-online.component.ts', before + 'private renderCayoPericoMarkers(): void {' + method + rest, 'utf8');
