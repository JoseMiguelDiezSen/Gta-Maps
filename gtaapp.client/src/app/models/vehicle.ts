export interface GtaVehicle {
  id: string;
  name: string;
  manufacturer: string;
  dealership: string;
  class: string;
  category: string;
  type?: string;
  price: number;
  priceTrade: number;
  priceFormatted: string;
  speed: number;
  acceleration: number;
  braking: number;
  handling: number;
  weaponized: boolean;
  gameMode: 'both' | 'online' | 'story';
  imageUrl: string;
  imgFailed?: boolean;
  description?: string;
}

export interface DealerCategory {
  id: string;
  name: string;
  icon: string;
  logoUrl?: string;
  logoFailed?: boolean;
  color: string;
  gameMode: 'both' | 'online' | 'story';
  description: string;
}
