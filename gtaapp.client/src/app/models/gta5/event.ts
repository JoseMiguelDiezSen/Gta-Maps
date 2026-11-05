export interface GtaEventItem {
  id: string;
  title: string;
  category: 'halloween' | 'navidad';
  subcategory: string;
  description: string;
  reward?: string;
  period?: string;
  badgeIcon?: string;
  badgeColor?: string;
  thumbnail?: string;
  details?: string[];
  position?: { x: number; y: number; z?: number };
}

export interface GtaEventSubcategory {
  id: string;
  title: string;
  icon: string;
  color: string;
  description: string;
  items: GtaEventItem[];
}

export interface GtaEventCategory {
  id: 'halloween' | 'navidad';
  title: string;
  icon: string;
  color: string;
  badge: string;
  description: string;
  subcategories: GtaEventSubcategory[];
}

export interface GtaSlasherZoneCircle {
  x: number;
  y: number;
  radius: number;
}

export interface GtaSlasherInfo {
  id: string;
  name: string;
  alias: string;
  color: string;
  weapon: string;
  area: string;
  time: string;
  icon: string;
  image: string;
  zones: GtaSlasherZoneCircle[];
}

export const GTA_SLASHERS_LIST: GtaSlasherInfo[] = [
  {
    id: 'sack',
    name: 'El Asesino del Saco',
    alias: 'Hombre del Saco',
    color: '#9ca3af',
    weapon: 'Machete',
    area: 'Paleto Bay, bosques del norte y Monte Chiliad',
    time: '21:00 - 05:00',
    icon: 'fa-skull',
    image: 'assets/images/gta5/mapa/marcadores-mapa/activities/slashers/sack.png',
    zones: [
      { x: 0, y: 5600, radius: 2700 }
    ]
  },
  {
    id: 'clown',
    name: 'El Payaso',
    alias: 'Payaso Asesino',
    color: '#a855f7',
    weapon: 'Navaja automática',
    area: 'Todo el núcleo urbano de Los Santos',
    time: '21:00 - 05:00',
    icon: 'fa-mask',
    image: 'assets/images/gta5/mapa/marcadores-mapa/activities/slashers/clown.png',
    zones: [
      { x: -150, y: -1600, radius: 2400 }
    ]
  },
  {
    id: 'psycho',
    name: 'El Psicópata',
    alias: 'El Enmascarado',
    color: '#ec4899',
    weapon: 'Bate de béisbol',
    area: 'Vinewood Hills, Tongva Hills y Banham Canyon',
    time: '21:00 - 05:00',
    icon: 'fa-baseball-bat-ball',
    image: 'assets/images/gta5/mapa/marcadores-mapa/activities/slashers/psycho.png',
    zones: [
      { x: -1900, y: -200, radius: 950 },
      { x: -600, y: 600, radius: 1050 },
      { x: -1200, y: -800, radius: 650 },
      { x: -400, y: -600, radius: 600 }
    ]
  },
  {
    id: 'driver',
    name: 'El Conductor',
    alias: 'Piloto Asesino',
    color: '#f97316',
    weapon: 'Llave grifa',
    area: 'Circuito Redwood Lights y Puerto de Los Santos',
    time: '21:00 - 05:00',
    icon: 'fa-wrench',
    image: 'assets/images/gta5/mapa/marcadores-mapa/activities/slashers/driver.png',
    zones: [
      { x: 950, y: 2300, radius: 450 },
      { x: -350, y: -2150, radius: 550 }
    ]
  }
];

export interface GtaGhostInfo {
  id: string;
  order: number;
  name: string;
  location: string;
  startHour: number;
  endHour: number;
  timeWindow: string;
  x: number;
  y: number;
  z?: number;
  image?: string;
  description: string;
}

export const GTA_GHOSTS_LIST: GtaGhostInfo[] = [
  {
    id: 'ghost-paleto',
    order: 1,
    name: 'Fantasma de Paleto Bay',
    location: 'Procopio Drive, cerca de Beeker\'s Garage',
    startHour: 20,
    endHour: 21,
    timeWindow: '20:00 - 21:00',
    x: 63.8,
    y: 6664.9,
    z: 32.3,
    description: 'Casa deteriorada en Procopio Drive. Puede aparecer en la ventana del ático o en la construcción trasera.'
  },
  {
    id: 'ghost-strawberry',
    order: 2,
    name: 'Fantasma de Strawberry',
    location: 'Bajo el paso elevado, al norte de Vanilla Unicorn',
    startHour: 21,
    endHour: 22,
    timeWindow: '21:00 - 22:00',
    x: 122.8,
    y: -1180.9,
    z: 31.2,
    description: 'Bajo el paso elevado de la autopista. Revisar la pared con grafitis y el refugio de lona.'
  },
  {
    id: 'ghost-grapeseed',
    order: 3,
    name: 'Fantasma de Grapeseed',
    location: 'Granero al norte de McKenzie Field',
    startHour: 22,
    endHour: 23,
    timeWindow: '22:00 - 23:00',
    x: 1907.8,
    y: 4931.9,
    z: 55.5,
    description: 'Granero en la zona superior del edificio. Revisar ambos extremos del pajar.'
  },
  {
    id: 'ghost-miriam-turner',
    order: 4,
    name: 'Fantasma de Miriam Turner Overpass',
    location: 'Pilar del puente colgante hacia Elysian Island',
    startHour: 23,
    endHour: 0,
    timeWindow: '23:00 - 00:00',
    x: -550.6,
    y: -2238.8,
    z: 122.8,
    description: 'En lo alto de la torre del puente colgante que cruza hacia Elysian Island / Puerto.'
  },
  {
    id: 'ghost-lighthouse',
    order: 5,
    name: 'Fantasma del Faro de El Gordo',
    location: 'Isla del faro, al este de Monte Gordo',
    startHour: 1,
    endHour: 2,
    timeWindow: '01:00 - 02:00',
    x: 3428.9,
    y: 5175.5,
    z: 36.4,
    description: 'En la isla del faro. Puede aparecer en la plataforma inferior o en la parte superior del faro.'
  },
  {
    id: 'ghost-slaughterhouse',
    order: 6,
    name: 'Fantasma de Raven Slaughterhouse',
    location: 'Cypress Flats, detrás del almacén Raven',
    startHour: 2,
    endHour: 3,
    timeWindow: '02:00 - 03:00',
    x: 1006.6,
    y: -2167.5,
    z: 34.7,
    description: 'Zona industrial de Cypress Flats. Revisar la estructura ferroviaria y el tejado del matadero.'
  },
  {
    id: 'ghost-burned-house',
    order: 7,
    name: 'Fantasma de Casa Incendiada',
    location: 'Joshua Road, cerca del Río Zancudo / Harmony',
    startHour: 3,
    endHour: 4,
    timeWindow: '03:00 - 04:00',
    x: 162.7,
    y: 3132.7,
    z: 44.2,
    description: 'Casa abandonada calcinada junto a Joshua Road. Revisar el porche y la parte trasera.'
  },
  {
    id: 'ghost-little-seoul',
    order: 8,
    name: 'Fantasma de Iglesia de Little Seoul',
    location: 'Campanario de la Iglesia de Little Seoul',
    startHour: 4,
    endHour: 5,
    timeWindow: '04:00 - 05:00',
    x: -765.8,
    y: -692.7,
    z: 71.6,
    description: 'En lo alto del campanario de la iglesia. Revisar la parte superior de la torre.'
  },
  {
    id: 'ghost-twohoots',
    order: 9,
    name: 'Fantasma de Two Hoots Falls',
    location: 'Cascada de Two Hoots Falls, Tongva Hills',
    startHour: 5,
    endHour: 6,
    timeWindow: '05:00 - 06:00',
    x: -1648.2,
    y: 2082.6,
    z: 88.5,
    description: 'Cascada en Tongva Hills. Buscar junto a la caída de agua y en los márgenes de roca.'
  },
  {
    id: 'ghost-devin-weston',
    order: 10,
    name: 'Fantasma de Devin Weston',
    location: 'Acantilado de Paleto Cove',
    startHour: 0,
    endHour: 1,
    timeWindow: '00:00 - 01:00 (Requiere los 9 anteriores)',
    x: -1617.0,
    y: 5173.0,
    z: 8.1,
    description: 'El empresario de GTA V aparece flotando frente al acantilado de Paleto Cove.'
  }
];

