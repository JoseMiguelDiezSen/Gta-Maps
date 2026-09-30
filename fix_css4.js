const fs = require('fs');
const files = [
    'gtaapp.client/src/app/gta5/historia/gta5-historia.component.css',
    'gtaapp.client/src/app/gta5/online/gta5-online.component.css',
    'gtaapp.client/src/app/gta6/historia/gta6-historia.component.css',
    'gtaapp.client/src/app/gta6/online/gta6-online.component.css'
];
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/padding:\s*5px 0px 6px\s*border-top/g, 'padding: 5px 0px 6px;\n  border-top');
    fs.writeFileSync(file, content, 'utf8');
});
