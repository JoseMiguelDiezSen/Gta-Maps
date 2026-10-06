const fs = require('fs');
const path = require('path');

const langs = ['es', 'en', 'pt', 'zh', 'fr', 'de', 'it', 'ru', 'ar', 'ja', 'hi', 'tr', 'ko'];
const baseClient = 'gtaapp.client/src/assets/data/gta5';

langs.forEach(lang => {
  const onlineWeaponsPath = path.join(baseClient, 'online', lang, 'weapons.json');
  const historiaWeaponsPath = path.join(baseClient, 'historia', lang, 'weapons.json');

  if (fs.existsSync(onlineWeaponsPath)) {
    const onlineData = JSON.parse(fs.readFileSync(onlineWeaponsPath, 'utf8'));
    // Map online weapons to story weapons (story mode has 28 weapons, online has 28)
    const storyData = onlineData.map(w => ({
      ...w,
      gameMode: 'story'
    }));
    fs.writeFileSync(historiaWeaponsPath, JSON.stringify(storyData, null, 2), 'utf8');
    console.log(`Updated historia weapons for ${lang} (${storyData.length} items)`);
  }
});
