
const fs = require("fs");
const files = [
  "c:/Users/josem/source/repos/JoseMiguelDiezSen/GTAAPP/gtaapp.client/src/app/gta6/online/gta6-online.component.html",
  "c:/Users/josem/source/repos/JoseMiguelDiezSen/GTAAPP/gtaapp.client/src/app/gta6/historia/gta6-historia.component.html"
];

for (let file of files) {
  let content = fs.readFileSync(file, "utf8");
  
  content = content.replace(
    /<button type="button" class="hud-acc-head hud-acc-head-btn" \(click\)="toggleSection\(.juego.\)">\s*<span class="hud-acc-caret"><\/span>\s*<span class="hud-acc-title">\{\{ .gta5\.settings\.gameSelector. \| translate \}\}<\/span>\s*<\/button>/,
    `<div class="hud-acc-head">\n              <div class="hud-acc-toggle" (click)="toggleSection(\x27juego\x27)">\n                <span class="hud-acc-caret"></span>\n                <span class="hud-acc-title">{{ \x27gta5.settings.gameSelector\x27 | translate }}</span>\n              </div>\n            </div>`
  );
  
  content = content.replace(
    /<button type="button" class="hud-acc-head hud-acc-head-btn" \(click\)="toggleSection\(.mapa.\)">\s*<span class="hud-acc-caret"><\/span>\s*<span class="hud-acc-title">\{\{ .gta5\.settings\.mapSelector. \| translate \}\}<\/span>\s*<\/button>/,
    `<div class="hud-acc-head">\n              <div class="hud-acc-toggle" (click)="toggleSection(\x27mapa\x27)">\n                <span class="hud-acc-caret"></span>\n                <span class="hud-acc-title">{{ \x27gta5.settings.mapSelector\x27 | translate }}</span>\n              </div>\n            </div>`
  );

  content = content.replace(
    /<button type="button" class="hud-acc-head hud-acc-head-btn" \(click\)="toggleSection\(.zona.\)">\s*<span class="hud-acc-caret"><\/span>\s*<span class="hud-acc-title">\{\{ .gta5\.settings\.iconStyle. \| translate \}\}<\/span>\s*<\/button>/,
    `<div class="hud-acc-head">\n              <div class="hud-acc-toggle" (click)="toggleSection(\x27zona\x27)">\n                <span class="hud-acc-caret"></span>\n                <span class="hud-acc-title">{{ \x27gta5.settings.iconStyle\x27 | translate }}</span>\n              </div>\n            </div>`
  );
  
  content = content.replace(
    /<button type="button" class="hud-acc-head hud-acc-head-btn" \(click\)="toggleSection\(.policia.\)">\s*<span class="hud-acc-caret"><\/span>\s*<span class="hud-acc-title">\{\{ .gta5\.settings\.police. \| translate \}\}<\/span>\s*<\/button>/,
    `<div class="hud-acc-head">\n              <div class="hud-acc-toggle" (click)="toggleSection(\x27policia\x27)">\n                <span class="hud-acc-caret"></span>\n                <span class="hud-acc-title">{{ \x27gta5.settings.police\x27 | translate }}</span>\n              </div>\n            </div>`
  );

  fs.writeFileSync(file, content);
}

