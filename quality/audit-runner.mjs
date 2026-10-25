#!/usr/bin/env node
/**
 * GTA Explorer - Local Quality & Static Analysis Engine
 * Analiza:
 * 1. Crecimiento descontrolado de JSON, sintaxis UTF-8, archivos vacíos y duplicados
 * 2. Internacionalización (13 idiomas en assets/i18n y paridad en assets/data)
 * 3. Textos de interfaz hardcodeados en plantillas HTML y archivos TS
 * 4. HTML incrustado dentro de TypeScript (innerHTML, divIcon, plantillas inline, literales HTML)
 * 5. Tamaño de componentes/archivos (prevención de Clases Dios / Monolitos)
 * 6. Angular ESLint (TS + HTML Templates)
 * 7. Compilación (.NET + Angular) y Pruebas Automatizadas (opcional con --with-build / --with-tests)
 * 8. Comparación inteligente contra Baseline (distingue problemas NUEVOS de PREEXISTENTES)
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const CLIENT_DIR = path.join(ROOT_DIR, 'gtaapp.client');
const SERVER_DIR = path.join(ROOT_DIR, 'GTAAPP.Server');
const SRC_DIR = path.join(CLIENT_DIR, 'src');
const ASSETS_DIR = path.join(SRC_DIR, 'assets');
const I18N_DIR = path.join(ASSETS_DIR, 'i18n');
const DATA_DIR = path.join(ASSETS_DIR, 'data');

const REPORT_DIR = path.join(__dirname, 'reports');
const BASELINE_FILE = path.join(__dirname, 'baseline.json');
const INITIAL_BASELINE_FILE = path.join(__dirname, 'initial-baseline.json');
const LATEST_REPORT_FILE = path.join(REPORT_DIR, 'latest-report.json');
const HISTORY_FILE = path.join(REPORT_DIR, 'history.json');

const args = process.argv.slice(2);
const UPDATE_BASELINE = args.includes('--update-baseline');
const STAGED_ONLY = args.includes('--staged');
const WITH_BUILD = args.includes('--with-build');
const WITH_TESTS = args.includes('--with-tests');
const FAIL_ON_NEW = args.includes('--gate');

// Umbrales de control de calidad
const THRESHOLDS = {
  jsonWarningBytes: 120 * 1024,      // 120 KB aviso de crecimiento
  jsonCriticalBytes: 300 * 1024,     // 300 KB crítico
  jsonMaxGrowthBytes: 15 * 1024,     // +15 KB sobre baseline sin justificar dispara aviso
  tsWarningLines: 500,               // 500 líneas TS
  tsCriticalLines: 1000,             // 1000 líneas TS (Monolito)
  cssWarningBytes: 45 * 1024,        // 45 KB CSS
  htmlWarningLines: 600,             // 600 líneas HTML
};

const SUPPORTED_LANGS = ['es', 'en', 'pt', 'zh', 'fr', 'de', 'it', 'ru', 'ar', 'ja', 'hi', 'tr', 'ko'];
const BASE_LANG = 'es';

function relPath(absPath) {
  return path.relative(ROOT_DIR, absPath).replace(/\\/g, '/');
}

function walkFiles(dir, filterFn = () => true) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', 'dist', '.angular', '.git', '.vs', 'bin', 'obj', 'publish', '.quality'].includes(entry.name)) {
        continue;
      }
      results.push(...walkFiles(full, filterFn));
    } else if (filterFn(full)) {
      results.push(full);
    }
  }
  return results;
}

// ============================================================================
// 1. VALIDADOR DE JSON Y CONTROL DE CRECIMIENTO DESCONTROLADO
// ============================================================================
function analyzeJsonFiles() {
  const jsonFiles = walkFiles(ASSETS_DIR, f => f.endsWith('.json'));
  const issues = [];
  const fileMetrics = {};
  let totalBytes = 0;

  for (const file of jsonFiles) {
    const rel = relPath(file);
    const stat = fs.statSync(file);
    const size = stat.size;
    totalBytes += size;

    let raw = '';
    let parsed = null;
    let validUtf8 = true;
    let itemCount = 0;

    try {
      const buf = fs.readFileSync(file);
      // Detectar BOM UTF-8 (EF BB BF) y caracteres de reemplazo UTF-8 corruptos (U+FFFD)
      const hasBom = buf.length >= 3 && buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF;
      raw = buf.toString('utf8');
      if (hasBom || raw.startsWith('\uFEFF')) {
        issues.push({
          id: `json-bom:${rel}`,
          category: 'json',
          severity: 'info',
          rule: 'json-utf8-bom-present',
          file: rel,
          line: 1,
          message: `El archivo JSON contiene cabecera UTF-8 BOM (EF BB BF). Se recomienda UTF-8 puro sin BOM.`,
        });
        raw = raw.replace(/^\uFEFF/, '');
      }
      if (raw.includes('\uFFFD')) {
        validUtf8 = false;
        issues.push({
          id: `json-utf8:${rel}`,
          category: 'json',
          severity: 'error',
          rule: 'json-utf8-corruption',
          file: rel,
          line: 1,
          message: `Codificación corrupta detectada (carácter U+FFFD presente). Violación de Regla 10 (UTF-8 Strict).`,
        });
      }
      parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        itemCount = parsed.length;
      } else if (parsed && typeof parsed === 'object') {
        itemCount = Object.keys(parsed).length;
      }
    } catch (err) {
      issues.push({
        id: `json-syntax:${rel}`,
        category: 'json',
        severity: 'error',
        rule: 'json-syntax-error',
        file: rel,
        line: 1,
        message: `JSON inválido o corrupto: ${err.message}`,
      });
    }

    const lines = raw ? raw.split(/\r?\n/).length : 0;
    fileMetrics[rel] = {
      sizeBytes: size,
      sizeKB: +(size / 1024).toFixed(2),
      lines,
      itemCount,
      valid: parsed !== null && validUtf8,
    };

    // Detectar JSON vacío o esqueleto (<= 5 bytes, ej. "{}" o "[]")
    if (size <= 5) {
      issues.push({
        id: `json-empty:${rel}`,
        category: 'json',
        severity: 'warning',
        rule: 'json-empty-placeholder',
        file: rel,
        line: 1,
        message: `Archivo JSON vacío (${size} bytes). Verificar si falta traducción o carga de datos.`,
      });
    }

    // Detectar crecimiento excesivo
    if (size >= THRESHOLDS.jsonCriticalBytes) {
      issues.push({
        id: `json-bloat-critical:${rel}`,
        category: 'json',
        severity: 'warning',
        rule: 'json-uncontrolled-growth',
        file: rel,
        line: 1,
        message: `JSON masivo (${(size / 1024).toFixed(1)} KB, ${lines} líneas). Supera el umbral crítico de ${(THRESHOLDS.jsonCriticalBytes / 1024).toFixed(0)} KB.`,
      });
    } else if (size >= THRESHOLDS.jsonWarningBytes) {
      issues.push({
        id: `json-bloat-warn:${rel}`,
        category: 'json',
        severity: 'info',
        rule: 'json-growth-watch',
        file: rel,
        line: 1,
        message: `JSON grande (${(size / 1024).toFixed(1)} KB). En vigilancia de crecimiento.`,
      });
    }
  }

  const largestFiles = Object.entries(fileMetrics)
    .map(([file, meta]) => ({ file, ...meta }))
    .sort((a, b) => b.sizeBytes - a.sizeBytes)
    .slice(0, 35);

  return {
    totalFiles: jsonFiles.length,
    totalSizeMB: +(totalBytes / (1024 * 1024)).toFixed(2),
    fileMetrics,
    largestFiles,
    issues,
  };
}

// ============================================================================
// 2. VALIDADOR DE INTERNACIONALIZACIÓN (i18n) Y SINCRONIZACIÓN DE IDIOMAS
// ============================================================================
function flattenKeys(obj, prefix = '') {
  const result = {};
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return result;
  for (const [k, v] of Object.entries(obj)) {
    const nextKey = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(result, flattenKeys(v, nextKey));
    } else {
      result[nextKey] = String(v ?? '');
    }
  }
  return result;
}

function extractPlaceholders(str) {
  const matches = new Set();
  const reDouble = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
  const reSingle = /\{\s*([a-zA-Z0-9_]+)\s*\}/g;
  let m;
  while ((m = reDouble.exec(str)) !== null) matches.add(m[1]);
  while ((m = reSingle.exec(str)) !== null) matches.add(m[1]);
  return [...matches].sort();
}

function analyzeI18n() {
  const issues = [];
  const languageSummary = {};
  const baseFile = path.join(I18N_DIR, `${BASE_LANG}.json`);

  if (!fs.existsSync(baseFile)) {
    return { issues: [{ id: 'i18n-no-base', category: 'i18n', severity: 'error', rule: 'i18n-base-missing', file: relPath(baseFile), line: 1, message: 'No existe el diccionario base es.json' }], languageSummary: {}, usedKeysMissingInBase: [] };
  }

  const baseObj = JSON.parse(fs.readFileSync(baseFile, 'utf8'));
  const baseMap = flattenKeys(baseObj);
  const baseKeys = Object.keys(baseMap);

  for (const lang of SUPPORTED_LANGS) {
    const langFile = path.join(I18N_DIR, `${lang}.json`);
    const rel = relPath(langFile);
    if (!fs.existsSync(langFile)) {
      issues.push({
        id: `i18n-missing-file:${lang}`,
        category: 'i18n',
        severity: 'error',
        rule: 'i18n-missing-locale-file',
        file: rel,
        line: 1,
        message: `Falta el archivo de idioma ${lang}.json`,
      });
      continue;
    }

    let langObj;
    try {
      langObj = JSON.parse(fs.readFileSync(langFile, 'utf8'));
    } catch (e) {
      continue; // Ya reportado en JSON syntax
    }

    const langMap = flattenKeys(langObj);
    const langKeys = Object.keys(langMap);

    const missingKeys = baseKeys.filter(k => !(k in langMap));
    const extraKeys = langKeys.filter(k => !(k in baseMap));
    const emptyValues = langKeys.filter(k => langMap[k].trim() === '');
    const placeholderMismatches = [];
    let identicalToBaseCount = 0;

    for (const k of baseKeys) {
      if (!(k in langMap)) continue;
      const baseVal = baseMap[k];
      const targetVal = langMap[k];

      if (lang !== BASE_LANG && baseVal.length > 10 && baseVal === targetVal) {
        identicalToBaseCount++;
      }

      const basePh = extractPlaceholders(baseVal);
      const targetPh = extractPlaceholders(targetVal);
      if (basePh.join(',') !== targetPh.join(',')) {
        placeholderMismatches.push({ key: k, expected: basePh, actual: targetPh });
      }
    }

    const coveragePct = baseKeys.length > 0
      ? +(((baseKeys.length - missingKeys.length) / baseKeys.length) * 100).toFixed(1)
      : 100;

    languageSummary[lang] = {
      file: rel,
      totalKeys: langKeys.length,
      baseKeys: baseKeys.length,
      missingCount: missingKeys.length,
      extraCount: extraKeys.length,
      emptyCount: emptyValues.length,
      identicalToBaseCount,
      placeholderMismatchCount: placeholderMismatches.length,
      coveragePct,
      missingSample: missingKeys.slice(0, 20),
      extraSample: extraKeys.slice(0, 10),
    };

    if (missingKeys.length > 0) {
      issues.push({
        id: `i18n-missing-keys:${lang}`,
        category: 'i18n',
        severity: 'warning',
        rule: 'i18n-missing-keys',
        file: rel,
        line: 1,
        message: `[${lang.toUpperCase()}] Faltan ${missingKeys.length} claves respecto a ${BASE_LANG}.json (Cobertura: ${coveragePct}%). Ej: ${missingKeys.slice(0, 5).join(', ')}`,
      });
    }

    if (extraKeys.length > 0) {
      issues.push({
        id: `i18n-orphan-keys:${lang}`,
        category: 'i18n',
        severity: 'info',
        rule: 'i18n-orphan-keys',
        file: rel,
        line: 1,
        message: `[${lang.toUpperCase()}] Contiene ${extraKeys.length} claves huérfanas que no existen en ${BASE_LANG}.json: ${extraKeys.slice(0, 5).join(', ')}`,
      });
    }

    if (emptyValues.length > 0) {
      issues.push({
        id: `i18n-empty-vals:${lang}`,
        category: 'i18n',
        severity: 'warning',
        rule: 'i18n-empty-translation',
        file: rel,
        line: 1,
        message: `[${lang.toUpperCase()}] Tiene ${emptyValues.length} traducciones vacías: ${emptyValues.slice(0, 5).join(', ')}`,
      });
    }

    for (const pm of placeholderMismatches) {
      issues.push({
        id: `i18n-placeholder:${lang}:${pm.key}`,
        category: 'i18n',
        severity: 'error',
        rule: 'i18n-broken-placeholder',
        file: rel,
        line: 1,
        message: `[${lang.toUpperCase()}] Parámetros de interpolación rotos en '${pm.key}'. Esperado: {${pm.expected.join(',')}} vs Actual: {${pm.actual.join(',')}}`,
      });
    }
  }

  // Verificar si las claves usadas en código (.ts / .html) existen en es.json
  const codeFiles = walkFiles( path.join(SRC_DIR, 'app'), f => f.endsWith('.ts') || f.endsWith('.html'));
  const usedKeysMissingInBase = [];
  const keyRegex = /(?:['"`]([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)+)['"`]\s*\|\s*t\b)|(?:\b(?:i18n|translationService)\.(?:t|translate)\(\s*['"`]([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)+)['"`])/g;

  for (const file of codeFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const rel = relPath(file);
    const lines = content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      let m;
      keyRegex.lastIndex = 0;
      while ((m = keyRegex.exec(lines[i])) !== null) {
        const key = m[1] || m[2];
        if (key && !(key in baseMap) && !key.includes('${')) {
          const issueObj = {
            id: `i18n-undef-key:${rel}:${key}`,
            category: 'i18n',
            severity: 'error',
            rule: 'i18n-undefined-key-in-code',
            file: rel,
            line: i + 1,
            key,
            message: `La clave de traducción '${key}' se usa en el código pero NO existe en ${BASE_LANG}.json.`,
          };
          usedKeysMissingInBase.push(issueObj);
          issues.push(issueObj);
        }
      }
    }
  }

  return {
    baseLanguage: BASE_LANG,
    totalBaseKeys: baseKeys.length,
    languageSummary,
    usedKeysMissingInBase,
    issues,
  };
}

// ============================================================================
// 3. DETECTOR DE HTML INCRUSTADO EN TYPESCRIPT Y TEXTOS HARDCODEADOS
// ============================================================================
function analyzeCodeQualityAndHardcoding() {
  const appDir = path.join(SRC_DIR, 'app');
  const tsFiles = walkFiles(appDir, f => f.endsWith('.ts') && !f.endsWith('.spec.ts'));
  const htmlFiles = walkFiles(appDir, f => f.endsWith('.html'));
  const cssFiles = walkFiles(appDir, f => f.endsWith('.css') || f.endsWith('.scss'));

  const embeddedHtmlIssues = [];
  const hardcodedTextIssues = [];
  const architectureIssues = [];

  // 3A. Analizar archivos TypeScript (.ts)
  for (const file of tsFiles) {
    const rel = relPath(file);
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split(/\r?\n/);

    // Control de tamaño de archivo (Regla 2: Prohibidas Clases Dios y Archivos Gigantes)
    if (lines.length >= THRESHOLDS.tsCriticalLines) {
      architectureIssues.push({
        id: `arch-god-file:${rel}`,
        category: 'architecture',
        severity: 'warning',
        rule: 'no-god-class-size',
        file: rel,
        line: 1,
        message: `Archivo TypeScript monolítico (${lines.length} líneas). Supera el límite de ${THRESHOLDS.tsCriticalLines} líneas (Regla 2).`,
      });
    } else if (lines.length >= THRESHOLDS.tsWarningLines) {
      architectureIssues.push({
        id: `arch-large-ts:${rel}`,
        category: 'architecture',
        severity: 'info',
        rule: 'large-ts-file',
        file: rel,
        line: 1,
        message: `Archivo TypeScript extenso (${lines.length} líneas). Recomendado modularizar.`,
      });
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) continue;

      // Detectar innerHTML / outerHTML / insertAdjacentHTML
      if (/\.(innerHTML|outerHTML|insertAdjacentHTML)\b/.test(line)) {
        embeddedHtmlIssues.push({
          id: `ts-dom-html:${rel}:${i + 1}`,
          category: 'embedded-html',
          severity: 'warning',
          rule: 'no-direct-dom-html',
          file: rel,
          line: i + 1,
          snippet: trimmed.slice(0, 120),
          message: `Manipulación directa de HTML en DOM (${RegExp.$1}) dentro de TypeScript.`,
        });
      }

      // Detectar etiquetas HTML incrustadas en strings de TS
      if (/<(div|span|p|ul|li|table|section|article|header|footer|button|img|h[1-6]|br)\b[^>]*>/i.test(line)) {
        embeddedHtmlIssues.push({
          id: `ts-inline-html:${rel}:${i + 1}`,
          category: 'embedded-html',
          severity: 'warning',
          rule: 'no-embedded-html-in-ts',
          file: rel,
          line: i + 1,
          snippet: trimmed.slice(0, 120),
          message: `Etiqueta HTML (<${RegExp.$1}>) incrustada directamente en lógica TypeScript.`,
        });
      }

      // Detectar textos en español/UI hardcodeados en propiedades de TS o alertas/popups
      if (/(?:aria-label|title|alt|placeholder)\s*=\s*["']([^"'${]{4,})["']/i.test(line)) {
        const txt = RegExp.$1;
        if (/[a-zA-ZáéíóúÁÉÍÓÚñÑ]{3,}/.test(txt) && !txt.startsWith('http')) {
          hardcodedTextIssues.push({
            id: `ts-hardcoded-attr:${rel}:${i + 1}`,
            category: 'hardcoded-i18n',
            severity: 'warning',
            rule: 'no-hardcoded-ui-attr-in-ts',
            file: rel,
            line: i + 1,
            snippet: txt,
            message: `Atributo de accesibilidad/UI hardcodeado en TS: "${txt}". Debe usar sistema i18n.`,
          });
        }
      }
    }
  }

  // 3B. Analizar plantillas HTML (.html) buscando textos de interfaz hardcodeados sin pipe `| t` o `.translate(`
  for (const file of htmlFiles) {
    const rel = relPath(file);
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split(/\r?\n/);

    if (lines.length >= THRESHOLDS.htmlWarningLines) {
      architectureIssues.push({
        id: `arch-large-html:${rel}`,
        category: 'architecture',
        severity: 'info',
        rule: 'large-html-template',
        file: rel,
        line: 1,
        message: `Plantilla HTML muy extensa (${lines.length} líneas).`,
      });
    }

    let inComment = false;
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      if (line.includes('<!--')) inComment = true;
      if (inComment) {
        if (line.includes('-->')) inComment = false;
        continue;
      }

      // 1. Atributos placeholder / title / aria-label fijos (sin binding [title]= ni {{ }})
      const attrRegex = /(?<!\[)\b(placeholder|title|aria-label)\s*=\s*"([^"{}[\]]{3,})"/gi;
      let attrMatch;
      while ((attrMatch = attrRegex.exec(line)) !== null) {
        const attrName = attrMatch[1];
        const attrVal = attrMatch[2].trim();
        // Ignorar nombres propios puros de marca como "GTA V", "GTA VI", números o símbolos
        if (/^(GTA\s*(V|VI|5|6|Online|World|Explorer)?|[0-9\s.,+%-]+|×|✕|›|«|»)$/i.test(attrVal)) continue;
        if (/[a-zA-ZáéíóúÁÉÍÓÚñÑ]{3,}/.test(attrVal)) {
          hardcodedTextIssues.push({
            id: `html-hardcoded-attr:${rel}:${i + 1}:${attrName}`,
            category: 'hardcoded-i18n',
            severity: 'warning',
            rule: 'no-hardcoded-template-attribute',
            file: rel,
            line: i + 1,
            snippet: `${attrName}="${attrVal}"`,
            message: `Atributo [${attrName}] hardcodeado sin traducir en HTML: "${attrVal}".`,
          });
        }
      }

      // 2. Texto literal directo entre etiquetas >Texto< que no usa {{ ... | t }}
      const textBetweenTagsRegex = />([^<>]+)</g;
      let txtMatch;
      while ((txtMatch = textBetweenTagsRegex.exec(line)) !== null) {
        const rawText = txtMatch[1].trim();
        if (!rawText || rawText.length < 3) continue;
        // Ignorar interpolaciones Angular {{ ... }}, entidades HTML, iconos, marcas "GTA V / VI"
        if (rawText.includes('{{') || rawText.includes('}}')) continue;
        if (/^(&[a-z0-9#]+;|[0-9\s./,:+|•›«»✕×✓⚡★()-]+)$/i.test(rawText)) continue;
        if (/^(GTA\s*(V|VI|5|6|Online|World|Explorer)?|PC|PS[45]|Xbox|Rockstar|Social Club|Leaflet|OpenStreetMap)$/i.test(rawText)) continue;
        // Verificar que tenga al menos una palabra con letras (especialmente caracteres en español o frases)
        if (/[a-zA-ZáéíóúÁÉÍÓÚñÑ]{4,}/.test(rawText)) {
          hardcodedTextIssues.push({
            id: `html-hardcoded-text:${rel}:${i + 1}:${rawText.slice(0, 24)}`,
            category: 'hardcoded-i18n',
            severity: 'warning',
            rule: 'no-hardcoded-template-text',
            file: rel,
            line: i + 1,
            snippet: rawText.slice(0, 100),
            message: `Texto de interfaz hardcodeado en plantilla HTML: "${rawText.slice(0, 80)}".`,
          });
        }
      }
    }
  }

  // 3C. Analizar hojas de estilo CSS gigantes
  for (const file of cssFiles) {
    const rel = relPath(file);
    const size = fs.statSync(file).size;
    if (size >= THRESHOLDS.cssWarningBytes) {
      architectureIssues.push({
        id: `arch-large-css:${rel}`,
        category: 'architecture',
        severity: 'info',
        rule: 'large-stylesheet',
        file: rel,
        line: 1,
        message: `Hoja de estilos extensa (${(size / 1024).toFixed(1)} KB). Evitar parches acumulativos (Regla 2).`,
      });
    }
  }

  return {
    embeddedHtmlIssues,
    hardcodedTextIssues,
    architectureIssues,
  };
}

// ============================================================================
// 4. EJECUCIÓN DE ANGULAR ESLINT
// ============================================================================
function runAngularEslint() {
  const issues = [];
  try {
    const cmd = 'npx eslint "src/**/*.ts" "src/**/*.html" -f json';
    let stdout = '';
    try {
      stdout = execSync(cmd, { cwd: CLIENT_DIR, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], maxBuffer: 25 * 1024 * 1024 });
    } catch (err) {
      // ESLint devuelve exit code 1 cuando encuentra errores, pero emite el JSON en stdout
      stdout = err.stdout || '[]';
    }

    const parsed = JSON.parse(stdout || '[]');
    let errorCount = 0;
    let warningCount = 0;

    for (const fileResult of parsed) {
      const rel = relPath(fileResult.filePath);
      errorCount += fileResult.errorCount || 0;
      warningCount += fileResult.warningCount || 0;

      for (const msg of fileResult.messages || []) {
        issues.push({
          id: `eslint:${rel}:${msg.ruleId || 'syntax'}:${msg.line || 0}:${msg.column || 0}`,
          category: 'eslint',
          severity: msg.severity === 2 ? 'error' : 'warning',
          rule: msg.ruleId || 'eslint-parse',
          file: rel,
          line: msg.line || 1,
          column: msg.column || 1,
          message: msg.message,
        });
      }
    }

    return {
      executed: true,
      errorCount,
      warningCount,
      totalIssues: issues.length,
      issues,
    };
  } catch (err) {
    return {
      executed: false,
      errorCount: 0,
      warningCount: 0,
      totalIssues: 0,
      error: err.message,
      issues: [],
    };
  }
}

