const fs = require('fs');
const path = require('path');

const srcDir = 'gtaapp.client/src/assets/data/gta5';
const dstDir = 'GTAApp.Server/wwwroot/data/gta5';

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

copyRecursiveSync(srcDir, dstDir);
console.log('Successfully synced all data files from client assets to server wwwroot!');
