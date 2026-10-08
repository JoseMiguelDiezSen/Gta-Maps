export interface Gta6Weapon {
  id: string;
  name: string;
  category: string;
  price?: number;
  priceFormatted?: string;
  damage?: number;
  fireRate?: number;
  accuracy?: number;
  range?: number;
  clipSize?: number;
  imageUrl?: string;
  description?: string;
}
