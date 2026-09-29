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
  category: string; // 'classic' | 'doomsday' | 'casino' | 'cayo_perico' | 'raid'
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
