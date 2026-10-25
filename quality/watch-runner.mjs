#!/usr/bin/env node
/**
 * GTA Explorer - Ejecutor Automático de Comprobaciones tras cada tanda de cambios
 * Vigila cambios en gtaapp.client/src y GTAAPP.Server con debounce inteligente (2.5s)
 * para ejecutar la auditoría automáticamente cuando terminas de guardar una tanda de archivos.
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const WATCH_DIRS = [
  path.join(ROOT_DIR, 'gtaapp.client', 'src'),
  path.join(ROOT_DIR, 'GTAAPP.Server'),
];

let timer = null;
let running = false;
let pendingReRun = false;
const changedFiles = new Set();

function triggerAudit() {
  if (running) {
    pendingReRun = true;
    return;
  }
  running = true;
  const batch = [...changedFiles];
  changedFiles.clear();

  console.log(`\n[AUTO-QA] Detectada tanda de cambios (${batch.length} archivo(s)): ${batch.slice(0, 4).join(', ')}${batch.length > 4 ? '...' : ''}`);
  const child = spawn(process.execPath, [path.join(__dirname, 'audit-runner.mjs')], {
    cwd: ROOT_DIR,
    stdio: 'inherit',
  });

  child.on('close', () => {
    running = false;
    if (pendingReRun) {
      pendingReRun = false;
      triggerAudit();
    }
  });
}

console.log('=====================================================================');
console.log('  GTA EXPLORER - VIGILANCIA AUTOMÁTICA DE CALIDAD ACTIVA');
console.log('  Esperando tandas de cambios en gtaapp.client/src y GTAAPP.Server...');
console.log('=====================================================================');

for (const dir of WATCH_DIRS) {
  if (!fs.existsSync(dir)) continue;
  fs.watch(dir, { recursive: true }, (eventType, filename) => {
    if (!filename) return;
    const norm = filename.replace(/\\/g, '/');
    if (norm.includes('environments/version.ts') || norm.includes('/bin/') || norm.includes('/obj/') || norm.includes('/wwwroot/')) {
      return;
    }
    if (!/\.(ts|html|css|scss|json|cs)$/i.test(norm)) return;

    changedFiles.add(norm);
    if (timer) clearTimeout(timer);
    timer = setTimeout(triggerAudit, 2500);
  });
}
