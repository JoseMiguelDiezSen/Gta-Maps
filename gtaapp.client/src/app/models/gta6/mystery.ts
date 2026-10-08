export interface Gta6Mystery {
  id: string;
  orderNum?: number;
  title: string;
  category?: string;
  locationName?: string;
  coords?: { x: number; y: number };
  descriptionSnippet?: string;
  fullStory?: string;
  thumbnailUrl?: string;
  prerequisites?: string[];
  rewards?: string;
}
