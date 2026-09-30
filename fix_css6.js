const fs = require('fs');
const files = [
    'gtaapp.client/src/app/gta5/historia/gta5-historia.component.css',
    'gtaapp.client/src/app/gta5/online/gta5-online.component.css',
    'gtaapp.client/src/app/gta6/historia/gta6-historia.component.css',
    'gtaapp.client/src/app/gta6/online/gta6-online.component.css'
];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    content = content.replace(/padding:\s*5px 0px 6px;\n\s*border-top/g, 'padding: 5px 6px 6px;\n  border-top');
    content = content.replace(/(\.hud-acc-head\s*\{[^}]*?padding:\s*)6px 6px(;)/g, '$16px 10px');
    content = content.replace(/(\.hud-acc-toggle\s*\{[^}]*?gap:\s*)4px(;)/g, '$18px');
    content = content.replace(/(\.hud-acc-caret\s*\{[^}]*?margin-right:\s*)0(;)/g, '$12px');
    
    content = content.replace(/(\.legend-btn\s*\{[^}]*?gap:\s*)6px(;)/g, '$15px');
    content = content.replace(/(\.legend-btn\s*\{[^}]*?padding:\s*)5px 6px(;)/g, '$15px 4px');
    
    fs.writeFileSync(file, content, 'utf8');
});
console.log('Applied perfect css');
