export interface GtaWeapon {
  id: string;
  order: number;
  name: string;
  nameEn?: string;
  category: 'pistols' | 'smgs' | 'rifles' | 'shotguns' | 'snipers' | 'heavy' | 'melee' | 'throwables' | 'special';
  categoryLabel: string;
  manufacturer: string;
  realCounterpart?: string;
  price: number;
  priceFormatted: string;
  rankUnlock: number;
  damage: number;       // 1 - 10
  fireRate: number;     // 1 - 10
  accuracy: number;     // 1 - 10
  range: number;        // 1 - 10
  clipSize?: string;
  description: string;
  attachments?: string[];
  icon: string;
  badgeColor: string;
  hasMk2?: boolean;
  gameMode?: 'both' | 'story' | 'online';
  imageUrl?: string;
  imgFailed?: boolean;
}

export interface WeaponCategory {
  id: string;
  name: string;
  count: number;
  icon: string;
}
