import { MapPosition, MapBadge } from './map-common';

export { MapPosition, MapBadge };

export type LocationCategory =
  | 'safehouse'
  | 'purchasable_business'
  | 'mansion'
  | 'hangar'
  | 'bunker'
  | 'facility'
  | 'nightclub'
  | 'arcade'
  | 'auto_shop'
  | 'agency'
  | 'salvage_yard'
  | 'bail_office'
  | 'warehouse'
  | 'vehicle_warehouse'
  | 'ceo_office'
  | 'mc_business'
  | 'coke_lockup'
  | 'weed_farm'
  | 'meth_lab'
  | 'cash_factory'
  | 'doc_forgery'
  | 'mc_clubhouse'
  | 'ls_customs'
  | 'bennys'
  | 'hao_garage'
  | 'ls_car_meet'
  | 'animal'
  | 'service'
  | 'police_station'
  | 'hospital'
  | 'fire_station'
  | 'convenience_store'
  | 'car_wash'
  | 'strip_club'
  | 'roleplay_job'
  | 'arena_war'
  | 'fake_ufo'
  | 'shipwreck'
  | 'cave'
  | 'activity'
  | 'character';

export interface LocationItem {
  id: string;
  name: string;
  category: LocationCategory;
  categoryLabel: string;
  gameMode: 'story' | 'online' | 'both';
  owner?: string;
  price: number;
  priceFormatted: string;
  imageUrl?: string;
  zone: string;
  description: string;
  features?: string[];
  income?: string;
  position: MapPosition;
  badge: MapBadge;
}

// Alias de retrocompatibilidad
export type PropertyLocation = LocationItem;
export type PropertyCategory = LocationCategory;
export type PropertyPosition = MapPosition;
export type PropertyBadge = MapBadge;
