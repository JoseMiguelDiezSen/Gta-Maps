export interface Gta6Mission {
  id: string;
  order?: number;
  title: string;
  titleEn?: string;
  giver?: string;
  location?: string;
  protagonist?: string;
  description?: string;
  type?: string;
  category?: string;
  reward?: string;
  goldRequirements?: string[];
  thumbnail?: string;
}

export interface Gta6HeistApproach {
  name: string;
  description?: string;
}

export interface Gta6Heist {
  id: string;
  order?: number;
  title: string;
  titleEn?: string;
  giver?: string;
  location?: string;
  payout?: string;
  description?: string;
  approaches?: Gta6HeistApproach[];
  setupCount?: number;
  badgeColor?: string;
  badgeIcon?: string;
  categoryLabel?: string;
  thumbnail?: string;
  players?: string;
  potentialTake?: {
    normal: string;
    hard?: string;
    description?: string;
  };
}
