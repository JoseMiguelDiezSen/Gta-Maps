
const fs = require("fs");
let lines = fs.readFileSync("c:/Users/josem/source/repos/JoseMiguelDiezSen/GTAAPP/gtaapp.client/src/app/i18n/locales/en.ts", "utf8").split("\n");
for (let i=0; i<lines.length; i++) {
  if (lines[i].includes("markerTheme:")) lines[i] = "      markerTheme: \"Theme\",";
  else if (lines[i].includes("themeModern:")) lines[i] = "      themeStandard: \"Standard\",\n      themeClassic: \"Classic\",\n      themeModern: \"Modern (Neon)\",";
  else if (lines[i].includes("themeClassic:")) lines[i] = "";
}
fs.writeFileSync("c:/Users/josem/source/repos/JoseMiguelDiezSen/GTAAPP/gtaapp.client/src/app/i18n/locales/en.ts", lines.filter(l => l !== "").join("\n"));

