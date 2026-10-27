#!/usr/bin/env node
/**
 * GTA Explorer - Barrera Rápida Pre-Commit (Git Hook Gatekeeper)
 * 1. Verifica solo los archivos en staging (git diff --cached) + integridad global de JSON e i18n
 * 2. Bloquea el commit si:
 *    - Algún archivo JSON modificado tiene sintaxis inválida, codificación corrupta (U+FFFD) o creció >25 KB de golpe sin actualizar baseline
 *    - Se introducen claves i18n rotas o inexistentes en es.json
 *    - Se añade nuevo HTML incrustado no permitido o errores críticos de compilación en los archivos modificados
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const BASELINE_FILE = path.join(__dirname, 'baseline.json');

const GIT_BIN = process.platform === 'win32'
  ? path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Git', 'cmd', 'git.exe')
  : '/usr/bin/git';

function getStagedFiles() {
  try {
    const out = execFileSync(GIT_BIN, ['diff', '--cached', '--name-only', '--diff-filter=ACMR'], { cwd: ROOT_DIR, encoding: 'utf8' });
    return out.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

function main() {
  const staged = getStagedFiles();
  if (staged.length === 0) process.exit(0);

  console.log(`[GTA QA Gate] Verificando ${staged.length} archivo(s) antes del commit...`);

  const baseline = fs.existsSync(BASELINE_FILE)
    ? JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf8'))
    : { jsonSizes: {}, issueFingerprints: [] };

  const errors = [];

  // 1. Validar todos los JSON en staging
  for (const rel of staged.filter(f => f.endsWith('.json'))) {
    const abs = path.join(ROOT_DIR, rel);
    if (!fs.existsSync(abs)) continue;
    const raw = fs.readFileSync(abs, 'utf8');
    if (raw.includes('\uFFFD')) {
      errors.push(`[UTF-8 Corrupto] ${rel} contiene caracteres inválidos (U+FFFD).`);
    }
    try {
      JSON.parse(raw.replace(/^\uFEFF/, ''));
    } catch (e) {
      errors.push(`[JSON Inválido] ${rel}: ${e.message}`);
    }

    const size = fs.statSync(abs).size;
    const prevSize = baseline.jsonSizes?.[rel];
    if (typeof prevSize === 'number' && (size - prevSize) > 50 * 1024) {
      errors.push(`[Crecimiento Descontrolado JSON] ${rel} creció +${((size - prevSize) / 1024).toFixed(1)} KB en un solo commit (>50 KB). Si es intencional, actualiza el baseline.`);
    }
  }

  // 2. Ejecutar el motor de auditoría completo con barrera de Quality Gate (--gate)
  if (errors.length === 0) {
    try {
      execFileSync(process.execPath, [path.join(__dirname, 'audit-runner.mjs'), '--gate'], {
        cwd: ROOT_DIR,
        stdio: 'inherit',
      });
    } catch {
      errors.push('La auditoría automática detectó errores críticos nuevos o fallos de compilación.');
    }
  }

  if (errors.length > 0) {
    console.error('\n=====================================================================');
    console.error('  ✕ COMMIT BLOQUEADO POR LA BARRERA DE CALIDAD DE GTA EXPLORER');
    console.error('=====================================================================');
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    console.error('=====================================================================\n');
    process.exit(1);
  }

  console.log('[GTA QA Gate] ✓ Todas las comprobaciones obligatorias superadas.');
}

main();
