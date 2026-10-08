export interface Gta6Vehicle {
  id: string;
  name: string;
  manufacturer?: string;
  class?: string;
  category?: string;
  dealerId?: string;
  dealerName?: string;
  dealerLogo?: string;
  dealership?: string;
  price: number;
  priceTrade?: number;
  priceFormatted?: string;
  speed?: number;
  acceleration?: number;
  braking?: number;
  handling?: number;
  weaponized?: boolean;
  topSpeedMph?: number;
  topSpeedKmh?: number;
  driveType?: 'RWD' | 'FWD' | 'AWD' | '4WD';
  seats?: number;
  gears?: number;
  weightKg?: number;
  images: string[];
  description?: string;
  specialFeatures?: string[];
  isCustom?: boolean;
  gameMode?: 'story' | 'online' | 'both';
  imgFailed?: boolean;
}

export interface Gta6DealerCategory {
  id: string;
  name: string;
  icon: string;
  logoUrl?: string;
  color: string;
  gameMode?: 'story' | 'online' | 'both';
  description?: string;
}
