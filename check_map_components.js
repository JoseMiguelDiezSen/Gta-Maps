const fs = require('fs');
const path = require('path');

const gta5Online = fs.readFileSync('gtaapp.client/src/app/pages/gta5-online/gta5-online.component.ts', 'utf8');
const gta5Historia = fs.readFileSync('gtaapp.client/src/app/pages/gta5-historia/gta5-historia.component.ts', 'utf8');

console.log('Online length:', gta5Online.length, 'Historia length:', gta5Historia.length);

const onlineMatches = gta5Online.match(/data\/gta5\/[^\`\"\'\s]+/g) || [];
const historiaMatches = gta5Historia.match(/data\/gta5\/[^\`\"\'\s]+/g) || [];

console.log('Online JSON loads:', onlineMatches);
console.log('Historia JSON loads:', historiaMatches);

const onlineHttp = gta5Online.match(/this\.http\.get[^\n]+/g) || [];
console.log('Online HTTP gets:', onlineHttp);
