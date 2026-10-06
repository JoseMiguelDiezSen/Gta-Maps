const fs = require('fs');
const path = require('path');

const langs = ['es', 'en', 'pt', 'zh', 'fr', 'de', 'it', 'ru', 'ar', 'ja', 'hi', 'tr', 'ko'];
const modes = ['online', 'historia'];
const baseDir = 'gtaapp.client/src/assets/data/gta5';

const allIssues = [];

modes.forEach(mode => {
  const esDir = path.join(baseDir, mode, 'es');
  if (!fs.existsSync(esDir)) return;
  const files = fs.readdirSync(esDir).filter(f => f.endsWith('.json'));

  files.forEach(file => {
    const esContent = JSON.parse(fs.readFileSync(path.join(esDir, file), 'utf8'));

    langs.filter(l => l !== 'es').forEach(lang => {
      const targetPath = path.join(baseDir, mode, lang, file);
      if (!fs.existsSync(targetPath)) {
        allIssues.push({ mode, file, lang, type: 'MISSING' });
        return;
      }
      const targetContent = JSON.parse(fs.readFileSync(targetPath, 'utf8'));

      if (Array.isArray(esContent)) {
        let identicalDescCount = 0;
        let identicalNameCount = 0;
        let identicalCategoryLabelCount = 0;
        let identicalFeaturesCount = 0;
        let totalItems = esContent.length;

        for (let i = 0; i < esContent.length; i++) {
          const esItem = esContent[i];
          const trItem = targetContent[i];
          if (!trItem) continue;

          if (esItem.description && trItem.description && esItem.description === trItem.description && esItem.description.length > 5) {
            identicalDescCount++;
          }
          if (esItem.categoryLabel && trItem.categoryLabel && esItem.categoryLabel === trItem.categoryLabel && esItem.categoryLabel.length > 3) {
            identicalCategoryLabelCount++;
          }
          if (esItem.features && trItem.features && Array.isArray(esItem.features) && JSON.stringify(esItem.features) === JSON.stringify(trItem.features) && esItem.features.length > 0) {
            identicalFeaturesCount++;
          }
          if (esItem.hint && trItem.hint && esItem.hint === trItem.hint && esItem.hint.length > 5) {
            identicalDescCount++;
          }
        }

        if (identicalDescCount > 0 || identicalCategoryLabelCount > 0 || identicalFeaturesCount > 0) {
          allIssues.push({
            mode,
            file,
            lang,
            identicalDescCount,
            identicalCategoryLabelCount,
            identicalFeaturesCount,
            totalItems
          });
        }
      }
    });
  });
});

console.log('Total issue groups:', allIssues.length);
console.log(JSON.stringify(allIssues, null, 2));