export interface GtaYetiClue {
  id: string;
  order: number;
  name: string;
  description: string;
  x: number;
  y: number;
  z?: number;
  icon?: string;
  image?: string;
}

export const GTA_YETI_CLUES_LIST: GtaYetiClue[] = [
  {
    id: 'yeti-car-wreck',
    order: 1,
    name: 'Vehículo accidentado',
    description: 'Coche volcado y aplastado debajo del puente en el lecho del río.',
    x: -1573,
    y: 4467,
    z: 12,
    icon: 'fa-car-burst'
  },
  {
    id: 'yeti-body-parts',
    order: 2,
    name: 'Restos humanos mutilados',
    description: 'Extremidades y restos desmembrados junto a las rocas de la orilla.',
    x: -1685,
    y: 4492,
    z: 15,
    icon: 'fa-skull'
  },
  {
    id: 'yeti-bloodied-tent',
    order: 3,
    name: 'Tienda de campaña ensangrentada',
    description: 'Campamento destrozado y cubierto de sangre en la ladera norte.',
    x: -1524,
    y: 4578,
    z: 36,
    icon: 'fa-campground'
  },
  {
    id: 'yeti-ripped-shirt',
    order: 4,
    name: 'Camisa desgarrada',
    description: 'Ropa ensangrentada colgando de la maleza en el sendero.',
    x: -1452,
    y: 4504,
    z: 32,
    icon: 'fa-shirt'
  },
  {
    id: 'yeti-dead-deer',
    order: 5,
    name: 'Ciervo destripado',
    description: 'Cadáver animal mutilado en la orilla sur bajo el acantilado.',
    x: -1560,
    y: 4380,
    z: 16,
    icon: 'fa-bone'
  }
];

export const GTA_YETI_ZONE = {
  x: -1560,
  y: 4480,
  radius: 280,
  timeWindow: '21:00 - 06:00'
};

export interface GtaSnowmanInfo {
  id: string;
  order: number;
  name: string;
  zone: string;
  description: string;
  x: number;
  y: number;
  z?: number;
}

