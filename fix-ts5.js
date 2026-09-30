const fs = require('fs');
let content = fs.readFileSync('gtaapp.client/src/app/gta5/online/gta5-online.component.ts', 'utf8');

content = content.replace(                    if (this.layerFilters[loc.category] === undefined) {
                        this.layerFilters[loc.category] = true;
                    }, '');

fs.writeFileSync('gtaapp.client/src/app/gta5/online/gta5-online.component.ts', content, 'utf8');
