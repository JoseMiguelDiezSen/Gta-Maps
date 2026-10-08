import { DealerCategory, GtaVehicle } from '../../models/vehicle';
import { GtaMission, GtaHeist } from '../../models/mission';
import { GtaMystery } from '../../models/mystery';
import { GtaWeapon } from '../../models/weapon';

/**
 * Concesionarios de GTA VI (Leonida / Vice City) en Inglés.
 */
export const GTA6_DEALERS_EN: DealerCategory[] = [
  {
    id: 'vice_luxury',
    name: 'Vice Luxury Autos',
    icon: 'fa-gem',
    logoUrl: '',
    color: '#ff4fe0',
    gameMode: 'both',
    description: 'Modern exotic supercars, luxury cabriolets and hyper-luxury hypercars.'
  },
  {
    id: 'sunshine_autos',
    name: 'Sunshine Autos',
    icon: 'fa-car-side',
    logoUrl: '',
    color: '#00cec9',
    gameMode: 'both',
    description: 'The legendary Vice City dealership: sports cars, vintage muscle and timeless classics.'
  },
  {
    id: 'ocean_drive_customs',
    name: 'Ocean Drive Customs',
    icon: 'fa-wrench',
    logoUrl: '',
    color: '#e84393',
    gameMode: 'both',
    description: 'Radical custom shop, hydraulic suspensions and street modifications in Ocean Beach.'
  },
  {
    id: 'everglades_marine',
    name: 'Everglades Marine & Off-Road',
    icon: 'fa-ship',
    logoUrl: '',
    color: '#00b894',
    gameMode: 'both',
    description: 'Swamp airboats, high-speed contraband watercraft and lifted 4x4 off-road pickups.'
  },
  {
    id: 'leonida_aviation',
    name: 'Leonida Aviation & Military',
    icon: 'fa-plane',
    logoUrl: '',
    color: '#6c5ce7',
    gameMode: 'both',
    description: 'Corporate executive jets, VIP helicopters and tactical transport aircraft in Leonida.'
  },
  {
    id: 'gta6_especiales',
    name: 'Leonida Special Vehicles',
    icon: 'fa-wand-magic-sparkles',
    logoUrl: '',
    color: '#fd79a8',
    gameMode: 'both',
    description: 'Unique event vehicles, co-op heist transports and prototype customs exclusive to Vice City.'
  }
];

/**
 * Concesionarios de GTA VI (Leonida / Vice City) en Español.
 */
export const GTA6_DEALERS_ES: DealerCategory[] = [
  {
    id: 'vice_luxury',
    name: 'Vice Luxury Autos',
    icon: 'fa-gem',
    logoUrl: '',
    color: '#ff4fe0',
    gameMode: 'both',
    description: 'Superdeportivos exóticos modernos, descapotables de alta gama y bólidos de hiperlujo.'
  },
  {
    id: 'sunshine_autos',
    name: 'Sunshine Autos',
    icon: 'fa-car-side',
    logoUrl: '',
    color: '#00cec9',
    gameMode: 'both',
    description: 'El concesionario legendario de Vice City: deportivos, muscle cars y clásicos de época.'
  },
  {
    id: 'ocean_drive_customs',
    name: 'Ocean Drive Customs',
    icon: 'fa-wrench',
    logoUrl: '',
    color: '#e84393',
    gameMode: 'both',
    description: 'Taller de personalización radical, suspensiones hidráulicas y modificaciones en Ocean Beach.'
  },
  {
    id: 'everglades_marine',
    name: 'Everglades Marine & Off-Road',
    icon: 'fa-ship',
    logoUrl: '',
    color: '#00b894',
    gameMode: 'both',
    description: 'Hidrodeslizadores de pantano, lanchas rápidas de contrabando y pickups todoterreno.'
  },
  {
    id: 'leonida_aviation',
    name: 'Leonida Aviation & Military',
    icon: 'fa-plane',
    logoUrl: '',
    color: '#6c5ce7',
    gameMode: 'both',
    description: 'Aeronaves de negocios, helicópteros ejecutivos y transportes tácticos de Leonida.'
  },
  {
    id: 'gta6_especiales',
    name: 'Vehículos Especiales de Leonida',
    icon: 'fa-wand-magic-sparkles',
    logoUrl: '',
    color: '#fd79a8',
    gameMode: 'both',
    description: 'Vehículos únicos de eventos, atracos cooperativos y prototipos exclusivos de Vice City.'
  }
];

export const GTA6_DEALERS: DealerCategory[] = GTA6_DEALERS_EN;

