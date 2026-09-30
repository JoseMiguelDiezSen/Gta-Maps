
const fs = require('fs');
const files = [
    'gtaapp.client/src/app/gta5/historia/gta5-historia.component.css',
    'gtaapp.client/src/app/gta5/online/gta5-online.component.css',
    'gtaapp.client/src/app/gta6/historia/gta6-historia.component.css',
    'gtaapp.client/src/app/gta6/online/gta6-online.component.css'
];
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Change padding to explicitly balance the scrollbar
    content = content.replace('padding: 8px 16px;', 'padding: 8px 16px 8px 10px;');
  
    fs.writeFileSync(file, content, 'utf8');
});
console.log('Fixed ALL styles to perfectly balance the scrollbar');

