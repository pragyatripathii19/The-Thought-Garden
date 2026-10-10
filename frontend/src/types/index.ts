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

export interface PilotUserProfile {
  id: string;
  name: string;
  email?: string;
  reasons: string[];
  createdAt: string;
  lastActiveAt?: string;
}

export type PilotFeedbackCategory = 'suggestion' | 'bug' | 'praise' | 'other';

export interface PilotFeedback {
  id: string;
  userId?: string;
  userName?: string;
  category: PilotFeedbackCategory;
  rating: number;
  message: string;
  email?: string;
  createdAt: string;
}

export interface PilotDailyActivity {
  id: string;
  userId: string;
  date: string;
  thoughtsCount: number;
  totalThoughts: number;
  streak: number;
  updatedAt: string;
}

export interface AdminSummaryKPIs {
  totalUsers: number;
  totalFeedback: number;
  totalThoughtsLogged: number;
  activeToday: number;
}

export interface AdminThoughtsPerDayAgg {
  date: string;
  total_thoughts: number;
  active_users: number;
}

export interface AdminOverviewData {
  summary: AdminSummaryKPIs;
  users: PilotUserProfile[];
  feedback: PilotFeedback[];
  dailyActivities: PilotDailyActivity[];
  thoughtsPerDayAgg: AdminThoughtsPerDayAgg[];
}