/**
 * Vehículos simulados por concesionario en GTA VI.
 */
export const GTA6_VEHICLES_BY_DEALER: { [dealerId: string]: GtaVehicle[] } = {
  vice_luxury: [
    { id: 'gta6_v1', name: 'Grotti Cheetah GTS', manufacturer: 'Grotti', class: 'Súper', category: 'super', price: 2450000, priceTrade: 1850000, priceFormatted: '$2,450,000', speed: 98, acceleration: 95, braking: 90, handling: 92, weaponized: false, dealership: 'vice_luxury', gameMode: 'both', imageUrl: '' },
    { id: 'gta6_v2', name: 'Pegassi Torero XO Vice', manufacturer: 'Pegassi', class: 'Súper', category: 'super', price: 2890000, priceTrade: 2150000, priceFormatted: '$2,890,000', speed: 99, acceleration: 97, braking: 88, handling: 94, weaponized: false, dealership: 'vice_luxury', gameMode: 'both', imageUrl: '' },
    { id: 'gta6_v3', name: 'Overflod Entity MT Cabrio', manufacturer: 'Overflod', class: 'Súper', category: 'super', price: 2350000, priceTrade: 1750000, priceFormatted: '$2,350,000', speed: 96, acceleration: 94, braking: 92, handling: 90, weaponized: false, dealership: 'vice_luxury', gameMode: 'both', imageUrl: '' },
    { id: 'gta6_v4', name: 'Pfister Comet S2 Cabriolet', manufacturer: 'Pfister', class: 'Deportivos', category: 'sports', price: 1790000, priceTrade: 1340000, priceFormatted: '$1,790,000', speed: 92, acceleration: 90, braking: 89, handling: 93, weaponized: false, dealership: 'vice_luxury', gameMode: 'both', imageUrl: '' }
  ],
  sunshine_autos: [
    { id: 'gta6_v5', name: 'Bravado Banshee 900R', manufacturer: 'Bravado', class: 'Deportivos Clásicos', category: 'sports_classics', price: 565000, priceTrade: 420000, priceFormatted: '$565,000', speed: 90, acceleration: 88, braking: 82, handling: 85, weaponized: false, dealership: 'sunshine_autos', gameMode: 'both', imageUrl: '' },
    { id: 'gta6_v6', name: 'Vapid Dominator FX', manufacturer: 'Vapid', class: 'Muscle', category: 'muscle', price: 720000, priceTrade: 540000, priceFormatted: '$720,000', speed: 87, acceleration: 89, braking: 78, handling: 80, weaponized: false, dealership: 'sunshine_autos', gameMode: 'both', imageUrl: '' },
    { id: 'gta6_v7', name: 'Albany Hermes Vice Edition', manufacturer: 'Albany', class: 'Muscle', category: 'muscle', price: 535000, priceTrade: 395000, priceFormatted: '$535,000', speed: 82, acceleration: 85, braking: 75, handling: 78, weaponized: false, dealership: 'sunshine_autos', gameMode: 'both', imageUrl: '' },
    { id: 'gta6_v8', name: 'Declasse Sabre Turbo Custom', manufacturer: 'Declasse', class: 'Muscle', category: 'muscle', price: 490000, priceTrade: 360000, priceFormatted: '$490,000', speed: 84, acceleration: 86, braking: 76, handling: 79, weaponized: false, dealership: 'sunshine_autos', gameMode: 'both', imageUrl: '' }
  ],
  ocean_drive_customs: [
    { id: 'gta6_v9', name: 'Voodoo Custom Lowrider', manufacturer: 'Declasse', class: 'Muscle', category: 'muscle', price: 420000, priceTrade: 315000, priceFormatted: '$420,000', speed: 78, acceleration: 80, braking: 72, handling: 82, weaponized: false, dealership: 'ocean_drive_customs', gameMode: 'both', imageUrl: '' },
    { id: 'gta6_v10', name: 'Karin Sultan RS Twin Turbo', manufacturer: 'Karin', class: 'Deportivos', category: 'sports', price: 795000, priceTrade: 595000, priceFormatted: '$795,000', speed: 91, acceleration: 93, braking: 88, handling: 91, weaponized: false, dealership: 'ocean_drive_customs', gameMode: 'both', imageUrl: '' },
    { id: 'gta6_v11', name: 'Dinka Jester RR Vice Drift', manufacturer: 'Dinka', class: 'Deportivos', category: 'sports', price: 1970000, priceTrade: 1470000, priceFormatted: '$1,970,000', speed: 93, acceleration: 91, braking: 89, handling: 95, weaponized: false, dealership: 'ocean_drive_customs', gameMode: 'both', imageUrl: '' }
  ],
  everglades_marine: [
    { id: 'gta6_v12', name: 'Swamp Airboat Everglades', manufacturer: 'Nagasaki', class: 'Barcos', category: 'boats', price: 185000, priceTrade: 135000, priceFormatted: '$185,000', speed: 75, acceleration: 85, braking: 60, handling: 88, weaponized: false, dealership: 'everglades_marine', gameMode: 'both', imageUrl: '' },
    { id: 'gta6_v13', name: 'Shitzu Tropic Speedboat', manufacturer: 'Shitzu', class: 'Barcos', category: 'boats', price: 420000, priceTrade: 310000, priceFormatted: '$420,000', speed: 88, acceleration: 82, braking: 70, handling: 84, weaponized: false, dealership: 'everglades_marine', gameMode: 'both', imageUrl: '' },
    { id: 'gta6_v14', name: 'Canis Kamacho 4x4 Everglades', manufacturer: 'Canis', class: 'Todoterrenos', category: 'offroad', price: 345000, priceTrade: 260000, priceFormatted: '$345,000', speed: 80, acceleration: 86, braking: 78, handling: 85, weaponized: false, dealership: 'everglades_marine', gameMode: 'both', imageUrl: '' }
  ],
  leonida_aviation: [
    { id: 'gta6_v15', name: 'Buckingham SuperVolito Carbon', manufacturer: 'Buckingham', class: 'Helicópteros', category: 'helicopters', price: 2110000, priceTrade: 1580000, priceFormatted: '$2,110,000', speed: 94, acceleration: 90, braking: 85, handling: 92, weaponized: false, dealership: 'leonida_aviation', gameMode: 'both', imageUrl: '' },
    { id: 'gta6_v16', name: 'Buckingham Nimbus Executive Jet', manufacturer: 'Buckingham', class: 'Aviones', category: 'planes', price: 1900000, priceTrade: 1420000, priceFormatted: '$1,900,000', speed: 97, acceleration: 88, braking: 80, handling: 86, weaponized: false, dealership: 'leonida_aviation', gameMode: 'both', imageUrl: '' }
  ],
  gta6_especiales: [
    { id: 'gta6_v17', name: 'HVY Nightshark Vice Enforcer', manufacturer: 'HVY', class: 'Militares', category: 'military', price: 1245000, priceTrade: 935000, priceFormatted: '$1,245,000', speed: 82, acceleration: 84, braking: 86, handling: 88, weaponized: true, dealership: 'gta6_especiales', gameMode: 'both', imageUrl: '' }
  ]
};

