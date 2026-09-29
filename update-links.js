
const fs = require("fs");

function updateContent(filePath, replacePairs) {
  let content = fs.readFileSync(filePath, "utf8");
  replacePairs.forEach(pair => {
    content = content.replace(pair[0], pair[1]);
  });
  fs.writeFileSync(filePath, content);
}

// 1. Home
updateContent("c:/Users/josem/source/repos/JoseMiguelDiezSen/GTAAPP/gtaapp.client/src/app/home/home.component.html", [
  [/routerLink="\/gta5"/g, `routerLink="/gta5-online"`],
  [/routerLink="\/gta6"/g, `routerLink="/gta6-online"`]
]);

// 2. GTA 5 Online HTML
updateContent("c:/Users/josem/source/repos/JoseMiguelDiezSen/GTAAPP/gtaapp.client/src/app/gta5/online/gta5-online.component.html", [
  [/routerLink="\/gta5\/historia"/g, `routerLink="/gta5-historia"`]
]);

// 3. GTA 5 Historia HTML
updateContent("c:/Users/josem/source/repos/JoseMiguelDiezSen/GTAAPP/gtaapp.client/src/app/gta5/historia/gta5-historia.component.html", [
  [/routerLink="\/gta5"/g, `routerLink="/gta5-online"`]
]);

// 4. GTA 6 Online HTML
updateContent("c:/Users/josem/source/repos/JoseMiguelDiezSen/GTAAPP/gtaapp.client/src/app/gta6/online/gta6-online.component.html", [
  [/routerLink="\/gta6\/historia"/g, `routerLink="/gta6-historia"`],
  [/routerLink="\/gta6historia"/g, `routerLink="/gta6-historia"`]
]);

// 5. GTA 6 Historia HTML
updateContent("c:/Users/josem/source/repos/JoseMiguelDiezSen/GTAAPP/gtaapp.client/src/app/gta6/historia/gta6-historia.component.html", [
  [/routerLink="\/gta6"/g, `routerLink="/gta6-online"`]
]);

// 6, 7, 8, 9. Component TS files
const tsFiles = [
  "c:/Users/josem/source/repos/JoseMiguelDiezSen/GTAAPP/gtaapp.client/src/app/gta5/online/gta5-online.component.ts",
  "c:/Users/josem/source/repos/JoseMiguelDiezSen/GTAAPP/gtaapp.client/src/app/gta5/historia/gta5-historia.component.ts",
  "c:/Users/josem/source/repos/JoseMiguelDiezSen/GTAAPP/gtaapp.client/src/app/gta6/online/gta6-online.component.ts",
  "c:/Users/josem/source/repos/JoseMiguelDiezSen/GTAAPP/gtaapp.client/src/app/gta6/historia/gta6-historia.component.ts"
];

tsFiles.forEach(file => {
  updateContent(file, [
    [/navigate\(\[\x27\/gta5\x27\]\)/g, `navigate([\x27/gta5-online\x27])`],
    [/navigate\(\[\x27\/gta6\x27\]\)/g, `navigate([\x27/gta6-online\x27])`],
    [/navigate\(\[\x27\/gta5\/historia\x27\]\)/g, `navigate([\x27/gta5-historia\x27])`],
    [/navigate\(\[\x27\/gta6\/historia\x27\]\)/g, `navigate([\x27/gta6-historia\x27])`]
  ]);
});

