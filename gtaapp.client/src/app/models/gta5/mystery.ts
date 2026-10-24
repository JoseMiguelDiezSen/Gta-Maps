export interface GtaMystery {
  id: string;
  order: number;
  title: string;
  titleEn?: string;
  category: string;
  categoryLabel: string;
  schedule?: string;
  location: string;
  zone: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  observationPoint?: {
    x: number;
    y: number;
    z: number;
    tip: string;
  };
  points?: {
    step: number;
    title?: string;
    position: {
      x: number;
      y: number;
      z?: number;
    };
    description?: string;
    tip?: string;
    thumbnail?: string;
  }[];
  description: string;
  summary?: string;
  lore: string;
  mechanics?: string[];
  clues?: string[];
  thumbnail: string;
  badgeColor: string;
  badgeIcon: string;
  badgeSymbol: string;
  gameMode: 'both' | 'online' | 'story';
}