/**
 * Misiones de historia de GTA VI en Inglés.
 */
export const GTA6_STORY_MISSIONS_EN: GtaMission[] = [
  { id: 'gta6_m1', order: 1, title: 'Liquor Store Robbery', category: 'jason_lucia', character: 'Lucia', giver: 'Lucia Caminos', goldRequirements: ['Record Time: < 3:30', '10 Headshots', 'Clean Getaway (No Damage)'], description: 'Jason and Lucia hold up a liquor store in the outskirts of Port Gellhorn and evade the arriving state police patrol.', reward: '$12,500' },
  { id: 'gta6_m2', order: 2, title: 'Port Gellhorn Getaway', category: 'jason_lucia', character: 'Jason', giver: 'Jason Duval', goldRequirements: ['Accuracy > 75%', 'Lose 3-Star Wanted Level', 'No Medkits Used'], description: 'High-speed escape along the interstate highway dodging tactical roadblocks set up by Leonida State Police.', reward: '$18,000' },
  { id: 'gta6_m3', order: 3, title: 'Smuggling in the Keys', category: 'operations', character: 'Jason', giver: 'Captain Raúl', goldRequirements: ['Arrive at Dock on Time', 'Sink Pursuing Gunboats', 'Recover Cargo 100% Intact'], description: 'Nighttime maritime contraband run through the treacherous Leonida Keys during a tropical storm.', reward: '$35,000' },
  { id: 'gta6_m4', order: 4, title: 'Starfish Island Infiltration', category: 'vice_city', character: 'Lucia', giver: 'Lucia Caminos', goldRequirements: ['No Alarms Triggered', 'Crack Master Vault', 'Water Exfiltration'], description: 'Stealth raid on a cartel boss mansion on the ultra-luxury Starfish Island in Vice City.', reward: '$60,000' }
];

