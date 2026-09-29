
const fs = require("fs");
const files = [
  "c:/Users/josem/source/repos/JoseMiguelDiezSen/GTAAPP/gtaapp.client/src/app/gta5/online/gta5-online.component.html",
  "c:/Users/josem/source/repos/JoseMiguelDiezSen/GTAAPP/gtaapp.client/src/app/gta6/online/gta6-online.component.html",
  "c:/Users/josem/source/repos/JoseMiguelDiezSen/GTAAPP/gtaapp.client/src/app/gta6/historia/gta6-historia.component.html"
];
for (let file of files) {
  let content = fs.readFileSync(file, "utf8");
  content = content.replace(
    /<option value="modern">{{ 'gta5\.settings\.themeModern' \| translate }}<\/option>\s*<option value="classic">{{ 'gta5\.settings\.themeClassic' \| translate }}<\/option>/,
    `<option value="standard">{{ 'gta5.settings.themeStandard' | translate }}</option>\n                  <option value="classic">{{ 'gta5.settings.themeClassic' | translate }}</option>\n                  <option value="modern">{{ 'gta5.settings.themeModern' | translate }}</option>`
  );
  fs.writeFileSync(file, content);
}

