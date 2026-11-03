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
    x: -122.8,
    y: 6463.2,
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
    x: 1828.6,
    y: 3680.1,
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
    x: 2438.4,
    y: 4976.2,
    description: 'Granero en la zona superior del edificio. Revisar ambos extremos del pajar.'
  },
  {
    id: 'ghost-miriam-turner',
    order: 4,
    name: 'Fantasma de Miriam Turner Overpass',
    location: 'Pilar del puente próximo al aeropuerto',
    startHour: 23,
    endHour: 0,
    timeWindow: '23:00 - 00:00',
    x: 3391.8,
    y: 5178.6,
    description: 'En lo alto del pilar del puente próximo al aeropuerto internacional. Buscar en la plataforma superior.'
  },
  {
    id: 'ghost-lighthouse',
    order: 5,
    name: 'Fantasma del Faro de El Gordo',
    location: 'Isla del faro, al este de Mount Gordo',
    startHour: 1,
    endHour: 2,
    timeWindow: '01:00 - 02:00',
    x: -1810.2,
    y: 2190.5,
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
    x: -2320.5,
    y: 410.2,
    description: 'Zona industrial de Cypress Flats. Revisar la estructura ferroviaria y el entorno de la grúa.'
  },
  {
    id: 'ghost-burned-house',
    order: 7,
    name: 'Fantasma de Casa Incendiada',
    location: 'Joshua Road, cerca de Stoner Cement Works, Harmony',
    startHour: 3,
    endHour: 4,
    timeWindow: '03:00 - 04:00',
    x: -1200.5,
    y: -800.8,
    description: 'Casa abandonada junto a Joshua Road en Harmony. Revisar el porche y la parte trasera.'
  },
  {
    id: 'ghost-little-seoul',
    order: 8,
    name: 'Fantasma de Iglesia de Little Seoul',
    location: 'Campanario de la Iglesia de Little Seoul',
    startHour: 4,
    endHour: 5,
    timeWindow: '04:00 - 05:00',
    x: 1650.5,
    y: -10.2,
    description: 'En lo alto del campanario. Ubicación elevada, conviene fotografiar desde un punto con buena visibilidad.'
  },
  {
    id: 'ghost-twohoots',
    order: 9,
    name: 'Fantasma de Two Hoots Falls',
    location: 'Cascada de Two Hoots Falls, Tongva Hills',
    startHour: 5,
    endHour: 6,
    timeWindow: '05:00 - 06:00',
    x: -1430.5,
    y: -570.2,
    description: 'Cascada al este de la mansión de la zona. Buscar junto a la caída de agua y en los márgenes superiores.'
  },
  {
    id: 'ghost-devin-weston',
    order: 10,
    name: 'Fantasma de Devin Weston',
    location: 'Acantilado de Paleto Cove',
    startHour: 0,
    endHour: 1,
    timeWindow: '00:00 - 01:00 (Requiere los 9 anteriores)',
    x: -1605.5,
    y: 5258.0,
    description: 'El empresario de GTA V aparece flotando frente al acantilado de Paleto Cove, en el lugar relacionado con el desenlace de su historia.'
  }
];
