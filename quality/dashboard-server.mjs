#!/usr/bin/env node
/**
 * GTA Explorer - Servidor de Panel Gráfico Local de Calidad (Zero-dependency, <25 MB RAM)
 * Sirve el dashboard interactivo en http://127.0.0.1:4321
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const REPORT_FILE = path.join(__dirname, 'reports', 'latest-report.json');
const HISTORY_FILE = path.join(__dirname, 'reports', 'history.json');
const BASELINE_FILE = path.join(__dirname, 'baseline.json');
const DASHBOARD_HTML = path.join(__dirname, 'dashboard', 'index.html');

const PORT = Number(process.env.QUALITY_PORT || 4321);
let isRunningAudit = false;

function runAuditAsync(extraArgs = []) {
  return new Promise((resolve, reject) => {
    if (isRunningAudit) {
      return resolve({ busy: true });
    }
    isRunningAudit = true;
    const child = spawn(process.execPath, [path.join(__dirname, 'audit-runner.mjs'), ...extraArgs], {
      cwd: ROOT_DIR,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    child.stdout.on('data', d => { output += d.toString(); });
    child.stderr.on('data', d => { output += d.toString(); });
    child.on('close', code => {
      isRunningAudit = false;
      resolve({ code, output });
    });
    child.on('error', err => {
      isRunningAudit = false;
      reject(err);
    });
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://127.0.0.1:${PORT}`);

  // CORS local
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
    if (fs.existsSync(DASHBOARD_HTML)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(fs.readFileSync(DASHBOARD_HTML, 'utf8'));
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Dashboard HTML not found.');
    }
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/report') {
    if (!fs.existsSync(REPORT_FILE)) {
      await runAuditAsync();
    }
    const report = fs.existsSync(REPORT_FILE) ? fs.readFileSync(REPORT_FILE, 'utf8') : '{}';
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(report);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/history') {
    const history = fs.existsSync(HISTORY_FILE) ? fs.readFileSync(HISTORY_FILE, 'utf8') : '[]';
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(history);
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/run') {
    const withBuild = url.searchParams.get('build') === '1';
    const updateBaseline = url.searchParams.get('baseline') === '1';
    const args = [];
    if (withBuild) args.push('--with-build');
    if (updateBaseline) args.push('--update-baseline');

    const result = await runAuditAsync(args);
    const report = fs.existsSync(REPORT_FILE) ? JSON.parse(fs.readFileSync(REPORT_FILE, 'utf8')) : {};
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: true, result, report }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n===================================================================`);
  console.log(`  GTA EXPLORER - PANEL GRÁFICO LOCAL DE CALIDAD ACTIVO`);
  console.log(`  URL: http://localhost:${PORT}`);
  console.log(`===================================================================\n`);
});
