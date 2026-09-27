const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const now = new Date();
const day = String(now.getDate()).padStart(2, '0');
const month = String(now.getMonth() + 1).padStart(2, '0');
const year = now.getFullYear();
const hours = String(now.getHours()).padStart(2, '0');
const minutes = String(now.getMinutes()).padStart(2, '0');
const timestamp = `${day}/${month}/${year} ${hours}:${minutes}`;

let commitHash = 'pending';
try {
  commitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
} catch {}

const targetFile = path.resolve(__dirname, '../src/environments/version.ts');
const content = `export const APP_VERSION = {
  timestamp: '${timestamp}',
  commit: '${commitHash}'
};
`;

fs.writeFileSync(targetFile, content, 'utf8');
console.log(`[Git Hook] Timestamp de subida sincronizado: ${timestamp}`);