/**
 * Misiones de historia de GTA VI en Español.
 */
export const GTA6_STORY_MISSIONS_ES: GtaMission[] = [
  { id: 'gta6_m1', order: 1, title: 'El Golpe a la Licorería', category: 'jason_lucia', character: 'Lucia', giver: 'Lucia Caminos', goldRequirements: ['Tiempo récord: < 3:30', '10 tiros a la cabeza', 'Sin daños en la huida'], description: 'Jason y Lucia asaltan una licorería en las afueras de Port Gellhorn y escapan de la patrulla policial.', reward: '$12,500' },
  { id: 'gta6_m2', order: 2, title: 'Escape de Port Gellhorn', category: 'jason_lucia', character: 'Jason', giver: 'Jason Duval', goldRequirements: ['Precisión > 75%', 'Pierde 3 estrellas de búsqueda', 'Sin usar botiquines'], description: 'Huida a alta velocidad por la autopista interestatal esquivando bloqueos de la policía estatal.', reward: '$18,000' },
  { id: 'gta6_m3', order: 3, title: 'Contrabando en los Cayos', category: 'operations', character: 'Jason', giver: 'Capitán Raúl', goldRequirements: ['Llega a tiempo al muelle', 'Destruye las lanchas perseguidoras', 'Recupera el alijo intacto'], description: 'Transporte marítimo nocturno a través de los Cayos de Leonida bajo tormenta tropical.', reward: '$35,000' },
  { id: 'gta6_m4', order: 4, title: 'Infiltración en Starfish Island', category: 'vice_city', character: 'Lucia', giver: 'Lucia Caminos', goldRequirements: ['Sin activar alarmas', 'Roba la caja fuerte principal', 'Escape por agua'], description: 'Asalto sigiloso a una mansión de un magnate en la exclusiva isla de Starfish Island en Vice City.', reward: '$60,000' }
];

/**
 * Golpes de GTA VI en Inglés.
 */
export const GTA6_HEISTS_EN: GtaHeist[] = [
  {
    id: 'gta6_h1',
    order: 1,
    title: 'Vice City Central Bank Heist',
    titleEn: 'Vice City Central Bank Heist',
    category: 'classic',
    categoryLabel: 'Classic Heists',
    giver: 'Vice Syndicate',
    players: '2-4 Players',
    minLevel: 25,
    propertyRequired: 'Vice Beach Safehouse',
    setupCost: 50000,
    setupCostFormatted: '$50,000',
    potentialTake: { normal: '$3,500,000', hard: '$4,800,000', description: 'Gold Bullion & Foreign Currency' },
    target: 'Central Bank Vault',
    location: 'Vice City Financial District',
    description: 'Infiltration through ventilation shafts and thermite assault on the financial district primary vault.',
    thumbnail: '',
    badgeColor: '#ff4fe0',
    badgeIcon: 'fa-building-columns',
    eliteChallenges: ['Complete in under 10:30', 'Zero Hostage Casualties', 'No Team Deaths'],
    setupMissions: [
      { name: 'Security Blueprints', description: 'Financial tower server room hack' },
      { name: 'Thermite Drill & C4', description: 'Heavy industrial breaching equipment theft' },
      { name: 'Getaway Speedboats', description: 'Canal speedboats preparation and tuning' }
    ]
  },
  {
    id: 'gta6_h2',
    order: 2,
    title: 'Starfish Island Mansion Raid',
    titleEn: 'Starfish Island Mansion Raid',
    category: 'casino',
    categoryLabel: 'Elite Incursions',
    giver: 'Lucia & Contacts',
    players: '1-4 Players',
    minLevel: 30,
    propertyRequired: 'Operations Yacht',
    setupCost: 65000,
    setupCostFormatted: '$65,000',
    potentialTake: { normal: '$2,200,000', hard: '$3,100,000', description: 'Master Art Collection & Raw Diamonds' },
    target: 'Cartel Underground Vault',
    location: 'Starfish Island, Vice City',
    description: 'Theft of priceless fine art, jewels and bearer bonds from a heavily guarded luxury mansion in Starfish Island.',
    thumbnail: '',
    badgeColor: '#00cec9',
    badgeIcon: 'fa-gem',
    eliteChallenges: ['Complete without triggering alarms', 'Steal all 4 rare paintings', 'Clean boat exfiltration'],
    setupMissions: [
      { name: 'Catering Disguises', description: 'Infiltration with forged credentials' },
      { name: 'Coastal Radar Jammer', description: 'Disabling coast guard radar stations' }
    ]
  },
  {
    id: 'gta6_h3',
    order: 3,
    title: 'Everglades Smuggling Raid',
    titleEn: 'Everglades Smuggling Raid',
    category: 'raid',
    categoryLabel: 'Special Operations',
    giver: 'Jason Duval',
    players: '1-4 Players',
    minLevel: 15,
    propertyRequired: 'Covert Swamp Hangar',
    setupCost: 35000,
    setupCostFormatted: '$35,000',
    potentialTake: { normal: '$1,800,000', hard: '$2,500,000', description: 'High-Purity Contraband Crates' },
    target: 'Everglades Cargo Depot',
    location: 'Everglades National Park',
    description: 'Tactical assault on a clandestine hangar in the deep Leonida swamplands utilizing armed airboats.',
    thumbnail: '',
    badgeColor: '#00b894',
    badgeIcon: 'fa-boxes-stacked',
    eliteChallenges: ['Complete in under 8:00', 'Destroy all pursuit gunships', 'Cargo damage < 5%'],
    setupMissions: [
      { name: 'Tactical Airboats', description: 'Acquiring modified swamp combat airboats' },
      { name: 'Comm Array Blackout', description: 'Sabotaging the swamp microwave repeater tower' }
    ]
  }
];

