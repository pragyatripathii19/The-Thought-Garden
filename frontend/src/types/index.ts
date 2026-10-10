export type NavTab = 'garden' | 'collections' | 'search' | 'saved' | 'settings';

export type GrowthStage = 'seed' | 'sprout' | 'bloom' | 'mature';

export type ThoughtCategory = 'idea' | 'research' | 'writing' | 'task' | 'connection' | 'thought';

export interface Thought {
  id: string;
  text: string;
  createdAt: string;
  updatedAt: string;
  collectionIds: string[];
  stage?: GrowthStage;
  isSaved?: boolean;
  category?: ThoughtCategory;
}

export type CollectionColorVariant = 'green' | 'rose' | 'purple' | 'amber';
export type CollectionIconType = 'sprout' | 'pencil' | 'search' | 'check' | 'leaf' | 'flower';

export interface Collection {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  colorVariant?: CollectionColorVariant;
  iconType?: CollectionIconType;
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
