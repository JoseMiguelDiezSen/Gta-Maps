const fs = require('fs');
const files = [
    'gtaapp.client/src/app/gta5/historia/gta5-historia.component.css',
    'gtaapp.client/src/app/gta5/online/gta5-online.component.css',
    'gtaapp.client/src/app/gta6/historia/gta6-historia.component.css',
    'gtaapp.client/src/app/gta6/online/gta6-online.component.css'
];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // .hud-acc-body padding: make horizontal padding 0
    content = content.replace(/(\.hud-acc-body\s*\{[^}]*?padding:\s*)5px 4px 6px(;)/g, '$15px 0px 6px');
    content = content.replace(/(\.hud-acc-body\s*\{[^}]*?padding:\s*)5px 8px 6px(;)/g, '$15px 0px 6px'); // in case it wasn't replaced
    
    fs.writeFileSync(file, content, 'utf8');
});
console.log('Fixed CSS padding');
