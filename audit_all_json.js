const fs = require('fs');
const path = require('path');

const langs = ['es', 'en', 'pt', 'zh', 'fr', 'de', 'it', 'ru', 'ar', 'ja', 'hi', 'tr', 'ko'];
const modes = ['online', 'historia'];
const baseDir = 'gtaapp.client/src/assets/data/gta5';

const report = {};

modes.forEach(mode => {
  report[mode] = {};
  const esDir = path.join(baseDir, mode, 'es');
  if (!fs.existsSync(esDir)) return;
  const files = fs.readdirSync(esDir).filter(f => f.endsWith('.json'));

  files.forEach(file => {
    report[mode][file] = {};
    langs.forEach(lang => {
      const filePath = path.join(baseDir, mode, lang, file);
      if (!fs.existsSync(filePath)) {
        report[mode][file][lang] = { status: 'MISSING' };
      } else {
        try {
          const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          const count = Array.isArray(content) ? content.length : Object.keys(content).length;
          
          // Sample first item to inspect keys and Spanish leakage
          let sampleKeys = [];
          let hasSpanishInDescription = false;
          let hasSpanishCategory = false;
          if (Array.isArray(content) && content.length > 0) {
            const first = content[0];
            sampleKeys = Object.keys(first);
          }

          report[mode][file][lang] = {
            count,
            sampleKeys
          };
        } catch (e) {
          report[mode][file][lang] = { error: e.message };
        }
      }
    });
  });
});

console.log(JSON.stringify(report, null, 2));