export const GTA_SNOWMEN_LIST: GtaSnowmanInfo[] = [
  {
    id: 'snowman-01',
    order: 1,
    name: '12 Sustancia Road',
    zone: 'El Burro Heights',
    description: 'En el patio delantero de la vivienda en 12 Sustancia Road.',
    x: 1341.5,
    y: -1586.9,
    z: 50.0
  },
  {
    id: 'snowman-02',
    order: 2,
    name: 'East Mirror Drive',
    zone: 'Mirror Park',
    description: 'Frente a una de las residencias familiares en East Mirror Drive.',
    x: 1052.0,
    y: -432.0,
    z: 66.0
  },
  {
    id: 'snowman-03',
    order: 3,
    name: 'Broker Park',
    zone: 'East Vinewood',
    description: 'Junto a la fuente central del parque recreativo Broker Park.',
    x: 645.0,
    y: 162.0,
    z: 92.0
  },
  {
    id: 'snowman-04',
    order: 4,
    name: 'Spanish Avenue',
    zone: 'Hawick',
    description: 'En el callejón ajardinado entre dos viviendas residenciales.',
    x: 322.0,
    y: -212.0,
    z: 54.0
  },
  {
    id: 'snowman-05',
    order: 5,
    name: 'Cubo Rojo de Legion Square',
    zone: 'Downtown Los Santos',
    description: 'Junto a la escultura cúbica roja en la plaza central de Legion Square.',
    x: 215.0,
    y: -930.0,
    z: 30.0
  },
  {
    id: 'snowman-06',
    order: 6,
    name: 'BJ Smith Recreational Center',
    zone: 'Chamberlain Hills',
    description: 'Junto a la rampa de skate half-pipe del polideportivo.',
    x: -215.0,
    y: -1680.0,
    z: 34.0
  },
  {
    id: 'snowman-07',
    order: 7,
    name: 'Goma Street',
    zone: 'Vespucci Canals',
    description: 'Bajo la sombra de una palmera junto al paseo peatonal de Goma Street.',
    x: -1085.0,
    y: -1145.0,
    z: 2.0
  },
  {
    id: 'snowman-08',
    order: 8,
    name: 'Decker Park',
    zone: 'Vespucci Canals',
    description: 'Sobre la superficie de la rampa de skate half-pipe de Decker Park.',
    x: -1005.0,
    y: -1365.0,
    z: 5.0
  },
  {
    id: 'snowman-09',
    order: 9,
    name: 'Mansión De Santa',
    zone: 'Rockford Hills',
    description: 'En el jardín delantero de la mansión familiar de Michael en Portola Drive.',
    x: -813.0,
    y: 178.0,
    z: 72.0
  },
  {
    id: 'snowman-10',
    order: 10,
    name: 'Parque Canino de Vinewood',
    zone: 'Vinewood Hills',
    description: 'En la zona verde vallada del parque de adiestramiento canino.',
    x: -568.0,
    y: 468.0,
    z: 104.0
  },
  {
    id: 'snowman-11',
    order: 11,
    name: 'Observatorio Galileo',
    zone: 'Vinewood Hills',
    description: 'En la terraza mirador del ala este del Observatorio Galileo.',
    x: -438.0,
    y: 1106.0,
    z: 326.0
  },
  {
    id: 'snowman-12',
    order: 12,
    name: 'North Rockford Drive',
    zone: 'Vinewood Hills',
    description: 'Frente a la entrada ajardinada de una villa en North Rockford Drive.',
    x: -910.0,
    y: 605.0,
    z: 142.0
  },
  {
    id: 'snowman-13',
    order: 13,
    name: 'Great Ocean Highway (Banham Canyon)',
    zone: 'Banham Canyon',
    description: 'En el patio trasero de una residencia sobre los acantilados de la autopista.',
    x: -2165.0,
    y: -412.0,
    z: 13.0
  },
  {
    id: 'snowman-14',
    order: 14,
    name: 'Banham Canyon Drive',
    zone: 'Banham Canyon',
    description: 'En la parte trasera de una casa de madera en la ladera del cañón.',
    x: -1855.0,
    y: -352.0,
    z: 49.0
  },
  {
    id: 'snowman-15',
    order: 15,
    name: 'Cruce Tongva Drive y Zancudo Road',
    zone: 'Tongva Valley',
    description: 'En la bifurcación de caminos entre Tongva Drive y Zancudo Road.',
    x: -1452.0,
    y: 888.0,
    z: 182.0
  },
  {
    id: 'snowman-16',
    order: 16,
    name: 'Joshua Road',
    zone: 'Desierto de Grand Senora',
    description: 'En la entrada delantera de una casa rústica a lo largo de Joshua Road.',
    x: 672.0,
    y: 2695.0,
    z: 41.0
  },
  {
    id: 'snowman-17',
    order: 17,
    name: 'Cherry Pie Farm',
    zone: 'Desierto de Grand Senora',
    description: 'Frente a una edificación rural junto a los campos de Cherry Pie Farm.',
    x: 2435.0,
    y: 4975.0,
    z: 46.0
  },
  {
    id: 'snowman-18',
    order: 18,
    name: 'Puesto de Martin Madrazo',
    zone: 'Desierto de Grand Senora',
    description: 'Frente a un edificio en ruinas del puesto oculto del Cartel Madrazo.',
    x: 1395.0,
    y: 3613.0,
    z: 38.0
  },
  {
    id: 'snowman-19',
    order: 19,
    name: 'Parque de Caravanas Senora',
    zone: 'RON Alternates Wind Farm',
    description: 'Delante de un remolque en el campamento residencial junto al parque eólico.',
    x: 2355.0,
    y: 2582.0,
    z: 47.0
  },
  {
    id: 'snowman-20',
    order: 20,
    name: 'Remolque de Trevor Philips',
    zone: 'Sandy Shores',
    description: 'A escasos metros del remolque de Trevor en Zancudo Avenue.',
    x: 1974.8,
    y: 3819.3,
    z: 33.4
  },
  {
    id: 'snowman-21',
    order: 21,
    name: 'Calle Principal de Grapeseed',
    zone: 'Grapeseed',
    description: 'Frente a una vivienda agrícola en Grapeseed Main Street.',
    x: 1715.0,
    y: 4805.0,
    z: 42.0
  },
  {
    id: 'snowman-22',
    order: 22,
    name: 'Casa de Ursula (Faro de El Gordo)',
    zone: 'Monte Gordo',
    description: 'En el porche de la cabaña aislada de Ursula en el sendero del faro.',
    x: 3345.0,
    y: 5142.0,
    z: 18.0
  },
  {
    id: 'snowman-23',
    order: 23,
    name: 'Restaurante Up-n-Atom',
    zone: 'Procopio Beach',
    description: 'Junto al gran letrero publicitario del Up-n-Atom Diner en la costa norte.',
    x: 79.3,
    y: 6340.0,
    z: 31.0
  },
  {
    id: 'snowman-24',
    order: 24,
    name: 'Paleto Boulevard',
    zone: 'Paleto Bay',
    description: 'En el patio trasero de una vivienda residencial a lo largo de Paleto Boulevard.',
    x: -382.0,
    y: 6172.0,
    z: 31.0
  },
  {
    id: 'snowman-25',
    order: 25,
    name: 'Muelle Sonar Collections',
    zone: 'Paleto Cove',
    description: 'Al este de las instalaciones del muelle de búsqueda submarina junto a la autopista.',
    x: -1015.0,
    y: 5320.0,
    z: 44.0
  }
];

export const GTA_SLASHERS_LIST_EN: GtaSlasherInfo[] = [
  {
    id: 'sack',
    name: 'The Sack Slasher',
    alias: 'Sackhead',
    color: '#9ca3af',
    weapon: 'Machete',
    area: 'Paleto Bay, Northern Forests and Mount Chiliad',
    time: '21:00 - 05:00',
    icon: 'fa-skull',
    image: 'assets/images/gta5/mapa/marcadores-mapa/activities/slashers/sack.png',
    zones: [
      { x: 0, y: 5600, radius: 2700 }
    ]
  },
  {
    id: 'clown',
    name: 'The Clown',
    alias: 'Killer Clown',
    color: '#a855f7',
    weapon: 'Switchblade',
    area: 'Entire urban core of Los Santos',
    time: '21:00 - 05:00',
    icon: 'fa-mask',
    image: 'assets/images/gta5/mapa/marcadores-mapa/activities/slashers/clown.png',
    zones: [
      { x: -150, y: -1600, radius: 2400 }
    ]
  },
  {
    id: 'psycho',
    name: 'The Psycho',
    alias: 'The Masked Man',
    color: '#ec4899',
    weapon: 'Baseball Bat',
    area: 'Vinewood Hills, Tongva Hills and Banham Canyon',
    time: '21:00 - 05:00',
    icon: 'fa-baseball-bat-ball',
    image: 'assets/images/gta5/mapa/marcadores-mapa/activities/slashers/psycho.png',
    zones: [
      { x: -1900, y: -200, radius: 950 },
      { x: -600, y: 600, radius: 1050 },
      { x: -1200, y: -800, radius: 650 },
      { x: -400, y: -600, radius: 600 }
    ]
  },
  {
    id: 'driver',
    name: 'The Driver',
    alias: 'Phantom Driver',
    color: '#f97316',
    weapon: 'Pipe Wrench',
    area: 'Redwood Lights Track and Port of Los Santos',
    time: '21:00 - 05:00',
    icon: 'fa-wrench',
    image: 'assets/images/gta5/mapa/marcadores-mapa/activities/slashers/driver.png',
    zones: [
      { x: 950, y: 2300, radius: 450 },
      { x: -350, y: -2150, radius: 550 }
    ]
  }
];

