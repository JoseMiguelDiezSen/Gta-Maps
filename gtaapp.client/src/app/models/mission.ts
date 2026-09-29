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

// -------------------------------------------------------------
// GOLPES (HEISTS) DE GTA ONLINE
// -------------------------------------------------------------
export interface HeistSetupMission {
  name: string;
  type?: string;
  description?: string;
}

export interface HeistApproach {
  id: string;
  name: string;
  description: string;
}

export interface GtaHeist {
  id: string;
  order: number;
  title: string;
  titleEn: string;
  category: string;
  categoryLabel: string;
  giver: string;
  players: string;
  minLevel: number;
  propertyRequired: string;
  setupCost: number;
  setupCostFormatted: string;
  potentialTake: {
    normal: string;
    hard?: string;
    description?: string;
  };
  target: string;
  location: string;
  description: string;
  thumbnail: string;
  badgeColor: string;
  badgeIcon: string;
  eliteChallenges: string[];
  eliteReward?: string;
  unlockedVehicles?: string[];
  setupMissions: HeistSetupMission[];
  approaches?: HeistApproach[];
  tips?: string[];
}

