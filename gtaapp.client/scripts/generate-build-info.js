const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getGitCommitHash() {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'dev';
  }
}

function getFormattedDate() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

const targetDir = path.resolve(__dirname, '../src/environments');
const targetFile = path.join(targetDir, 'build-info.ts');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const commitHash = getGitCommitHash();
const timestamp = getFormattedDate();
const rawDate = new Date().toISOString();

const content = `// Archivo generado automáticamente en cada compilación/subida de código.
// No editar manualmente.
export const buildInfo = {
  timestamp: '${timestamp}',
  commitHash: '${commitHash}',
  rawDate: '${rawDate}'
};
`;

fs.writeFileSync(targetFile, content, 'utf8');
console.log(`[build-info] Generado ${targetFile}: ${timestamp} (${commitHash})`);