export const GTA_GHOSTS_LIST_EN: GtaGhostInfo[] = [
  {
    id: 'ghost-paleto',
    order: 1,
    name: 'Paleto Bay Ghost',
    location: 'Procopio Drive, near Beeker\'s Garage',
    startHour: 20,
    endHour: 21,
    timeWindow: '20:00 - 21:00',
    x: 63.8,
    y: 6664.9,
    z: 32.3,
    description: 'Run-down house on Procopio Drive. May appear in the attic window or at the back structure.'
  },
  {
    id: 'ghost-strawberry',
    order: 2,
    name: 'Strawberry Ghost',
    location: 'Under the overpass, north of Vanilla Unicorn',
    startHour: 21,
    endHour: 22,
    timeWindow: '21:00 - 22:00',
    x: 122.8,
    y: -1180.9,
    z: 31.2,
    description: 'Underneath the freeway overpass. Check the graffiti wall and the tarp shelter.'
  },
  {
    id: 'ghost-grapeseed',
    order: 3,
    name: 'Grapeseed Ghost',
    location: 'Barn north of McKenzie Field',
    startHour: 22,
    endHour: 23,
    timeWindow: '22:00 - 23:00',
    x: 1907.8,
    y: 4931.9,
    z: 55.5,
    description: 'Upper loft of the barn. Check both ends of the hayloft.'
  },
  {
    id: 'ghost-miriam-turner',
    order: 4,
    name: 'Miriam Turner Overpass Ghost',
    location: 'Suspension bridge tower toward Elysian Island',
    startHour: 23,
    endHour: 0,
    timeWindow: '23:00 - 00:00',
    x: -550.6,
    y: -2238.8,
    z: 122.8,
    description: 'At the top of the suspension bridge tower crossing toward Elysian Island / Port.'
  },
  {
    id: 'ghost-lighthouse',
    order: 5,
    name: 'El Gordo Lighthouse Ghost',
    location: 'Lighthouse island, east of Mount Gordo',
    startHour: 1,
    endHour: 2,
    timeWindow: '01:00 - 02:00',
    x: 3428.9,
    y: 5175.5,
    z: 36.4,
    description: 'On the lighthouse island. May appear on the lower platform or at the top of the lighthouse.'
  },
  {
    id: 'ghost-slaughterhouse',
    order: 6,
    name: 'Raven Slaughterhouse Ghost',
    location: 'Cypress Flats, behind the Raven warehouse',
    startHour: 2,
    endHour: 3,
    timeWindow: '02:00 - 03:00',
    x: 1006.6,
    y: -2167.5,
    z: 34.7,
    description: 'Cypress Flats industrial area. Check the railway structure and the slaughterhouse roof.'
  },
  {
    id: 'ghost-burned-house',
    order: 7,
    name: 'Burned House Ghost',
    location: 'Joshua Road, near Zancudo River / Harmony',
    startHour: 3,
    endHour: 4,
    timeWindow: '03:00 - 04:00',
    x: 162.7,
    y: 3132.7,
    z: 44.2,
    description: 'Burned abandoned house along Joshua Road. Check the front porch and the back.'
  },
  {
    id: 'ghost-little-seoul',
    order: 8,
    name: 'Little Seoul Church Ghost',
    location: 'Little Seoul Church bell tower',
    startHour: 4,
    endHour: 5,
    timeWindow: '04:00 - 05:00',
    x: -765.8,
    y: -692.7,
    z: 71.6,
    description: 'Atop the church bell tower. Check the upper section of the tower.'
  },
  {
    id: 'ghost-twohoots',
    order: 9,
    name: 'Two Hoots Falls Ghost',
    location: 'Two Hoots Falls waterfall, Tongva Hills',
    startHour: 5,
    endHour: 6,
    timeWindow: '05:00 - 06:00',
    x: -1648.2,
    y: 2082.6,
    z: 88.5,
    description: 'Waterfall in Tongva Hills. Look beside the water drop and along the rocky edges.'
  },
  {
    id: 'ghost-devin-weston',
    order: 10,
    name: 'Devin Weston\'s Ghost',
    location: 'Paleto Cove cliffside',
    startHour: 0,
    endHour: 1,
    timeWindow: '00:00 - 01:00 (Requires the previous 9)',
    x: -1617.0,
    y: 5173.0,
    z: 8.1,
    description: 'The GTA V billionaire appears floating off the Paleto Cove cliffside.'
  }
];

export const GTA_YETI_CLUES_LIST_EN: GtaYetiClue[] = [
  {
    id: 'yeti-car-wreck',
    order: 1,
    name: 'Wrecked Vehicle',
    description: 'Overturned and crushed car beneath the bridge in the riverbed.',
    x: -1573,
    y: 4467,
    z: 12,
    icon: 'fa-car-burst'
  },
  {
    id: 'yeti-body-parts',
    order: 2,
    name: 'Mutilated Human Remains',
    description: 'Dismembered limbs and remains next to the rocks on the riverbank.',
    x: -1685,
    y: 4492,
    z: 15,
    icon: 'fa-skull'
  },
  {
    id: 'yeti-bloodied-tent',
    order: 3,
    name: 'Bloodied Tent',
    description: 'Torn-apart campsite covered in blood on the northern slope.',
    x: -1524,
    y: 4578,
    z: 36,
    icon: 'fa-campground'
  },
  {
    id: 'yeti-ripped-shirt',
    order: 4,
    name: 'Ripped Shirt',
    description: 'Bloodstained clothing hanging from the brush along the trail.',
    x: -1452,
    y: 4504,
    z: 32,
    icon: 'fa-shirt'
  },
  {
    id: 'yeti-dead-deer',
    order: 5,
    name: 'Gutted Deer',
    description: 'Mutilated animal carcass on the southern bank below the cliff.',
    x: -1560,
    y: 4380,
    z: 16,
    icon: 'fa-bone'
  }
];