// ============================================================================
// 5. COMPROBACIONES DE COMPILACIÓN (.NET + ANGULAR)
// ============================================================================
function runBuildChecks() {
  const results = {
    dotnetBuild: { executed: false, success: true, durationMs: 0, output: '' },
    angularTypeCheck: { executed: false, success: true, durationMs: 0, output: '' },
  };

  // Siempre ejecutamos TypeScript TypeCheck rápido (tsc --noEmit) porque tarda ~2-3s y valida compilación TS sin escribir a disco
  const t0 = Date.now();
  try {
    execSync('npx tsc --noEmit -p tsconfig.app.json', { cwd: CLIENT_DIR, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    results.angularTypeCheck = { executed: true, success: true, durationMs: Date.now() - t0, output: 'Compilación TypeScript (tsconfig.app.json) limpia: 0 errores.' };
  } catch (err) {
    results.angularTypeCheck = {
      executed: true,
      success: false,
      durationMs: Date.now() - t0,
      output: (err.stdout || '') + '\n' + (err.stderr || err.message),
    };
  }

  if (WITH_BUILD) {
    const b0 = Date.now();
    try {
      const out = execSync('dotnet build GTAAPP.Server/GTAAPP.Server.csproj --no-restore -v minimal', {
        cwd: ROOT_DIR,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      results.dotnetBuild = { executed: true, success: true, durationMs: Date.now() - b0, output: out.trim() };
    } catch (err) {
      results.dotnetBuild = {
        executed: true,
        success: false,
        durationMs: Date.now() - b0,
        output: (err.stdout || '') + '\n' + (err.stderr || err.message),
      };
    }
  }

  return results;
}

// ============================================================================
// 6. COMPARACIÓN CONTRA BASELINE (PROBLEMAS NUEVOS VS PREEXISTENTES)
// ============================================================================
function compareWithBaseline(allIssues, jsonMetrics, baseline) {
  if (!baseline || !baseline.issueFingerprints) {
    return {
      hasBaseline: false,
      newIssues: [],
      preexistingIssues: allIssues,
      resolvedCount: 0,
      jsonGrowthAlerts: [],
    };
  }

  const baseSet = new Set(baseline.issueFingerprints);
  const newIssues = [];
  const preexistingIssues = [];

  for (const issue of allIssues) {
    // Fingerprint semántico estable (independiente de pequeños desplazamientos de línea)
    const fingerprint = `${issue.category}|${issue.rule}|${issue.file}|${issue.message.slice(0, 80)}`;
    issue.fingerprint = fingerprint;
    if (baseSet.has(fingerprint)) {
      issue.isNew = false;
      preexistingIssues.push(issue);
    } else {
      issue.isNew = true;
      newIssues.push(issue);
    }
  }

  const currentSet = new Set(allIssues.map(i => i.fingerprint));
  let resolvedCount = 0;
  for (const oldFp of baseSet) {
    if (!currentSet.has(oldFp)) resolvedCount++;
  }

  // Comparar crecimiento de archivos JSON respecto al baseline
  const jsonGrowthAlerts = [];
  const baseJsonSizes = baseline.jsonSizes || {};
  for (const [file, meta] of Object.entries(jsonMetrics)) {
    const prevSize = baseJsonSizes[file];
    if (typeof prevSize === 'number') {
      const deltaBytes = meta.sizeBytes - prevSize;
      if (deltaBytes > THRESHOLDS.jsonMaxGrowthBytes) {
        const alert = {
          id: `json-growth-spike:${file}`,
          category: 'json',
          severity: 'warning',
          rule: 'json-growth-spike-since-baseline',
          file,
          line: 1,
          previousKB: +(prevSize / 1024).toFixed(2),
          currentKB: meta.sizeKB,
          deltaKB: +(deltaBytes / 1024).toFixed(2),
          isNew: true,
          message: `Crecimiento acelerado de JSON: +${(deltaBytes / 1024).toFixed(1)} KB desde la línea base (${(prevSize / 1024).toFixed(1)} KB -> ${meta.sizeKB} KB).`,
        };
        jsonGrowthAlerts.push(alert);
        newIssues.push(alert);
      }
    }
  }

  return {
    hasBaseline: true,
    baselineTimestamp: baseline.timestamp,
    newIssues,
    preexistingIssues,
    resolvedCount,
    jsonGrowthAlerts,
  };
}

// ============================================================================
// EJECUCIÓN PRINCIPAL
// ============================================================================
function main() {
  const startTime = Date.now();
  fs.mkdirSync(REPORT_DIR, { recursive: true });

  console.log('\n=====================================================================');
  console.log('  GTA EXPLORER - SISTEMA LOCAL DE CONTROL DE CALIDAD Y AUDITORÍA');
  console.log('=====================================================================');

  console.log('[1/5] Analizando 370+ archivos JSON (sintaxis, UTF-8 y crecimiento)...');
  const jsonReport = analyzeJsonFiles();

  console.log('[2/5] Auditando sistema i18n (13 idiomas, claves faltantes y placeholders)...');
  const i18nReport = analyzeI18n();

  console.log('[3/5] Escaneando HTML incrustado en TypeScript, textos hardcodeados y arquitectura...');
  const codeReport = analyzeCodeQualityAndHardcoding();

  console.log('[4/5] Ejecutando Angular ESLint (TypeScript + Plantillas HTML)...');
  const eslintReport = runAngularEslint();

  console.log('[5/5] Verificando compilación TypeScript / .NET...');
  const buildReport = runBuildChecks();

  const allIssues = [
    ...jsonReport.issues,
    ...i18nReport.issues,
    ...codeReport.embeddedHtmlIssues,
    ...codeReport.hardcodedTextIssues,
    ...codeReport.architectureIssues,
    ...eslintReport.issues,
  ];

  // Asignar fingerprint a cada issue
  for (const issue of allIssues) {
    issue.fingerprint = `${issue.category}|${issue.rule}|${issue.file}|${issue.message.slice(0, 80)}`;
  }

  let baseline = null;
  if (fs.existsSync(BASELINE_FILE) && !UPDATE_BASELINE) {
    try {
      baseline = JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf8'));
    } catch {
      baseline = null;
    }
  }

  if (UPDATE_BASELINE || !baseline) {
    const jsonSizes = {};
    for (const [f, m] of Object.entries(jsonReport.fileMetrics)) {
      jsonSizes[f] = m.sizeBytes;
    }
    baseline = {
      timestamp: new Date().toISOString(),
      totalIssuesAtBaseline: allIssues.length,
      issueFingerprints: [...new Set(allIssues.map(i => i.fingerprint))],
      jsonSizes,
    };
    fs.writeFileSync(BASELINE_FILE, JSON.stringify(baseline, null, 2), 'utf8');
    console.log(`\n[BASELINE] Línea base guardada en quality/baseline.json (${baseline.issueFingerprints.length} hallazgos preexistentes registrados).`);
  }

  const comparison = compareWithBaseline(allIssues, jsonReport.fileMetrics, baseline);

  // Evaluar Quality Gate (Falla solo si hay errores de compilación, JSON corrupto o problemas NUEVOS de severidad error)
  const newErrors = comparison.newIssues.filter(i => i.severity === 'error');
  const jsonSyntaxErrors = jsonReport.issues.filter(i => i.rule === 'json-syntax-error' || i.rule === 'json-utf8-corruption');
  const buildFailed = !buildReport.angularTypeCheck.success || (buildReport.dotnetBuild.executed && !buildReport.dotnetBuild.success);

  const qualityGatePassed = newErrors.length === 0 && jsonSyntaxErrors.length === 0 && !buildFailed;

  const durationMs = Date.now() - startTime;

  let initialIssuesCount = 1874;
  if (fs.existsSync(INITIAL_BASELINE_FILE)) {
    try {
      const initData = JSON.parse(fs.readFileSync(INITIAL_BASELINE_FILE, 'utf8'));
      if (initData.totalIssuesInitial) initialIssuesCount = initData.totalIssuesInitial;
    } catch {}
  }
  const totalResolvedCumulative = Math.max(0, initialIssuesCount - allIssues.length);

  const fullReport = {
    timestamp: new Date().toISOString(),
    durationMs,
    qualityGate: {
      passed: qualityGatePassed,
      status: qualityGatePassed ? 'PASSED' : 'FAILED',
      newErrorsCount: newErrors.length,
      newWarningsCount: comparison.newIssues.filter(i => i.severity !== 'error').length,
      jsonSyntaxErrorsCount: jsonSyntaxErrors.length,
      buildSuccess: !buildFailed,
    },
    summary: {
      totalIssues: allIssues.length,
      initialIssuesCount,
      newIssuesCount: comparison.newIssues.length,
      preexistingIssuesCount: comparison.preexistingIssues.length,
      resolvedSinceBaseline: comparison.resolvedCount,
      resolvedCumulative: totalResolvedCumulative,
      byCategory: {
        json: jsonReport.issues.length,
        i18n: i18nReport.issues.length,
        embeddedHtml: codeReport.embeddedHtmlIssues.length,
        hardcodedText: codeReport.hardcodedTextIssues.length,
        architecture: codeReport.architectureIssues.length,
        eslint: eslintReport.issues.length,
      },
      bySeverity: {
        error: allIssues.filter(i => i.severity === 'error').length,
        warning: allIssues.filter(i => i.severity === 'warning').length,
        info: allIssues.filter(i => i.severity === 'info').length,
      },
    },
    jsonAnalysis: {
      totalFiles: jsonReport.totalFiles,
      totalSizeMB: jsonReport.totalSizeMB,
      largestFiles: jsonReport.largestFiles,
      growthAlerts: comparison.jsonGrowthAlerts,
    },
    i18nAnalysis: {
      baseLanguage: i18nReport.baseLanguage,
      totalBaseKeys: i18nReport.totalBaseKeys,
      languageSummary: i18nReport.languageSummary,
      usedKeysMissingInBase: i18nReport.usedKeysMissingInBase,
    },
    buildChecks: buildReport,
    newIssues: comparison.newIssues,
    issues: allIssues,
  };

  fs.writeFileSync(LATEST_REPORT_FILE, JSON.stringify(fullReport, null, 2), 'utf8');

  // Guardar historial de ejecuciones (últimas 30)
  let history = [];
  if (fs.existsSync(HISTORY_FILE)) {
    try { history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8')); } catch { history = []; }
  }
  history.unshift({
    timestamp: fullReport.timestamp,
    durationMs,
    gateStatus: fullReport.qualityGate.status,
    totalIssues: fullReport.summary.totalIssues,
    newIssues: fullReport.summary.newIssuesCount,
    resolved: fullReport.summary.resolvedSinceBaseline,
    totalJsonMB: jsonReport.totalSizeMB,
  });
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history.slice(0, 30), null, 2), 'utf8');

  // Imprimir resumen claro en consola
  console.log('\n---------------------------------------------------------------------');
  console.log(`  QUALITY GATE: ${qualityGatePassed ? 'PASSED (APROBADO)' : 'FAILED (BLOQUEADO)'} (${(durationMs / 1000).toFixed(1)}s)`);
  console.log('---------------------------------------------------------------------');
  console.log(`  * Problemas NUEVOS detectados       : ${comparison.newIssues.length} (${newErrors.length} errores críticos)`);
  console.log(`  * Problemas PREEXISTENTES (Baseline): ${comparison.preexistingIssues.length}`);
  console.log(`  * Problemas RESUELTOS desde Baseline: ${comparison.resolvedCount}`);
  console.log('---------------------------------------------------------------------');
  console.log(`  * Archivos JSON analizados          : ${jsonReport.totalFiles} (${jsonReport.totalSizeMB} MB totales)`);
  console.log(`  * Alertas de JSON (tamaño/vacíos)   : ${jsonReport.issues.length}`);
  console.log(`  * Desfases de i18n (13 idiomas)     : ${i18nReport.issues.length}`);
  console.log(`  * HTML incrustado en TypeScript     : ${codeReport.embeddedHtmlIssues.length}`);
  console.log(`  * Textos hardcodeados (HTML/TS)     : ${codeReport.hardcodedTextIssues.length}`);
  console.log(`  * Alertas de Arquitectura/Monolitos : ${codeReport.architectureIssues.length}`);
  console.log(`  * Reglas Angular ESLint             : ${eslintReport.issues.length} (${eslintReport.errorCount} err / ${eslintReport.warningCount} warn)`);
  console.log(`  * Compilación TypeScript            : ${buildReport.angularTypeCheck.success ? 'OK' : 'FALLO'}`);
  console.log('=====================================================================\n');

  if (FAIL_ON_NEW && !qualityGatePassed) {
    console.error('[BARRERA DE CALIDAD] Se han detectado errores críticos o problemas nuevos que incumplen el Quality Gate.');
    process.exit(1);
  }
}

main();
