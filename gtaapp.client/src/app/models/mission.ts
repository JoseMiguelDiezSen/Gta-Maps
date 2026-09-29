export interface GtaMission {
  id: string;
  order: number;
  title: string;
  character: string;
  giver: string;
  category: string;
  description: string;
  goldRequirements: string[];
  reward?: string;
  unlockedBy?: string;
  minLevel?: number;
  players?: string;
}

export interface GtaStrangerMission {
  id: string;
  order: number;
  title: string;
  titleEn: string;
  series: string;
  seriesName: string;
  seriesIcon: string;
  seriesColor: string;
  seriesOrder: number;
  seriesTotal: number;
  character: string;
  giver: string;
  requiredFor100: boolean;
  unlockedBy?: string;
  reward?: string;
  goldRequirements: string[];
  objectives: string[];
  description: string;
  thumbnail?: string;
  walkthroughUrl?: string;
}

export interface StrangerSeriesGroup {
  id: string;
  name: string;
  icon: string;
  color: string;
  missions: GtaStrangerMission[];
  total: number;
}

