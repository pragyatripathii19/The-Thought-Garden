import {
  LucideIcon,
  Sprout,
  PenLine,
  Search,
  ListChecks,
  Leaf,
  Flower2,
  Lightbulb,
  BookOpen,
  GraduationCap,
  Mountain,
  Plane,
  ChefHat,
  Music,
  Briefcase,
  HeartPulse,
  Dumbbell,
  Wallet,
  Code,
  Palette,
  Camera,
  Film,
  Users,
  Heart,
  House,
  PawPrint,
  Gamepad2,
  ShoppingBag,
  Gift,
  Car,
  Globe,
  Brain,
  Moon,
  Target,
  CalendarDays,
  Quote,
  MessageCircle,
  FlaskConical,
  Sun,
  Coffee,
  Rocket,
  Sparkles,
  TreePine,
} from 'lucide-react';

interface CollectionIconDef {
  Icon: LucideIcon;
  label: string;
  /**
   * Words that suggest this icon. Keywords of 3 letters or fewer must match a
   * whole word; longer ones also match words starting with them ("travel" → "travelling").
   */
  keywords: string[];
}

/**
 * Curated icons a collection can have, keyed by the value stored in
 * `Collection.iconType`. The first six are the original icon types.
 */
export const COLLECTION_ICONS: Record<string, CollectionIconDef> = {
  sprout: { Icon: Sprout, label: 'Sprout', keywords: ['grow', 'garden', 'plant', 'seed', 'habit', 'begin'] },
  pencil: { Icon: PenLine, label: 'Writing', keywords: ['writ', 'blog', 'essay', 'draft', 'poem', 'poetry', 'journal', 'story', 'stories', 'novel', 'article', 'note', 'notebook'] },
  search: { Icon: Search, label: 'Research', keywords: ['research', 'question', 'explor', 'curio', 'investigat', 'topic', 'wonder'] },
  check: { Icon: ListChecks, label: 'Tasks', keywords: ['task', 'todo', 'revisit', 'follow', 'errand', 'chore', 'checklist', 'remind', 'action'] },
  leaf: { Icon: Leaf, label: 'Leaf', keywords: [] },
  flower: { Icon: Flower2, label: 'Flower', keywords: ['flower', 'bloom', 'beauty', 'gratitude', 'grateful', 'selfcare', 'spring'] },
  idea: { Icon: Lightbulb, label: 'Ideas', keywords: ['idea', 'startup', 'business', 'product', 'invent', 'brainstorm', 'concept', 'project'] },
  book: { Icon: BookOpen, label: 'Books', keywords: ['book', 'reading', 'read', 'library', 'literature', 'author'] },
  study: { Icon: GraduationCap, label: 'Study', keywords: ['study', 'studies', 'learn', 'course', 'class', 'school', 'college', 'universit', 'exam', 'lecture', 'lesson', 'skill'] },
  mountain: { Icon: Mountain, label: 'Outdoors', keywords: ['mountain', 'hike', 'hiking', 'trek', 'outdoor', 'nature', 'camp'] },
  travel: { Icon: Plane, label: 'Travel', keywords: ['travel', 'trip', 'flight', 'vacation', 'holiday', 'abroad', 'journey', 'destination'] },
  food: { Icon: ChefHat, label: 'Food', keywords: ['recipe', 'cook', 'food', 'meal', 'bake', 'baking', 'kitchen', 'dinner', 'eat', 'restaurant'] },
  music: { Icon: Music, label: 'Music', keywords: ['music', 'song', 'playlist', 'album', 'band', 'guitar', 'piano', 'sing', 'concert', 'lyric'] },
  work: { Icon: Briefcase, label: 'Work', keywords: ['work', 'job', 'career', 'office', 'meeting', 'client', 'interview', 'resume', 'manager', 'team'] },
  health: { Icon: HeartPulse, label: 'Health', keywords: ['health', 'medical', 'doctor', 'wellness', 'sleep', 'mental', 'therapy', 'symptom'] },
  fitness: { Icon: Dumbbell, label: 'Fitness', keywords: ['fitness', 'gym', 'workout', 'exercise', 'run', 'running', 'yoga', 'sport', 'training'] },
  money: { Icon: Wallet, label: 'Money', keywords: ['money', 'finance', 'budget', 'invest', 'saving', 'expense', 'tax', 'bank', 'salary', 'spending'] },
  code: { Icon: Code, label: 'Code', keywords: ['code', 'coding', 'program', 'dev', 'software', 'app', 'tech', 'api', 'bug', 'engineer'] },
  art: { Icon: Palette, label: 'Art', keywords: ['art', 'design', 'paint', 'draw', 'sketch', 'illustrat', 'colour', 'color', 'creative'] },
  photo: { Icon: Camera, label: 'Photos', keywords: ['photo', 'camera', 'picture', 'shoot'] },
  film: { Icon: Film, label: 'Film', keywords: ['film', 'movie', 'cinema', 'watch', 'series', 'tv', 'netflix', 'anime'] },
  people: { Icon: Users, label: 'People', keywords: ['family', 'friend', 'people', 'relationship', 'social', 'community', 'parent', 'kid'] },
  love: { Icon: Heart, label: 'Love', keywords: ['love', 'romance', 'partner', 'dating', 'wedding'] },
  home: { Icon: House, label: 'Home', keywords: ['home', 'house', 'apartment', 'room', 'decor', 'furniture', 'moving', 'rent'] },
  pets: { Icon: PawPrint, label: 'Pets', keywords: ['pet', 'dog', 'cat', 'puppy', 'kitten', 'animal'] },
  games: { Icon: Gamepad2, label: 'Games', keywords: ['game', 'gaming', 'puzzle', 'boardgame'] },
  shopping: { Icon: ShoppingBag, label: 'Shopping', keywords: ['shop', 'buy', 'wishlist', 'purchase', 'clothes', 'fashion'] },
  gift: { Icon: Gift, label: 'Gifts', keywords: ['gift', 'birthday', 'present', 'celebrat', 'party'] },
  car: { Icon: Car, label: 'Driving', keywords: ['car', 'drive', 'driving', 'commute', 'vehicle'] },
  world: { Icon: Globe, label: 'World', keywords: ['world', 'news', 'politic', 'culture', 'language', 'global', 'country'] },
  mind: { Icon: Brain, label: 'Mind', keywords: ['mind', 'psycholog', 'philosoph', 'reflect', 'memory', 'memories', 'think'] },
  dreams: { Icon: Moon, label: 'Dreams', keywords: ['dream', 'night', 'wish'] },
  goals: { Icon: Target, label: 'Goals', keywords: ['goal', 'plan', 'resolution', 'ambition', 'focus', 'milestone', 'vision'] },
  calendar: { Icon: CalendarDays, label: 'Events', keywords: ['event', 'schedule', 'calendar', 'deadline', 'appointment', 'week', 'month'] },
  quotes: { Icon: Quote, label: 'Quotes', keywords: ['quote', 'saying', 'inspiration', 'wisdom', 'motivation'] },
  talk: { Icon: MessageCircle, label: 'Conversations', keywords: ['conversation', 'chat', 'talk', 'discussion', 'podcast'] },
  science: { Icon: FlaskConical, label: 'Science', keywords: ['science', 'experiment', 'chemistry', 'physics', 'biology', 'lab'] },
  sun: { Icon: Sun, label: 'Sunshine', keywords: ['morning', 'summer', 'weekend', 'sun', 'happy', 'joy'] },
  coffee: { Icon: Coffee, label: 'Coffee', keywords: ['coffee', 'cafe', 'tea', 'brew'] },
  rocket: { Icon: Rocket, label: 'Launch', keywords: ['launch', 'ship', 'space', 'rocket'] },
  calm: { Icon: Sparkles, label: 'Calm', keywords: ['spiritual', 'magic', 'manifest', 'meditat', 'mindful', 'calm', 'peace'] },
  forest: { Icon: TreePine, label: 'Forest', keywords: ['forest', 'tree', 'wood', 'environment', 'climate', 'sustainab'] },
};

