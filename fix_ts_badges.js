const fs = require('fs');
const files = [
    'gtaapp.client/src/app/gta5/historia/gta5-historia.component.ts',
    'gtaapp.client/src/app/gta5/online/gta5-online.component.ts'
];
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace p.badge.symbol -> (p.badge?.symbol || (p as any).icon)
    content = content.replace(/p\.badge\.symbol/g, "(p.badge?.symbol || (p as any).icon)");
    
    // Replace p.badge.color -> (p.badge?.color || (p as any).color)
    content = content.replace(/p\.badge\.color/g, "(p.badge?.color || (p as any).color)");
    
    // In case item.badge.color or item.badge.symbol are broken
    content = content.replace(/item\.badge\.color/g, "(item.badge?.color || (item as any).color)");
    content = content.replace(/item\.badge\.symbol/g, "(item.badge?.symbol || (item as any).icon)");
    
    fs.writeFileSync(file, content, 'utf8');
});
console.log('Fixed TS badges');
