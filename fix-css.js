const fs = require('fs');
const filePath = 'gtaapp.client/src/app/components/info-panel/info-panel.component.css';
let content = fs.readFileSync(filePath, 'utf8');

// Quitar height: 100%; de .mdetail-box
content = content.replace(/\.mdetail-box\s*\{[^}]*\}/g, (match) => {
    return match.replace(/\s*height:\s*100%;/g, '');
});

// Añadir grid-column: 1 / -1; a .reward-box
content = content.replace(/\.reward-box\s*\{/g, '.reward-box {\n  grid-column: 1 / -1;');

fs.writeFileSync(filePath, content, 'utf8');
