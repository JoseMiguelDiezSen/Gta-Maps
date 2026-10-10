
const fs = require("fs");
const path = require("path");

const guiaDir = path.join(__dirname, "gtaapp.client", "src", "assets", "data", "gta5", "guia", "misiones");
const files = fs.readdirSync(guiaDir).filter(f => f.startsWith("misiones-") && f.endsWith(".json"));

let allMissions = [];
files.forEach(f => {
  const content = JSON.parse(fs.readFileSync(path.join(guiaDir, f), "utf8"));
  allMissions = allMissions.concat(content);
});

allMissions.sort((a, b) => a.numero - b.numero);

// Create merged Guide file
const mergedGuideFile = path.join(__dirname, "gtaapp.client", "src", "assets", "data", "gta5", "guia", "misiones-historia.json");
fs.writeFileSync(mergedGuideFile, JSON.stringify(allMissions, null, 2));

// Create Map Panel mapped file
const mappedMissions = allMissions.map(m => {
  return {
    id: "mission-" + String(m.numero).padStart(2, "0"),
    order: m.numero,
    title: m.titulo.replace(/^\d+\.\s*/, ""),
    character: m.protagonistas ? m.protagonistas.join(", ") : "Michael, Franklin, Trevor",
    giver: m.contacto || "Historia",
    category: "Historia",
    description: m.subtitulo || "Misión de la historia principal.",
    goldRequirements: m.requisitosOro ? m.requisitosOro.map(r => r.titulo) : [],
    reward: m.recompensa || "",
    unlockedBy: "Progreso de historia"
  };
});

const mapFile = path.join(__dirname, "gtaapp.client", "src", "assets", "data", "gta5", "historia", "es", "missions.json");
fs.writeFileSync(mapFile, JSON.stringify(mappedMissions, null, 2));

// Delete old chunks
files.forEach(f => {
  fs.unlinkSync(path.join(guiaDir, f));
});

console.log("Done merging " + allMissions.length + " missions.");