export const GTA_SNOWMEN_LIST_EN: GtaSnowmanInfo[] = [
  {
    id: 'snowman-01',
    order: 1,
    name: '12 Sustancia Road',
    zone: 'El Burro Heights',
    description: 'In the front yard of the house at 12 Sustancia Road.',
    x: 1341.5,
    y: -1586.9,
    z: 50.0
  },
  {
    id: 'snowman-02',
    order: 2,
    name: 'East Mirror Drive',
    zone: 'Mirror Park',
    description: 'In front of one of the family homes on East Mirror Drive.',
    x: 1052.0,
    y: -432.0,
    z: 66.0
  },
  {
    id: 'snowman-03',
    order: 3,
    name: 'Broker Park',
    zone: 'East Vinewood',
    description: 'Next to the central fountain in Broker Park.',
    x: 645.0,
    y: 162.0,
    z: 92.0
  },
  {
    id: 'snowman-04',
    order: 4,
    name: 'Spanish Avenue',
    zone: 'Hawick',
    description: 'In the landscaped alley between two residential homes.',
    x: 322.0,
    y: -212.0,
    z: 54.0
  },
  {
    id: 'snowman-05',
    order: 5,
    name: 'Legion Square Red Cube',
    zone: 'Downtown Los Santos',
    description: 'Next to the red cube sculpture in the center of Legion Square.',
    x: 215.0,
    y: -930.0,
    z: 30.0
  },
  {
    id: 'snowman-06',
    order: 6,
    name: 'BJ Smith Recreational Center',
    zone: 'Chamberlain Hills',
    description: 'Next to the half-pipe skate ramp at the recreation center.',
    x: -215.0,
    y: -1680.0,
    z: 34.0
  },
  {
    id: 'snowman-07',
    order: 7,
    name: 'Goma Street',
    zone: 'Vespucci Canals',
    description: 'Under the shade of a palm tree along the Goma Street walkway.',
    x: -1085.0,
    y: -1145.0,
    z: 2.0
  },
  {
    id: 'snowman-08',
    order: 8,
    name: 'Decker Park',
    zone: 'Vespucci Canals',
    description: 'On top of the half-pipe skate ramp at Decker Park.',
    x: -1005.0,
    y: -1365.0,
    z: 5.0
  },
  {
    id: 'snowman-09',
    order: 9,
    name: 'De Santa Mansion',
    zone: 'Rockford Hills',
    description: 'In the front yard of Michael\'s family mansion on Portola Drive.',
    x: -813.0,
    y: 178.0,
    z: 72.0
  },
  {
    id: 'snowman-10',
    order: 10,
    name: 'Vinewood Dog Park',
    zone: 'Vinewood Hills',
    description: 'Inside the fenced green area of the dog training park.',
    x: -568.0,
    y: 468.0,
    z: 104.0
  },
  {
    id: 'snowman-11',
    order: 11,
    name: 'Galileo Observatory',
    zone: 'Vinewood Hills',
    description: 'On the viewing terrace of the east wing of the Galileo Observatory.',
    x: -438.0,
    y: 1106.0,
    z: 326.0
  },
  {
    id: 'snowman-12',
    order: 12,
    name: 'North Rockford Drive',
    zone: 'Vinewood Hills',
    description: 'In front of the landscaped entrance of a villa on North Rockford Drive.',
    x: -910.0,
    y: 605.0,
    z: 142.0
  },
  {
    id: 'snowman-13',
    order: 13,
    name: 'Great Ocean Highway (Banham Canyon)',
    zone: 'Banham Canyon',
    description: 'In the backyard of a cliffside residence overlooking the highway.',
    x: -2165.0,
    y: -412.0,
    z: 13.0
  },
  {
    id: 'snowman-14',
    order: 14,
    name: 'Banham Canyon Drive',
    zone: 'Banham Canyon',
    description: 'Behind a wooden house on the canyon hillside.',
    x: -1855.0,
    y: -352.0,
    z: 49.0
  },
  {
    id: 'snowman-15',
    order: 15,
    name: 'Tongva Drive & Zancudo Road Junction',
    zone: 'Tongva Valley',
    description: 'At the fork in the road between Tongva Drive and Zancudo Road.',
    x: -1452.0,
    y: 888.0,
    z: 182.0
  },
  {
    id: 'snowman-16',
    order: 16,
    name: 'Joshua Road',
    zone: 'Grand Senora Desert',
    description: 'At the front entrance of a rustic house along Joshua Road.',
    x: 672.0,
    y: 2695.0,
    z: 41.0
  },
  {
    id: 'snowman-17',
    order: 17,
    name: 'Cherry Pie Farm',
    zone: 'Grand Senora Desert',
    description: 'In front of a rural building next to the Cherry Pie Farm fields.',
    x: 2435.0,
    y: 4975.0,
    z: 46.0
  },
  {
    id: 'snowman-18',
    order: 18,
    name: 'Martin Madrazo\'s Lockup',
    zone: 'Grand Senora Desert',
    description: 'In front of a ruined building at the Madrazo Cartel outpost.',
    x: 1395.0,
    y: 3613.0,
    z: 38.0
  },
  {
    id: 'snowman-19',
    order: 19,
    name: 'Senora Trailer Park',
    zone: 'RON Alternates Wind Farm',
    description: 'In front of a trailer in the residential camp next to the wind farm.',
    x: 2355.0,
    y: 2582.0,
    z: 47.0
  },
  {
    id: 'snowman-20',
    order: 20,
    name: 'Trevor Philips\' Trailer',
    zone: 'Sandy Shores',
    description: 'A few meters from Trevor\'s trailer on Zancudo Avenue.',
    x: 1974.8,
    y: 3819.3,
    z: 33.4
  },
  {
    id: 'snowman-21',
    order: 21,
    name: 'Grapeseed Main Street',
    zone: 'Grapeseed',
    description: 'In front of a farmhouse on Grapeseed Main Street.',
    x: 1715.0,
    y: 4805.0,
    z: 42.0
  },
  {
    id: 'snowman-22',
    order: 22,
    name: 'Ursula\'s House (El Gordo Lighthouse)',
    zone: 'Mount Gordo',
    description: 'On the porch of Ursula\'s secluded cabin along the lighthouse trail.',
    x: 3345.0,
    y: 5142.0,
    z: 18.0
  },
  {
    id: 'snowman-23',
    order: 23,
    name: 'Up-n-Atom Diner',
    zone: 'Procopio Beach',
    description: 'Next to the large Up-n-Atom Diner sign on the north coast.',
    x: 79.3,
    y: 6340.0,
    z: 31.0
  },
  {
    id: 'snowman-24',
    order: 24,
    name: 'Paleto Boulevard',
    zone: 'Paleto Bay',
    description: 'In the backyard of a residential home along Paleto Boulevard.',
    x: -382.0,
    y: 6172.0,
    z: 31.0
  },
  {
    id: 'snowman-25',
    order: 25,
    name: 'Sonar Collections Dock',
    zone: 'Paleto Cove',
    description: 'East of the submarine sonar dock facility along the highway.',
    x: -1015.0,
    y: 5320.0,
    z: 44.0
  }
];

