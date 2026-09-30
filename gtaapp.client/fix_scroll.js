const fs = require('fs');
const files = [
    'src/app/gta5/historia/gta5-historia.component.css',
    'src/app/gta5/online/gta5-online.component.css',
    'src/app/gta6/historia/gta6-historia.component.css',
    'src/app/gta6/online/gta6-online.component.css'
];
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/padding-right:\s*0;\s*/g, '');
    fs.writeFileSync(file, content, 'utf8');
});
console.log('Removed padding-right: 0');
