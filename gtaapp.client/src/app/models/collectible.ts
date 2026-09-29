import { MapPosition, MapBadge } from './map-common';

export type CollectibleCategory =
  | 'playing_card'
  | 'action_figure'
  | 'signal_jammer'
  | 'movie_prop'
  | 'radio_antenna'
  | 'letter_scrap'
  | 'spaceship_part'
  | 'nuclear_waste'
  | 'submarine_part'
  | 'epsilon_tract';

export interface CollectibleItem {
  id: string;
  name: string;
  category: CollectibleCategory;
  categoryLabel: string;
  number: number;
  total: number;
  zone: string;
  description: string;
  hint: string;
  reward: string;
  position: MapPosition;
  badge: MapBadge;
}

// Alias de retrocompatibilidad
export type CollectiblePosition = MapPosition;
export type CollectibleBadge = MapBadge;
