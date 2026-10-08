export interface Gta6Mission {
  id: string;
  title: string;
  giver?: string;
  location?: string;
  protagonist?: string;
  description?: string;
  type?: string;
  reward?: string;
  goldRequirements?: string[];
}

export interface Gta6Heist {
  id: string;
  title: string;
  location?: string;
  payout?: string;
  description?: string;
  approaches?: string[];
  setupCount?: number;
}
