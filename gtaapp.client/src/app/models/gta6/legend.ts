export interface Gta6LegendItem {
  id: string;
  name: string;
  count: number;
  color: string;
  badgeType?: 'weapon' | 'identity' | 'clothes' | 'couple' | 'cctv';
  descEn?: string;
  descEs?: string;
}

export interface Gta6LegendCategory {
  key: string;
  title: string;
  items: Gta6LegendItem[];
}

export interface Gta6MarkerItem {
  id: string;
  itemId: string;
  name: string;
  categoryKey: string;
  color: string;
  x: number;
  y: number;
  desc?: string;
}