/**
 * Golpes de GTA VI en Español.
 */
export const GTA6_HEISTS_ES: GtaHeist[] = [
  {
    id: 'gta6_h1',
    order: 1,
    title: 'Atraco al Banco Central de Vice City',
    titleEn: 'Vice City Central Bank Heist',
    category: 'classic',
    categoryLabel: 'Golpes Clásicos',
    giver: 'Vice Syndicate',
    players: '2-4 Jugadores',
    minLevel: 25,
    propertyRequired: 'Piso Franco de Vice Beach',
    setupCost: 50000,
    setupCostFormatted: '$50,000',
    potentialTake: { normal: '$3,500,000', hard: '$4,800,000', description: 'Lingotes de oro y moneda extranjera' },
    target: 'Cámara Acorazada del Banco Central',
    location: 'Distrito Financiero de Vice City',
    description: 'Infiltración por los conductos de ventilación y asalto a la cámara acorazada del distrito financiero.',
    thumbnail: '',
    badgeColor: '#ff4fe0',
    badgeIcon: 'fa-building-columns',
    eliteChallenges: ['Completar en menos de 10:30', 'Cero bajas de rehenes', 'Nadie cae en el equipo'],
    setupMissions: [
      { name: 'Planos de Seguridad', description: 'Hackeo de servidores en la torre financiera' },
      { name: 'Taladro Térmico y C4', description: 'Robo de equipamiento industrial pesado' },
      { name: 'Vehículos de Escape', description: 'Preparación de lanchas rápidas en el canal' }
    ]
  },
  {
    id: 'gta6_h2',
    order: 2,
    title: 'Asalto a la Mansión de Starfish Island',
    titleEn: 'Starfish Island Mansion Raid',
    category: 'casino',
    categoryLabel: 'Incursiones de Élite',
    giver: 'Lucia & Contactos',
    players: '1-4 Jugadores',
    minLevel: 30,
    propertyRequired: 'Yate de Operaciones',
    setupCost: 65000,
    setupCostFormatted: '$65,000',
    potentialTake: { normal: '$2,200,000', hard: '$3,100,000', description: 'Colección de arte y diamantes en bruto' },
    target: 'Caja Fuerte Subterránea del Cartel',
    location: 'Starfish Island, Vice City',
    description: 'Robo de obras de arte, joyas y alijos de dinero en una de las mansiones más protegidas de Vice City.',
    thumbnail: '',
    badgeColor: '#00cec9',
    badgeIcon: 'fa-gem',
    eliteChallenges: ['Completar sin activar alarmas', 'Roba las 4 pinturas raras', 'Escape limpio'],
    setupMissions: [
      { name: 'Disfraces del Catering', description: 'Infiltración con acreditaciones falsas' },
      { name: 'Inhibidor de Radar', description: 'Desactivación de radares costeros' }
    ]
  },
  {
    id: 'gta6_h3',
    order: 3,
    title: 'Operación Contrabando Everglades',
    titleEn: 'Everglades Smuggling Raid',
    category: 'raid',
    categoryLabel: 'Operaciones Especiales',
    giver: 'Jason Duval',
    players: '1-4 Jugadores',
    minLevel: 15,
    propertyRequired: 'Hangar Clandestino de Pantano',
    setupCost: 35000,
    setupCostFormatted: '$35,000',
    potentialTake: { normal: '$1,800,000', hard: '$2,500,000', description: 'Cargas de contrabando de alta pureza' },
    target: 'Depósito de Carga de los Everglades',
    location: 'Parque Nacional de los Everglades',
    description: 'Asalto a un hangar clandestino en medio de los pantanos de Leonida utilizando hidrodeslizadores.',
    thumbnail: '',
    badgeColor: '#00b894',
    badgeIcon: 'fa-boxes-stacked',
    eliteChallenges: ['Completar en menos de 8:00', 'Destruye todos los helicópteros de persecución', 'Daño al alijo < 5%'],
    setupMissions: [
      { name: 'Rápido Hidrodeslizador', description: 'Adquisición de transporte táctico de pantano' },
      { name: 'Bloqueo de Comunicaciones', description: 'Sabotaje a la antena repetidora' }
    ]
  }
];