export const GTA_SLASHERS_LIST_PT: GtaSlasherInfo[] = [
  {
    id: 'sack',
    name: 'O Assassino do Saco',
    alias: 'Homem do Saco',
    color: '#9ca3af',
    weapon: 'Machete',
    area: 'Paleto Bay, florestas do norte e Monte Chiliad',
    time: '21:00 - 05:00',
    icon: 'fa-skull',
    image: 'assets/images/gta5/mapa/marcadores-mapa/activities/slashers/sack.png',
    zones: [
      { x: 0, y: 5600, radius: 2700 }
    ]
  },
  {
    id: 'clown',
    name: 'O Palhaço',
    alias: 'Palhaço Assassino',
    color: '#a855f7',
    weapon: 'Canivete automático',
    area: 'Todo o núcleo urbano de Los Santos',
    time: '21:00 - 05:00',
    icon: 'fa-mask',
    image: 'assets/images/gta5/mapa/marcadores-mapa/activities/slashers/clown.png',
    zones: [
      { x: -150, y: -1600, radius: 2400 }
    ]
  },
  {
    id: 'psycho',
    name: 'O Psicopata',
    alias: 'O Mascarado',
    color: '#ec4899',
    weapon: 'Taco de beisebol',
    area: 'Vinewood Hills, Tongva Hills e Banham Canyon',
    time: '21:00 - 05:00',
    icon: 'fa-baseball-bat-ball',
    image: 'assets/images/gta5/mapa/marcadores-mapa/activities/slashers/psycho.png',
    zones: [
      { x: -1900, y: -200, radius: 950 },
      { x: -600, y: 600, radius: 1050 },
      { x: -1200, y: -800, radius: 650 },
      { x: -400, y: -600, radius: 600 }
    ]
  },
  {
    id: 'driver',
    name: 'O Motorista',
    alias: 'Piloto Assassino',
    color: '#f97316',
    weapon: 'Chave inglesa',
    area: 'Circuito Redwood Lights e Porto de Los Santos',
    time: '21:00 - 05:00',
    icon: 'fa-wrench',
    image: 'assets/images/gta5/mapa/marcadores-mapa/activities/slashers/driver.png',
    zones: [
      { x: 950, y: 2300, radius: 450 },
      { x: -350, y: -2150, radius: 550 }
    ]
  }
];

export const GTA_GHOSTS_LIST_PT: GtaGhostInfo[] = [
  {
    id: 'ghost-paleto',
    order: 1,
    name: 'Fantasma de Paleto Bay',
    location: 'Procopio Drive, perto da Beeker\'s Garage',
    startHour: 20,
    endHour: 21,
    timeWindow: '20:00 - 21:00',
    x: 63.8,
    y: 6664.9,
    z: 32.3,
    description: 'Casa deteriorada em Procopio Drive. Pode aparecer na janela do sótão ou na construção dos fundos.'
  },
  {
    id: 'ghost-strawberry',
    order: 2,
    name: 'Fantasma de Strawberry',
    location: 'Debaixo do viaduto, ao norte do Vanilla Unicorn',
    startHour: 21,
    endHour: 22,
    timeWindow: '21:00 - 22:00',
    x: 122.8,
    y: -1180.9,
    z: 31.2,
    description: 'Debaixo do viaduto da autoestrada. Verifique a parede com grafites e o abrigo de lona.'
  },
  {
    id: 'ghost-grapeseed',
    order: 3,
    name: 'Fantasma de Grapeseed',
    location: 'Celeiro ao norte do McKenzie Field',
    startHour: 22,
    endHour: 23,
    timeWindow: '22:00 - 23:00',
    x: 1907.8,
    y: 4931.9,
    z: 55.5,
    description: 'Celeiro, na parte superior do edifício. Verifique ambas as extremidades do palheiro.'
  },
  {
    id: 'ghost-miriam-turner',
    order: 4,
    name: 'Fantasma do Miriam Turner Overpass',
    location: 'Torre da ponte suspensa em direção a Elysian Island',
    startHour: 23,
    endHour: 0,
    timeWindow: '23:00 - 00:00',
    x: -550.6,
    y: -2238.8,
    z: 122.8,
    description: 'No alto da torre da ponte suspensa que cruza para Elysian Island / Porto.'
  },
  {
    id: 'ghost-lighthouse',
    order: 5,
    name: 'Fantasma do Farol de El Gordo',
    location: 'Ilha do farol, a leste de Mount Gordo',
    startHour: 1,
    endHour: 2,
    timeWindow: '01:00 - 02:00',
    x: 3428.9,
    y: 5175.5,
    z: 36.4,
    description: 'Na ilha do farol. Pode aparecer na plataforma inferior ou na parte superior do farol.'
  },
  {
    id: 'ghost-slaughterhouse',
    order: 6,
    name: 'Fantasma do Raven Slaughterhouse',
    location: 'Cypress Flats, atrás do armazém Raven',
    startHour: 2,
    endHour: 3,
    timeWindow: '02:00 - 03:00',
    x: 1006.6,
    y: -2167.5,
    z: 34.7,
    description: 'Zona industrial de Cypress Flats. Verifique a estrutura ferroviária e o telhado do matadouro.'
  },
  {
    id: 'ghost-burned-house',
    order: 7,
    name: 'Fantasma da Casa Incendiada',
    location: 'Joshua Road, perto do Rio Zancudo / Harmony',
    startHour: 3,
    endHour: 4,
    timeWindow: '03:00 - 04:00',
    x: 162.7,
    y: 3132.7,
    z: 44.2,
    description: 'Casa abandonada e carbonizada junto à Joshua Road. Verifique a varanda e os fundos.'
  },
  {
    id: 'ghost-little-seoul',
    order: 8,
    name: 'Fantasma da Igreja de Little Seoul',
    location: 'Campanário da Igreja de Little Seoul',
    startHour: 4,
    endHour: 5,
    timeWindow: '04:00 - 05:00',
    x: -765.8,
    y: -692.7,
    z: 71.6,
    description: 'No alto do campanário da igreja. Verifique a parte superior da torre.'
  },
  {
    id: 'ghost-twohoots',
    order: 9,
    name: 'Fantasma de Two Hoots Falls',
    location: 'Cachoeira de Two Hoots Falls, Tongva Hills',
    startHour: 5,
    endHour: 6,
    timeWindow: '05:00 - 06:00',
    x: -1648.2,
    y: 2082.6,
    z: 88.5,
    description: 'Cachoeira em Tongva Hills. Procure junto à queda d\'água e nas margens de rocha.'
  },
  {
    id: 'ghost-devin-weston',
    order: 10,
    name: 'Fantasma de Devin Weston',
    location: 'Penhasco de Paleto Cove',
    startHour: 0,
    endHour: 1,
    timeWindow: '00:00 - 01:00 (Requer os 9 anteriores)',
    x: -1617.0,
    y: 5173.0,
    z: 8.1,
    description: 'O empresário de GTA V aparece flutuando diante do penhasco de Paleto Cove.'
  }
];

