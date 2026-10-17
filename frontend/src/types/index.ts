export type NavTab = 'garden' | 'collections' | 'search' | 'saved' | 'settings' | 'thoughts';

export type GrowthStage = 'seed' | 'sprout' | 'bloom' | 'mature';

export type ThoughtCategory = 'idea' | 'research' | 'writing' | 'task' | 'connection' | 'thought';

/** Lifecycle of automatic collection classification for a thought. */
export type ClassifyState = 'pending' | 'done' | 'skipped' | 'failed';

export interface Thought {
  id: string;
  text: string;
  createdAt: string;
  updatedAt: string;
  collectionIds: string[];
  stage?: GrowthStage;
  isSaved?: boolean;
  category?: ThoughtCategory;
  /** Memberships added by the organiser (subset of collectionIds); shown with an "auto" badge. */
  autoCollectionIds?: string[];
  /** Set once the user organises this thought by hand; the organiser never changes it again. */
  organizeLocked?: boolean;
  classifyState?: ClassifyState;
  classifiedAt?: string;
  /** How many times the text was edited; feeds automatic growth stages. */
  editCount?: number;
  /** The user picked the stage themselves, so it no longer changes automatically. */
  stageManual?: boolean;
}

export type CollectionColorVariant = 'green' | 'rose' | 'purple' | 'amber';
/** A key of COLLECTION_ICONS (lib/collectionIcons.ts); unknown keys display as a leaf. */
export type CollectionIconType = string;
export type CollectionOrigin = 'manual' | 'auto' | 'starter';

export interface Collection {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  colorVariant?: CollectionColorVariant;
  iconType?: CollectionIconType;
  origin?: CollectionOrigin;
  /** Why the organiser created this collection. */
  autoReason?: string;
}

/** Locally computed text embedding for a thought. Never exported or sent anywhere. */
export interface ThoughtEmbedding {
  thoughtId: string;
  modelId: string;
  textHash: string;
  vector: number[];
  updatedAt: string;
}

export type OrganizeEventSource = 'llm' | 'local' | 'user-accepted';

/** Record of an automatic organising action, used for the activity log and Undo. */
export interface OrganizeEvent {
  id: string;
  thoughtId: string;
  action: 'assign' | 'create';
  collectionId: string;
  collectionName: string;
  partnerThoughtId?: string;
  reason: string;
  source: OrganizeEventSource;
  createdAt: string;
  undoneAt?: string;
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
  totalThoughts?: number;
  thoughtsToday?: number;
  streak?: number;
  feedbackCount?: number;
  activityHistory?: Array<{
    date: string;
    thoughts_count: number;
    total_thoughts: number;
    streak: number;
  }>;
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

