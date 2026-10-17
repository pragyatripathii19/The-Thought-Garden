import { Collection, Thought } from '../../types';
import { OrganizeDecision } from './types';
import { isCollectionIconKey } from '../collectionIcons';

export interface DecisionContext {
  thought: Thought;
  /** Thought ids the LLM was shown; it may only reference these. */
  candidateThoughtIds: Set<string>;
  thoughts: Thought[];
  collections: Collection[];
}

const MAX_NAME = 60;
const MAX_DESCRIPTION = 160;
const MAX_REASON = 240;
const MAX_ASSIGN = 2;

function none(reason: string): OrganizeDecision {
  return { action: 'none', reason, source: 'llm' };
}

/** An answer we can't use, as opposed to the AI deliberately choosing "none". */
function rejected(reason: string): OrganizeDecision {
  return { action: 'none', reason, source: 'llm', rejected: true };
}

function cleanString(value: unknown, max: number): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Treats the LLM response as untrusted input. Only ids it was shown are accepted,
 * collections must exist, a "create" needs a valid ungrouped partner, and a
 * "new" name that duplicates an existing collection becomes an assignment to it.
 * Anything malformed comes back as a rejected "none", so the caller can use the
 * on-device rule instead.
 */
export function validateDecision(raw: unknown, ctx: DecisionContext): OrganizeDecision {
  if (typeof raw !== 'object' || raw === null) return rejected('Unreadable response.');
  const r = raw as Record<string, unknown>;
  const reason = cleanString(r.reason, MAX_REASON) || 'Suggested by Smart organising.';
  const collectionsById = new Map(ctx.collections.map((c) => [c.id, c]));

  if (r.action === 'assign') {
    const ids = Array.isArray(r.collectionIds) ? r.collectionIds : [];
    const valid = Array.from(
      new Set(ids.filter((id): id is string => typeof id === 'string' && collectionsById.has(id)))
    )
      .filter((id) => !ctx.thought.collectionIds.includes(id))
      .slice(0, MAX_ASSIGN);
    if (valid.length === 0) return rejected('No valid collection to assign.');
    return { action: 'assign', collectionIds: valid, reason, source: 'llm' };
  }

  if (r.action === 'create') {
    const nc = (typeof r.newCollection === 'object' && r.newCollection !== null
      ? r.newCollection
      : {}) as Record<string, unknown>;
    const name = cleanString(nc.name, MAX_NAME);
    const description = cleanString(nc.description, MAX_DESCRIPTION);
    const partnerId = typeof nc.partnerThoughtId === 'string' ? nc.partnerThoughtId : '';

    if (!name) return rejected('New collection had no name.');
    if (!partnerId || partnerId === ctx.thought.id || !ctx.candidateThoughtIds.has(partnerId)) {
      return rejected('New collection needs a second, related thought.');
    }
    const partner = ctx.thoughts.find((t) => t.id === partnerId);
    if (!partner || partner.organizeLocked || partner.collectionIds.length > 0) {
      return none('Partner thought is no longer ungrouped.');
    }

    const duplicate = ctx.collections.find((c) => normalizeName(c.name) === normalizeName(name));
    if (duplicate) {
      if (ctx.thought.collectionIds.includes(duplicate.id)) return none('Already in that collection.');
      return { action: 'assign', collectionIds: [duplicate.id], reason, source: 'llm' };
    }

    return {
      action: 'create',
      newCollection: {
        name,
        description,
        partnerThoughtId: partnerId,
        // Only icons from our list; otherwise the name decides.
        ...(isCollectionIconKey(nc.icon) ? { icon: nc.icon } : {}),
      },
      reason,
      source: 'llm',
    };
  }

  if (r.action === 'none') return none(reason);
  return rejected('Unknown action.');
}
