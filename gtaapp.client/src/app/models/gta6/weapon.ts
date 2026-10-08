export interface Gta6Weapon {
  id: string;
  name: string;
  nameEn?: string;
  category: string;
  categoryLabel?: string;
  manufacturer?: string;
  realCounterpart?: string;
  price?: number;
  priceFormatted?: string;
  damage?: number;
  fireRate?: number;
  accuracy?: number;
  range?: number;
  clipSize?: number;
  imageUrl?: string;
  imgFailed?: boolean;
  hasMk2?: boolean;
  rankUnlock?: number;
  description?: string;
  attachments?: string[];
}