/**
 * Misterios y leyendas de GTA VI en Inglés.
 */
export const GTA6_MYSTERIES_EN: GtaMystery[] = [
  {
    id: 'gta6_mys1',
    order: 1,
    title: 'Leonida Bermuda Triangle',
    titleEn: 'Leonida Bermuda Triangle',
    category: 'paranormal',
    categoryLabel: 'Paranormal',
    location: 'Atlantic Ocean (Southeast of Vice City)',
    zone: 'Leonida Waters',
    position: { x: 3450, y: -4120, z: 0 },
    description: 'Magnetic anomalies, spinning compasses, and instrument blackouts when navigating southeast of the Keys.',
    lore: 'Since colonial times, sailors and seaplane pilots have reported lost time and glowing underwater phenomena around Leonida maritime coordinates.',
    thumbnail: '',
    badgeColor: '#ff4fe0',
    badgeIcon: 'fa-compass',
    badgeSymbol: '⚠️',
    gameMode: 'both'
  },
  {
    id: 'gta6_mys2',
    order: 2,
    title: 'Everglades Swamp Creature',
    titleEn: 'Everglades Swamp Creature',
    category: 'paranormal',
    categoryLabel: 'Cryptozoology',
    location: 'Everglades (Leonida)',
    zone: 'Everglades National Park',
    position: { x: -2100, y: 1540, z: 5 },
    description: 'Sightings of an imposing bipedal creature emerging from the thick night fog in the Everglades National Park.',
    lore: 'Local alligator hunters whisper stories of an elusive 8-foot beast that stalks the most inaccessible swamps and bayous.',
    thumbnail: '',
    badgeColor: '#00b894',
    badgeIcon: 'fa-paw',
    badgeSymbol: '🐊',
    gameMode: 'both'
  },
  {
    id: 'gta6_mys3',
    order: 3,
    title: 'Sunken Spanish Galleon',
    titleEn: 'Sunken Spanish Galleon',
    category: 'easter_egg',
    categoryLabel: 'Treasures & Shipwrecks',
    location: 'Coral Reef (Leonida Keys)',
    zone: 'Leonida Keys',
    position: { x: 1850, y: -5600, z: -35 },
    description: 'Submerged 17th-century galleon wreck containing gold doubloons, pirate chests, and antique naval cannons.',
    lore: 'The royal galleon "Nuestra Señora de la Victoria" sank during a 1684 hurricane carrying Spanish crown treasures.',
    thumbnail: '',
    badgeColor: '#00cec9',
    badgeIcon: 'fa-anchor',
    badgeSymbol: '⚓',
    gameMode: 'both'
  }
];

/**
 * Misterios y leyendas de GTA VI en Español.
 */
