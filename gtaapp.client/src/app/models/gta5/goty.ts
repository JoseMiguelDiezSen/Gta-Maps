export interface GotyMessage {
  id: string;
  sender: 'user' | 'goty';
  text: string;
  timestamp: Date;
  quickReplies?: string[];
  action?: {
    type: 'openTab' | 'filter' | 'locate';
    payload: any;
    label: string;
  };
  isAngry?: boolean;
}

export type GotyGameMode = 'gta5-historia' | 'gta5-online' | 'gta6-historia' | 'gta6-online';
