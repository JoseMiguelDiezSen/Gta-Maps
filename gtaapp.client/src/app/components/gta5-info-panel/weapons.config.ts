export interface WeaponCategoryConfig {
  id: string;
  name: string;
  nameKey: string;
  icon: string;
  color: string;
  description?: string;
}

/**
 * Catálogo oficial de categorías de armamento de GTA Online / GTA V.
 * Mapea las 8 categorías del arsenal con sus iconos, colores de acento y claves de localización.
 */
export const WEAPON_CATEGORIES_GTA5: WeaponCategoryConfig[] = [
  {
    id: 'pistols',
    name: 'Pistolas',
    nameKey: 'transports.weapons.categories.pistols',
    icon: 'fa-gun',
    color: '#38bdf8',
    description: 'Pistolas semiautomáticas, revólveres de alta potencia y armas cortas de mano.'
  },
  {
    id: 'smgs',
    name: 'Subfusiles y LMGs',
    nameKey: 'transports.weapons.categories.smgs',
    icon: 'fa-shield-halved',
    color: '#a855f7',
    description: 'Subfusiles automáticos de alta cadencia para tiroteos a media distancia.'
  },
  {
    id: 'rifles',
    name: 'Rifles de Asalto',
    nameKey: 'transports.weapons.categories.rifles',
    icon: 'fa-crosshairs',
    color: '#22c55e',
    description: 'Fusiles tácticos equilibrados en potencia de fuego, alcance y precisión.'
  },
  {
    id: 'shotguns',
    name: 'Escopetas',
    nameKey: 'transports.weapons.categories.shotguns',
    icon: 'fa-fire',
    color: '#f97316',
    description: 'Armas de dispersión devastadoras para combate cerrado y asaltos.'
  },
  {
    id: 'snipers',
    name: 'Francotiradores',
    nameKey: 'transports.weapons.categories.snipers',
    icon: 'fa-bullseye',
    color: '#eab308',
    description: 'Rifles de precisión para eliminación quirúrgica a larga distancia.'
  },
  {
    id: 'heavy',
    name: 'Armas Pesadas',
    nameKey: 'transports.weapons.categories.heavy',
    icon: 'fa-bomb',
    color: '#ef4444',
    description: 'Lanzacohetes, ametralladoras rotativas y artillería de destrucción masiva.'
  },
  {
    id: 'melee',
    name: 'Cuerpo a Cuerpo',
    nameKey: 'transports.weapons.categories.melee',
    icon: 'fa-hand-back-fist',
    color: '#ec4899',
    description: 'Cuchillos, bates y armas contundentes para combate cuerpo a cuerpo.'
  },
  {
    id: 'throwables',
    name: 'Arrojadizas y Explosivos',
    nameKey: 'transports.weapons.categories.throwables',
    icon: 'fa-burst',
    color: '#06b6d4',
    description: 'Granadas, bombas adhesivas, cócteles molotov y minas de proximidad.'
  }
];