export const COLLECTION_ICON_KEYS = Object.keys(COLLECTION_ICONS);
export const FALLBACK_COLLECTION_ICON = 'leaf';

/** The icon component for a stored icon key; unknown or missing keys get a leaf. */
export function getCollectionIcon(key?: string): LucideIcon {
  return COLLECTION_ICONS[key || '']?.Icon ?? Leaf;
}

export function isCollectionIconKey(key: unknown): key is string {
  return typeof key === 'string' && Object.prototype.hasOwnProperty.call(COLLECTION_ICONS, key);
}

function words(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 2);
}

/** How strongly a word matches a keyword: longer matches count more, 0 for none. */
function matchStrength(word: string, keyword: string): number {
  const singular = word.endsWith('s') && word.length > 3 ? word.slice(0, -1) : word;
  if (keyword.length <= 3) return word === keyword || singular === keyword ? keyword.length : 0;
  return word.startsWith(keyword) || singular === keyword ? keyword.length : 0;
}

/**
 * Picks the icon that best fits a collection's name (counted double, its
 * first word triple) and description, by keyword. Returns the fallback leaf when nothing matches.
 */
export function suggestCollectionIcon(name: string, description = ''): string {
  // The first word of a name is usually what the collection is about.
  const weighted = [
    ...words(name).map((w, i) => ({ w, weight: i === 0 ? 3 : 2 })),
    ...words(description).map((w) => ({ w, weight: 1 })),
  ];
  let best = FALLBACK_COLLECTION_ICON;
  let bestScore = 0;
  for (const key of COLLECTION_ICON_KEYS) {
    const { keywords } = COLLECTION_ICONS[key];
    let score = 0;
    for (const { w, weight } of weighted) {
      let strongest = 0;
      for (const k of keywords) strongest = Math.max(strongest, matchStrength(w, k));
      score += strongest * weight;
    }
    if (score > bestScore) {
      best = key;
      bestScore = score;
    }
  }
  return best;
}
