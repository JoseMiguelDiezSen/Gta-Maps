const fs = require('fs');
let content = fs.readFileSync('gtaapp.client/src/app/gta5/online/gta5-online.component.ts', 'utf8');

// Fix 995 and 996 (in loadProperties)
content = content.replace(/if \(this\.layerFilters\[loc\.category\] === undefined\) \{\s*this\.layerFilters\[loc\.category\] = true;\s*\}/, '');

// Fix pinColor in renderPointsOfInterest
// We will simply replace "style=\"--pin-color: \"" with "style=\"--pin-color: \""
// and "color: ;" with "color: ;"

content = content.replace(/\$\{pinColor\}/g, '');

fs.writeFileSync('gtaapp.client/src/app/gta5/online/gta5-online.component.ts', content, 'utf8');
