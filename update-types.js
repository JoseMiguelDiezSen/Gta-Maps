
const fs = require("fs");
let lines = fs.readFileSync("c:/Users/josem/source/repos/JoseMiguelDiezSen/GTAAPP/gtaapp.client/src/app/i18n/i18n.types.ts", "utf8").split("\n");
for (let i=0; i<lines.length; i++) {
  if (lines[i].includes("themeModern:")) lines[i] = "      themeStandard: string;\n      themeClassic: string;\n      themeModern: string;";
  else if (lines[i].includes("themeClassic:")) lines[i] = "";
}
fs.writeFileSync("c:/Users/josem/source/repos/JoseMiguelDiezSen/GTAAPP/gtaapp.client/src/app/i18n/i18n.types.ts", lines.filter(l => l !== "").join("\n"));