export const GTA_YETI_CLUES_LIST_PT: GtaYetiClue[] = [
  {
    id: 'yeti-car-wreck',
    order: 1,
    name: 'Veículo acidentado',
    description: 'Carro capotado e amassado debaixo da ponte, no leito do rio.',
    x: -1573,
    y: 4467,
    z: 12,
    icon: 'fa-car-burst'
  },
  {
    id: 'yeti-body-parts',
    order: 2,
    name: 'Restos humanos mutilados',
    description: 'Membros e restos desmembrados junto às rochas da margem.',
    x: -1685,
    y: 4492,
    z: 15,
    icon: 'fa-skull'
  },
  {
    id: 'yeti-bloodied-tent',
    order: 3,
    name: 'Barraca ensanguentada',
    description: 'Acampamento destruído e coberto de sangue na encosta norte.',
    x: -1524,
    y: 4578,
    z: 36,
    icon: 'fa-campground'
  },
  {
    id: 'yeti-ripped-shirt',
    order: 4,
    name: 'Camisa rasgada',
    description: 'Roupa ensanguentada pendurada no mato da trilha.',
    x: -1452,
    y: 4504,
    z: 32,
    icon: 'fa-shirt'
  },
  {
    id: 'yeti-dead-deer',
    order: 5,
    name: 'Cervo estripado',
    description: 'Carcaça de animal mutilado na margem sul, sob o penhasco.',
    x: -1560,
    y: 4380,
    z: 16,
    icon: 'fa-bone'
  }
];

