const fs = require('fs');
const path = require('path');

const langs = ['en', 'pt', 'zh', 'fr', 'de', 'it', 'ru', 'ar', 'ja', 'hi', 'tr', 'ko'];
const modes = ['online', 'historia'];
const baseDir = 'gtaapp.client/src/assets/data/gta5';

const filesToCheck = [
  'cayo_perico.json',
  'properties.json',
  'businesses.json',
  'services.json',
  'activities.json',
  'characters.json',
  'fauna.json',
  'strange_places.json',
  'vehicle_shops.json',
  'roleplay_jobs.json',
  'collectibles.json',
  'strangers_and_freaks.json',
  'mysteries.json'
];

// Check for common Spanish words in non-Spanish/non-Portuguese languages
const spanishIndicators = [
  'Ubicación', 'Descripción', 'Propiedad', 'Negocio', 'Comisaría', 'Comisaria', 'Hospital', 'Bomberos',
  'Tienda', 'Punto de interés', 'Punto de infiltración', 'Punto de escape', 'Torre de control',
  'Cámara de seguridad', 'Botín principal', 'Botín secundario', 'Cortacables', 'Gancho de escalada',
  'Disfraz de guardia', 'Camión de suministros', 'Polvo para cortar', 'Torre de agua', 'Escopeta de combate',
  'Pistola Perico', 'Cofre del tesoro', 'Alijo enterrado', 'Puntos de', 'Recompensa', 'Pista', 'Zona'
];

const results = [];

modes.forEach(mode => {
  filesToCheck.forEach(file => {
    const esPath = path.join(baseDir, mode, 'es', file);
    if (!fs.existsSync(esPath)) return;
    const esContent = fs.readFileSync(esPath, 'utf8');

    langs.forEach(lang => {
      const targetPath = path.join(baseDir, mode, lang, file);
      if (!fs.existsSync(targetPath)) {
        results.push({ mode, file, lang, issue: 'FILE_MISSING' });
        return;
      }
      const targetContent = fs.readFileSync(targetPath, 'utf8');
      
      // Compare if targetContent is identical to esContent
      if (targetContent === esContent) {
        results.push({ mode, file, lang, issue: 'IDENTICAL_TO_SPANISH' });
      } else {
        // Sample check for Spanish phrases in non-Latin or distinct languages (ru, ar, ja, hi, ko, zh, de, en, etc.)
        if (['ru', 'ar', 'ja', 'hi', 'ko', 'zh'].includes(lang)) {
          // If descriptions are still in Spanish alphabet (ASCII Latin)
          try {
            const data = JSON.parse(targetContent);
            if (Array.isArray(data)) {
              let spanishDescCount = 0;
              let totalWithDesc = 0;
              data.forEach(item => {
                const desc = item.description || item.hint || item.lore || item.details || '';
                if (desc) {
                  totalWithDesc++;
                  // if language is ru/ja/hi/ko/zh/ar and description contains Spanish words
                  if (spanishIndicators.some(w => desc.toLowerCase().includes(w.toLowerCase()))) {
                    spanishDescCount++;
                  }
                }
              });
              if (spanishDescCount > 0) {
                results.push({ mode, file, lang, issue: `SPANISH_WORDS_FOUND (${spanishDescCount}/${totalWithDesc})` });
              }
            }
          } catch (e) {
            results.push({ mode, file, lang, issue: 'JSON_PARSE_ERROR: ' + e.message });
          }
        }
      }
    });
  });
});

console.log('Results length:', results.length);
console.log(JSON.stringify(results.slice(0, 50), null, 2));
