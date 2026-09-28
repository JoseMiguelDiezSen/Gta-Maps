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
}