export const GTA_SNOWMEN_LIST_PT: GtaSnowmanInfo[] = [
  {
    id: 'snowman-01',
    order: 1,
    name: '12 Sustancia Road',
    zone: 'El Burro Heights',
    description: 'No jardim da frente da casa em 12 Sustancia Road.',
    x: 1341.5,
    y: -1586.9,
    z: 50.0
  },
  {
    id: 'snowman-02',
    order: 2,
    name: 'East Mirror Drive',
    zone: 'Mirror Park',
    description: 'Em frente a uma das residências familiares em East Mirror Drive.',
    x: 1052.0,
    y: -432.0,
    z: 66.0
  },
  {
    id: 'snowman-03',
    order: 3,
    name: 'Broker Park',
    zone: 'East Vinewood',
    description: 'Junto à fonte central do parque Broker Park.',
    x: 645.0,
    y: 162.0,
    z: 92.0
  },
  {
    id: 'snowman-04',
    order: 4,
    name: 'Spanish Avenue',
    zone: 'Hawick',
    description: 'No beco ajardinado entre duas casas residenciais.',
    x: 322.0,
    y: -212.0,
    z: 54.0
  },
  {
    id: 'snowman-05',
    order: 5,
    name: 'Cubo Vermelho da Legion Square',
    zone: 'Downtown Los Santos',
    description: 'Junto à escultura em forma de cubo vermelho na praça central da Legion Square.',
    x: 215.0,
    y: -930.0,
    z: 30.0
  },
  {
    id: 'snowman-06',
    order: 6,
    name: 'BJ Smith Recreational Center',
    zone: 'Chamberlain Hills',
    description: 'Junto à rampa de skate half-pipe do centro esportivo.',
    x: -215.0,
    y: -1680.0,
    z: 34.0
  },
  {
    id: 'snowman-07',
    order: 7,
    name: 'Goma Street',
    zone: 'Vespucci Canals',
    description: 'Sob a sombra de uma palmeira junto à calçada de Goma Street.',
    x: -1085.0,
    y: -1145.0,
    z: 2.0
  },
  {
    id: 'snowman-08',
    order: 8,
    name: 'Decker Park',
    zone: 'Vespucci Canals',
    description: 'Sobre a rampa de skate half-pipe de Decker Park.',
    x: -1005.0,
    y: -1365.0,
    z: 5.0
  },
  {
    id: 'snowman-09',
    order: 9,
    name: 'Mansão De Santa',
    zone: 'Rockford Hills',
    description: 'No jardim da frente da mansão da família de Michael em Portola Drive.',
    x: -813.0,
    y: 178.0,
    z: 72.0
  },
  {
    id: 'snowman-10',
    order: 10,
    name: 'Parque Canino de Vinewood',
    zone: 'Vinewood Hills',
    description: 'Na área verde cercada do parque de adestramento canino.',
    x: -568.0,
    y: 468.0,
    z: 104.0
  },
  {
    id: 'snowman-11',
    order: 11,
    name: 'Observatório Galileo',
    zone: 'Vinewood Hills',
    description: 'No terraço mirante da ala leste do Observatório Galileo.',
    x: -438.0,
    y: 1106.0,
    z: 326.0
  },
  {
    id: 'snowman-12',
    order: 12,
    name: 'North Rockford Drive',
    zone: 'Vinewood Hills',
    description: 'Em frente à entrada ajardinada de uma vila em North Rockford Drive.',
    x: -910.0,
    y: 605.0,
    z: 142.0
  },
  {
    id: 'snowman-13',
    order: 13,
    name: 'Great Ocean Highway (Banham Canyon)',
    zone: 'Banham Canyon',
    description: 'No quintal de uma residência sobre os penhascos da autoestrada.',
    x: -2165.0,
    y: -412.0,
    z: 13.0
  },
  {
    id: 'snowman-14',
    order: 14,
    name: 'Banham Canyon Drive',
    zone: 'Banham Canyon',
    description: 'Atrás de uma casa de madeira na encosta do desfiladeiro.',
    x: -1855.0,
    y: -352.0,
    z: 49.0
  },
  {
    id: 'snowman-15',
    order: 15,
    name: 'Cruzamento Tongva Drive e Zancudo Road',
    zone: 'Tongva Valley',
    description: 'Na bifurcação entre Tongva Drive e Zancudo Road.',
    x: -1452.0,
    y: 888.0,
    z: 182.0
  },
  {
    id: 'snowman-16',
    order: 16,
    name: 'Joshua Road',
    zone: 'Grand Senora Desert',
    description: 'Na entrada de uma casa rústica ao longo da Joshua Road.',
    x: 672.0,
    y: 2695.0,
    z: 41.0
  },
  {
    id: 'snowman-17',
    order: 17,
    name: 'Cherry Pie Farm',
    zone: 'Grand Senora Desert',
    description: 'Em frente a uma construção rural junto aos campos da Cherry Pie Farm.',
    x: 2435.0,
    y: 4975.0,
    z: 46.0
  },
  {
    id: 'snowman-18',
    order: 18,
    name: 'Esconderijo de Martin Madrazo',
    zone: 'Grand Senora Desert',
    description: 'Em frente a um edifício em ruínas do posto oculto do Cartel Madrazo.',
    x: 1395.0,
    y: 3613.0,
    z: 38.0
  },
  {
    id: 'snowman-19',
    order: 19,
    name: 'Parque de Trailers de Senora',
    zone: 'RON Alternates Wind Farm',
    description: 'Em frente a um trailer no acampamento residencial junto ao parque eólico.',
    x: 2355.0,
    y: 2582.0,
    z: 47.0
  },
  {
    id: 'snowman-20',
    order: 20,
    name: 'Trailer de Trevor Philips',
    zone: 'Sandy Shores',
    description: 'A poucos metros do trailer de Trevor em Zancudo Avenue.',
    x: 1974.8,
    y: 3819.3,
    z: 33.4
  },
  {
    id: 'snowman-21',
    order: 21,
    name: 'Rua Principal de Grapeseed',
    zone: 'Grapeseed',
    description: 'Em frente a uma casa de fazenda em Grapeseed Main Street.',
    x: 1715.0,
    y: 4805.0,
    z: 42.0
  },
  {
    id: 'snowman-22',
    order: 22,
    name: 'Casa de Ursula (Farol de El Gordo)',
    zone: 'Mount Gordo',
    description: 'Na varanda da cabana isolada de Ursula, na trilha do farol.',
    x: 3345.0,
    y: 5142.0,
    z: 18.0
  },
  {
    id: 'snowman-23',
    order: 23,
    name: 'Restaurante Up-n-Atom',
    zone: 'Procopio Beach',
    description: 'Junto ao grande letreiro do Up-n-Atom Diner, na costa norte.',
    x: 79.3,
    y: 6340.0,
    z: 31.0
  },
  {
    id: 'snowman-24',
    order: 24,
    name: 'Paleto Boulevard',
    zone: 'Paleto Bay',
    description: 'No quintal de uma residência ao longo de Paleto Boulevard.',
    x: -382.0,
    y: 6172.0,
    z: 31.0
  },
  {
    id: 'snowman-25',
    order: 25,
    name: 'Cais Sonar Collections',
    zone: 'Paleto Cove',
    description: 'A leste das instalações do cais de busca submarina, junto à autoestrada.',
    x: -1015.0,
    y: 5320.0,
    z: 44.0
  }
];

export type GtaEventListsOverlay = Record<'slashers' | 'ghosts' | 'yeti' | 'snowmen', Record<string, Record<string, string>>>;

let eventListsOverlay: { lang: string; data: GtaEventListsOverlay } | null = null;
const overlaidLists = new Map<string, unknown[]>();

/** Registra los textos traducidos de las listas para los idiomas sin copia en este archivo. */
export function setEventListsOverlay(lang: string, data: GtaEventListsOverlay): void {
  eventListsOverlay = { lang, data };
  overlaidLists.clear();
}

/** Devuelve siempre el mismo array por idioma para no rehacer las listas en cada detección de cambios. */
function withOverlay<T extends { id: string }>(key: keyof GtaEventListsOverlay, lang: string, list: T[]): T[] {
  if (eventListsOverlay?.lang !== lang) return list;
  const cacheKey = `${lang}:${key}`;
  const cached = overlaidLists.get(cacheKey) as T[] | undefined;
  if (cached) return cached;
  const texts = eventListsOverlay.data[key] ?? {};
  const merged = list.map(item => ({ ...item, ...texts[item.id] }));
  overlaidLists.set(cacheKey, merged);
  return merged;
}

export function getSlashersList(lang: string): GtaSlasherInfo[] {
  if (lang === 'es') return GTA_SLASHERS_LIST;
  if (lang === 'pt') return GTA_SLASHERS_LIST_PT;
  return withOverlay('slashers', lang, GTA_SLASHERS_LIST_EN);
}

export function getGhostsList(lang: string): GtaGhostInfo[] {
  if (lang === 'es') return GTA_GHOSTS_LIST;
  if (lang === 'pt') return GTA_GHOSTS_LIST_PT;
  return withOverlay('ghosts', lang, GTA_GHOSTS_LIST_EN);
}

export function getYetiCluesList(lang: string): GtaYetiClue[] {
  if (lang === 'es') return GTA_YETI_CLUES_LIST;
  if (lang === 'pt') return GTA_YETI_CLUES_LIST_PT;
  return withOverlay('yeti', lang, GTA_YETI_CLUES_LIST_EN);
}

export function getSnowmenList(lang: string): GtaSnowmanInfo[] {
  if (lang === 'es') return GTA_SNOWMEN_LIST;
  if (lang === 'pt') return GTA_SNOWMEN_LIST_PT;
  return withOverlay('snowmen', lang, GTA_SNOWMEN_LIST_EN);
}
