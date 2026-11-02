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
