
const fs = require("fs");
const files = [
  "c:/Users/josem/source/repos/JoseMiguelDiezSen/GTAAPP/gtaapp.client/src/app/gta5/online/gta5-online.component.css",
  "c:/Users/josem/source/repos/JoseMiguelDiezSen/GTAAPP/gtaapp.client/src/app/gta5/historia/gta5-historia.component.css",
  "c:/Users/josem/source/repos/JoseMiguelDiezSen/GTAAPP/gtaapp.client/src/app/gta6/online/gta6-online.component.css",
  "c:/Users/josem/source/repos/JoseMiguelDiezSen/GTAAPP/gtaapp.client/src/app/gta6/historia/gta6-historia.component.css"
];

for (let file of files) {
  let content = fs.readFileSync(file, "utf8");
  // Replace `top: 10px;` inside `.hud-tc {` block
  content = content.replace(/\.hud-tc\s*\{\s*top:\s*10px;/g, ".hud-tc {\n  top: 4px;");
  fs.writeFileSync(file, content);
}

