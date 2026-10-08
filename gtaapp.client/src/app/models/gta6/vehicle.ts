export interface Gta6Vehicle {
  id: string;
  name: string;
  dealerId: string;
  dealerName?: string;
  dealerLogo?: string;
  category?: string;
  price: number;
  priceFormatted?: string;
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