export const GTA6_MYSTERIES_ES: GtaMystery[] = [
  {
    id: 'gta6_mys1',
    order: 1,
    title: 'El Triángulo de las Bermudas de Leonida',
    titleEn: 'Leonida Bermuda Triangle',
    category: 'paranormal',
    categoryLabel: 'Paranormal',
    location: 'Océano Atlántico (Sureste de Vice City)',
    zone: 'Leonida Waters',
    position: { x: 3450, y: -4120, z: 0 },
    description: 'Anomalías magnéticas, brújulas descontroladas e instrumentos que fallan al navegar por el sureste de los Cayos.',
    lore: 'Desde tiempos coloniales, marineros y pilotos de aerotaxis afirman haber perdido la noción del tiempo y presenciado luces subacuáticas fluorescentes en las coordenadas marítimas de Leonida.',
    thumbnail: '',
    badgeColor: '#ff4fe0',
    badgeIcon: 'fa-compass',
    badgeSymbol: '⚠️',
    gameMode: 'both'
  },
  {
    id: 'gta6_mys2',
    order: 2,
    title: 'El Monstruo de los Pantanos de Leonida',
    titleEn: 'Everglades Swamp Creature',
    category: 'paranormal',
    categoryLabel: 'Criptozoología',
    location: 'Everglades (Leonida)',
    zone: 'Everglades National Park',
    position: { x: -2100, y: 1540, z: 5 },
    description: 'Avistamientos de una criatura descomunal entre la niebla nocturna del Parque Nacional de los Everglades.',
    lore: 'Mitos locales de cazadores de caimanes describen una silueta bípeda de más de 2.5 metros que habita en las ciénagas más profundas e inaccesibles.',
    thumbnail: '',
    badgeColor: '#00b894',
    badgeIcon: 'fa-paw',
    badgeSymbol: '🐊',
    gameMode: 'both'
  },
  {
    id: 'gta6_mys3',
    order: 3,
    title: 'El Galeón Español Hundido',
    titleEn: 'Sunken Spanish Galleon',
    category: 'easter_egg',
    categoryLabel: 'Tesoros y Naufragios',
    location: 'Arrecife de Coral (Leonida Keys)',
    zone: 'Leonida Keys',
    position: { x: 1850, y: -5600, z: -35 },
    description: 'Pecio sumergido de un navío del siglo XVII con lingotes de oro y cofres piratas en el lecho marino.',
    lore: 'El navío "Nuestra Señora de la Victoria" naufragó durante un huracán en 1684 cargado con tributos de la corona. Sus restos aún guardan cofres sellados bajo los arrecifes.',
    thumbnail: '',
    badgeColor: '#00cec9',
    badgeIcon: 'fa-anchor',
    badgeSymbol: '⚓',
    gameMode: 'both'
  }
];

/**
 * Armas de GTA VI en Inglés.
 */
export const GTA6_WEAPONS_EN: GtaWeapon[] = [
  {
    id: 'gta6_w1',
    order: 1,
    name: 'Tactical 9mm Pistol',
    nameEn: 'Tactical 9mm Pistol',
    category: 'pistols',
    categoryLabel: 'Pistols',
    manufacturer: 'Hawk & Little',
    price: 1200,
    priceFormatted: '$1,200',
    rankUnlock: 1,
    damage: 4.2,
    fireRate: 5.0,
    accuracy: 6.5,
    range: 4.0,
    description: 'Standard issue sidearm with lightened slide and suppressor threading support.',
    icon: 'fa-gun',
    badgeColor: '#ff4fe0',
    gameMode: 'both'
  },
  {
    id: 'gta6_w2',
    order: 2,
    name: 'Vice Micro SMG',
    nameEn: 'Vice Micro SMG',
    category: 'smgs',
    categoryLabel: 'SMGs',
    manufacturer: 'Shrewsbury',
    price: 4800,
    priceFormatted: '$4,800',
    rankUnlock: 5,
    damage: 3.8,
    fireRate: 8.5,
    accuracy: 5.5,
    range: 4.5,
    description: 'Compact high fire rate submachine gun optimized for drive-bys and vehicle combat.',
    icon: 'fa-gun',
    badgeColor: '#00cec9',
    gameMode: 'both'
  },
  {
    id: 'gta6_w3',
    order: 3,
    name: 'Leonida Assault Carbine',
    nameEn: 'Leonida Assault Carbine',
    category: 'rifles',
    categoryLabel: 'Rifles',
    manufacturer: 'Vom Feuer',
    price: 14500,
    priceFormatted: '$14,500',
    rankUnlock: 12,
    damage: 6.2,
    fireRate: 6.5,
    accuracy: 7.5,
    range: 7.0,
    description: 'Military-grade assault rifle with collapsible stock and reflex optic for mid-to-long range combat.',
    icon: 'fa-gun',
    badgeColor: '#fd79a8',
    gameMode: 'both'
  },
  {
    id: 'gta6_w4',
    order: 4,
    name: 'Marine Pump Shotgun',
    nameEn: 'Marine Pump Shotgun',
    category: 'shotguns',
    categoryLabel: 'Shotguns',
    manufacturer: 'Buckingham Defense',
    price: 3200,
    priceFormatted: '$3,200',
    rankUnlock: 8,
    damage: 8.5,
    fireRate: 2.5,
    accuracy: 3.5,
    range: 2.5,
    description: 'Corrosion-resistant shotgun engineered for saltwater environments with massive close-range stopping power.',
    icon: 'fa-gun',
    badgeColor: '#00b894',
    gameMode: 'both'
  },
  {
    id: 'gta6_w5',
    order: 5,
    name: 'Heavy .50 Cal Sniper Rifle',
    nameEn: 'Heavy Sniper .50 Cal',
    category: 'snipers',
    categoryLabel: 'Snipers',
    manufacturer: 'Ammu-Nation Custom',
    price: 32000,
    priceFormatted: '$32,000',
    rankUnlock: 35,
    damage: 9.8,
    fireRate: 2.0,
    accuracy: 9.5,
    range: 9.8,
    description: 'Extreme-range anti-materiel rifle capable of disabling vehicle engine blocks with armor-piercing rounds.',
    icon: 'fa-crosshairs',
    badgeColor: '#a29bfe',
    gameMode: 'both'
  }
];

