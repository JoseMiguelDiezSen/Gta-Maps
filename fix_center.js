const fs = require('fs');
const files = [
    'gtaapp.client/src/app/gta5/historia/gta5-historia.component.css',
    'gtaapp.client/src/app/gta5/online/gta5-online.component.css',
    'gtaapp.client/src/app/gta6/historia/gta6-historia.component.css',
    'gtaapp.client/src/app/gta6/online/gta6-online.component.css'
];
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace .hud-acc-body padding
    content = content.replace(/\.hud-acc-body\s*\{[\s\S]*?box-sizing:\s*border-box;\s*\}/, 
        .hud-acc-body {
  padding-top: 5px;
  padding-bottom: 6px;
  padding-left: 10px;
  padding-right: 10px;
  border-top: 1px solid rgba(255, 165, 0, 0.15);
  display: flex;
  flex-direction: column;
  gap: 3px;
  width: 100%;
  box-sizing: border-box;
});

    // Replace .legend-btn
    content = content.replace(/\.legend-btn\s*\{[\s\S]*?padding:\s*[^\n]*;\s*\n\s*color:/,
        .legend-btn {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  width: 100%;
  margin: 0;
  box-sizing: border-box;
  padding: 5px 8px;
  color:);
  
    fs.writeFileSync(file, content, 'utf8');
});
console.log('Fixed ALL styles to explicitly center them');
