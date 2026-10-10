export type NavTab = 'garden' | 'collections' | 'search' | 'settings';

export type GrowthStage = 'seed' | 'sprout' | 'bloom' | 'mature';

export interface Thought {
  id: string;
  text: string;
  createdAt: string;
  updatedAt: string;
  collectionIds: string[];
  stage?: GrowthStage;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export type ConnectionStatus = 'suggested' | 'accepted' | 'dismissed';

export interface Connection {
  id: string;
  sourceThoughtId: string;
  targetThoughtId: string;
  status: ConnectionStatus;
  score?: number;
  reason: string;
  createdAt: string;
  updatedAt: string;
}
