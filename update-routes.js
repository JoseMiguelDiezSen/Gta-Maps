
const fs = require("fs");
let content = fs.readFileSync("c:/Users/josem/source/repos/JoseMiguelDiezSen/GTAAPP/gtaapp.client/src/app/app-routing.module.ts", "utf8");

const routesStr = `    { path: \x27gta5-online\x27,   component: Gta5OnlineComponent },
    { path: \x27gta5-historia\x27, component: Gta5HistoriaComponent },
    { path: \x27gta6-online\x27,   component: Gta6OnlineComponent },
    { path: \x27gta6-historia\x27, component: Gta6HistoriaComponent },

    // Redirecciones por compatibilidad
    { path: \x27gta5\x27,          redirectTo: \x27/gta5-online\x27, pathMatch: \x27full\x27 },
    { path: \x27gta5online\x27,    redirectTo: \x27/gta5-online\x27, pathMatch: \x27full\x27 },
    { path: \x27gta5/online\x27,   redirectTo: \x27/gta5-online\x27, pathMatch: \x27full\x27 },
    { path: \x27gta5/historia\x27, redirectTo: \x27/gta5-historia\x27, pathMatch: \x27full\x27 },
    { path: \x27gta5historia\x27,  redirectTo: \x27/gta5-historia\x27, pathMatch: \x27full\x27 },
    { path: \x27gt5\x27,           redirectTo: \x27/gta5-online\x27, pathMatch: \x27full\x27 },
    { path: \x27gta6\x27,          redirectTo: \x27/gta6-online\x27, pathMatch: \x27full\x27 },
    { path: \x27gta6online\x27,    redirectTo: \x27/gta6-online\x27, pathMatch: \x27full\x27 },
    { path: \x27gta6/online\x27,   redirectTo: \x27/gta6-online\x27, pathMatch: \x27full\x27 },
    { path: \x27gta6/historia\x27, redirectTo: \x27/gta6-historia\x27, pathMatch: \x27full\x27 },
    { path: \x27gta6historia\x27,  redirectTo: \x27/gta6-historia\x27, pathMatch: \x27full\x27 },`;

content = content.replace(
  /    \{\s*path:\s*\x27gta5\x27[\s\S]*?\{\s*path:\s*\x27gta6historia\x27[\s\S]*?\},/m,
  routesStr
);

fs.writeFileSync("c:/Users/josem/source/repos/JoseMiguelDiezSen/GTAAPP/gtaapp.client/src/app/app-routing.module.ts", content);