/**
 * Armas de GTA VI en Español.
 */
export const GTA6_WEAPONS_ES: GtaWeapon[] = [
  {
    id: 'gta6_w1',
    order: 1,
    name: 'Pistola Táctica 9mm',
    nameEn: 'Tactical 9mm Pistol',
    category: 'pistols',
    categoryLabel: 'Pistolas',
    manufacturer: 'Hawk & Little',
    price: 1200,
    priceFormatted: '$1,200',
    rankUnlock: 1,
    damage: 4.2,
    fireRate: 5.0,
    accuracy: 6.5,
    range: 4.0,
    description: 'Arma de mano reglamentaria con corredera aligerada y supresor compatible.',
    icon: 'fa-gun',
    badgeColor: '#ff4fe0',
    gameMode: 'both'
  },
  {
    id: 'gta6_w2',
    order: 2,
    name: 'Micro Subfusil Vice',
    nameEn: 'Vice Micro SMG',
    category: 'smgs',
    categoryLabel: 'Subfusiles',
    manufacturer: 'Shrewsbury',
    price: 4800,
    priceFormatted: '$4,800',
    rankUnlock: 5,
    damage: 3.8,
    fireRate: 8.5,
    accuracy: 5.5,
    range: 4.5,
    description: 'Subfusil compacto de altísima cadencia ideal para tiroteos desde vehículos.',
    icon: 'fa-gun',
    badgeColor: '#00cec9',
    gameMode: 'both'
  },
  {
    id: 'gta6_w3',
    order: 3,
    name: 'Fusil de Asalto Leonida Carbine',
    nameEn: 'Leonida Assault Carbine',
    category: 'rifles',
    categoryLabel: 'Fusiles',
    manufacturer: 'Vom Feuer',
    price: 14500,
    priceFormatted: '$14,500',
    rankUnlock: 12,
    damage: 6.2,
    fireRate: 6.5,
    accuracy: 7.5,
    range: 7.0,
    description: 'Fusil militar de asalto con culata retráctil y mira réflex para combates a media y larga distancia.',
    icon: 'fa-gun',
    badgeColor: '#fd79a8',
    gameMode: 'both'
  },
  {
    id: 'gta6_w4',
    order: 4,
    name: 'Escopeta Corredera Marina',
    nameEn: 'Marine Pump Shotgun',
    category: 'shotguns',
    categoryLabel: 'Escopetas',
    manufacturer: 'Buckingham Defense',
    price: 3200,
    priceFormatted: '$3,200',
    rankUnlock: 8,
    damage: 8.5,
    fireRate: 2.5,
    accuracy: 3.5,
    range: 2.5,
    description: 'Escopeta resistente a la corrosión marina con devastadora potencia a corta distancia.',
    icon: 'fa-gun',
    badgeColor: '#00b894',
    gameMode: 'both'
  },
  {
    id: 'gta6_w5',
    order: 5,
    name: 'Fusil de Francotirador Pesado .50',
    nameEn: 'Heavy Sniper .50 Cal',
    category: 'snipers',
    categoryLabel: 'Francotirador',
    manufacturer: 'Ammu-Nation Custom',
    price: 32000,
    priceFormatted: '$32,000',
    rankUnlock: 35,
    damage: 9.8,
    fireRate: 2.0,
    accuracy: 9.5,
    range: 9.8,
    description: 'Rifle antimaterial de largo alcance capaz de inutilizar bloques de motor de vehículos.',
    icon: 'fa-crosshairs',
    badgeColor: '#a29bfe',
    gameMode: 'both'
  }
];
