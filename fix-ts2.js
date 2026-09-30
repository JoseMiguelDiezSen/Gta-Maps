const fs = require('fs');
let content = fs.readFileSync('gtaapp.client/src/app/gta5/online/gta5-online.component.ts', 'utf8');

// Replace p. with loc. and pinColor/pinSymbol with badgeColor/badgeSymbol globally inside renderCayoPericoMarkers
let start = content.indexOf('private renderCayoPericoMarkers(): void {');
let end = content.indexOf('private updateCityUI(): void {', start);
if(end === -1) end = content.indexOf('private loadLocations', start); // maybe another method
if(end === -1) end = start + 5000;

let method = content.substring(start, end);
method = method.replace(/p\.category/g, 'loc.category');
method = method.replace(/p\.badge/g, 'loc.badge');
method = method.replace(/pinColor/g, 'badgeColor');
method = method.replace(/pinSymbol/g, 'badgeSymbol');

content = content.substring(0, start) + method + content.substring(end);

// We also saw lines 1056 and 1063 which are in a different method maybe?
// error TS2304: Cannot find name 'pinColor'.
// Let's replace 'pinColor' with 'badgeColor' in renderPointsOfInterest? wait, pinColor might be valid in renderPointsOfInterest if they defined it, or they missed defining it!
// Let's check lines 1056 and 1063.
fs.writeFileSync('gtaapp.client/src/app/gta5/online/gta5-online.component.ts', content, 'utf8');
