// Validation, row mapping and SQL for a user's garden. Every query is scoped by
// the user id from the session; ids in request bodies only name rows inside it.

class ValidationError extends Error {}

const STAGES = ['seed', 'sprout', 'bloom', 'mature'];
const CATEGORIES = ['idea', 'research', 'writing', 'task', 'connection', 'thought'];
const CLASSIFY_STATES = ['pending', 'done', 'skipped', 'failed'];
const COLOR_VARIANTS = ['green', 'rose', 'purple', 'amber'];
// Icon keys come from the frontend's curated list; unknown keys display as a leaf.
const ICON_KEY = /^[a-z0-9-]{1,40}$/;
const ORIGINS = ['manual', 'auto', 'starter'];
const CONNECTION_STATUSES = ['suggested', 'accepted', 'dismissed'];
const EVENT_ACTIONS = ['assign', 'create'];
const EVENT_SOURCES = ['llm', 'local', 'user-accepted'];

const MAX_TEXT = 20000;
const MAX_NAME = 200;
const MAX_DESCRIPTION = 2000;
const MAX_IDS = 200;

// ---------- field checks ----------

function isObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function id(value, field) {
  if (typeof value !== 'string' || value.length === 0 || value.length > 200) {
    throw new ValidationError(`${field} must be a non-empty string id`);
  }
  return value;
}

function text(value, field, { max, required = true, trim = false }) {
  if (value === undefined || value === null) {
    if (required) throw new ValidationError(`${field} is required`);
    return null;
  }
  if (typeof value !== 'string') throw new ValidationError(`${field} must be a string`);
  const v = trim ? value.trim() : value;
  if (required && !v.trim()) throw new ValidationError(`${field} cannot be empty`);
  if (v.length > max) throw new ValidationError(`${field} is too long`);
  return v;
}

function oneOf(value, allowed, field) {
  if (value === undefined || value === null) return null;
  if (!allowed.includes(value)) throw new ValidationError(`${field} has an unknown value`);
  return value;
}

function iconKey(value) {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string' || !ICON_KEY.test(value)) throw new ValidationError('iconType has an unknown value');
  return value;
}

function timestamp(value, field, { required = true } = {}) {
  if (value === undefined || value === null) {
    if (required) throw new ValidationError(`${field} is required`);
    return null;
  }
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    throw new ValidationError(`${field} must be an ISO date`);
  }
  return new Date(value).toISOString();
}

function idList(value, field) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > MAX_IDS) throw new ValidationError(`${field} must be a list of ids`);
  return [...new Set(value.map((v) => id(v, field)))];
}

const iso = (d) => (d ? new Date(d).toISOString() : undefined);

// ---------- parse (request body -> normalized values) ----------

function parseThought(body) {
  if (!isObject(body)) throw new ValidationError('thought must be an object');
  return {
    id: id(body.id, 'id'),
    text: text(body.text, 'text', { max: MAX_TEXT }),
    stage: oneOf(body.stage, STAGES, 'stage'),
    category: oneOf(body.category, CATEGORIES, 'category'),
    isSaved: Boolean(body.isSaved),
    organizeLocked: Boolean(body.organizeLocked),
    editCount: Number.isInteger(body.editCount) && body.editCount >= 0 ? Math.min(body.editCount, 100000) : 0,
    stageManual: Boolean(body.stageManual),
    classifyState: oneOf(body.classifyState, CLASSIFY_STATES, 'classifyState'),
    classifiedAt: timestamp(body.classifiedAt, 'classifiedAt', { required: false }),
    createdAt: timestamp(body.createdAt, 'createdAt'),
    updatedAt: timestamp(body.updatedAt, 'updatedAt'),
    collectionIds: idList(body.collectionIds, 'collectionIds'),
    autoCollectionIds: idList(body.autoCollectionIds, 'autoCollectionIds'),
  };
}

function parseCollection(body) {
  if (!isObject(body)) throw new ValidationError('collection must be an object');
  return {
    id: id(body.id, 'id'),
    name: text(body.name, 'name', { max: MAX_NAME, trim: true }),
    description: text(body.description, 'description', { max: MAX_DESCRIPTION, required: false }),
    colorVariant: oneOf(body.colorVariant, COLOR_VARIANTS, 'colorVariant'),
    iconType: iconKey(body.iconType),
    origin: oneOf(body.origin, ORIGINS, 'origin'),
    autoReason: text(body.autoReason, 'autoReason', { max: MAX_DESCRIPTION, required: false }),
    isSaved: Boolean(body.isSaved),
    createdAt: timestamp(body.createdAt, 'createdAt'),
    updatedAt: timestamp(body.updatedAt, 'updatedAt'),
  };
}

function parseConnection(body) {
  if (!isObject(body)) throw new ValidationError('connection must be an object');
  const parsed = {
    id: id(body.id, 'id'),
    sourceThoughtId: id(body.sourceThoughtId, 'sourceThoughtId'),
    targetThoughtId: id(body.targetThoughtId, 'targetThoughtId'),
    status: oneOf(body.status, CONNECTION_STATUSES, 'status'),
    score: typeof body.score === 'number' && Number.isFinite(body.score) ? body.score : null,
    reason: text(body.reason, 'reason', { max: MAX_DESCRIPTION, required: false }) || '',
    createdAt: timestamp(body.createdAt, 'createdAt'),
    updatedAt: timestamp(body.updatedAt, 'updatedAt'),
  };
  if (!parsed.status) throw new ValidationError('status is required');
  if (parsed.sourceThoughtId === parsed.targetThoughtId) {
    throw new ValidationError('A thought cannot be connected to itself');
  }
  return parsed;
}

function parseOrganizeEvent(body) {
  if (!isObject(body)) throw new ValidationError('event must be an object');
  const parsed = {
    id: id(body.id, 'id'),
    thoughtId: id(body.thoughtId, 'thoughtId'),
    action: oneOf(body.action, EVENT_ACTIONS, 'action'),
    collectionId: id(body.collectionId, 'collectionId'),
    collectionName: text(body.collectionName, 'collectionName', { max: MAX_NAME }),
    partnerThoughtId: body.partnerThoughtId == null ? null : id(body.partnerThoughtId, 'partnerThoughtId'),
    reason: text(body.reason, 'reason', { max: MAX_DESCRIPTION, required: false }) || '',
    source: oneOf(body.source, EVENT_SOURCES, 'source'),
    createdAt: timestamp(body.createdAt, 'createdAt'),
    undoneAt: timestamp(body.undoneAt, 'undoneAt', { required: false }),
  };
  if (!parsed.action || !parsed.source) throw new ValidationError('action and source are required');
  return parsed;
}

// ---------- map (database row -> API object) ----------

function thoughtFromRow(r) {
  return {
    id: r.id,
    text: r.text,
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
    collectionIds: r.collection_ids || [],
    stage: r.stage || undefined,
    isSaved: r.is_saved,
    editCount: r.edit_count || undefined,
    stageManual: r.stage_manual || undefined,
    category: r.category || undefined,
    autoCollectionIds: r.auto_collection_ids && r.auto_collection_ids.length ? r.auto_collection_ids : undefined,
    organizeLocked: r.organize_locked || undefined,
    classifyState: r.classify_state || undefined,
    classifiedAt: iso(r.classified_at),
  };
}

function collectionFromRow(r) {
  return {
    id: r.id,
    name: r.name,
    description: r.description || undefined,
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
    colorVariant: r.color_variant || undefined,
    iconType: r.icon_type || undefined,
    origin: r.origin || undefined,
    autoReason: r.auto_reason || undefined,
    isSaved: r.is_saved || undefined,
  };
}

function connectionFromRow(r) {
  return {
    id: r.id,
    sourceThoughtId: r.source_thought_id,
    targetThoughtId: r.target_thought_id,
    status: r.status,
    score: r.score === null ? undefined : r.score,
    reason: r.reason,
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
  };
}

function organizeEventFromRow(r) {
  return {
    id: r.id,
    thoughtId: r.thought_id,
    action: r.action,
    collectionId: r.collection_id,
    collectionName: r.collection_name,
    partnerThoughtId: r.partner_thought_id || undefined,
    reason: r.reason,
    source: r.source,
    createdAt: iso(r.created_at),
    undoneAt: iso(r.undone_at),
  };
}

// ---------- queries ----------

const THOUGHT_SELECT = `
  SELECT t.*,
         COALESCE(array_agg(tc.collection_id ORDER BY tc.position) FILTER (WHERE tc.collection_id IS NOT NULL), '{}') AS collection_ids,
         COALESCE(array_agg(tc.collection_id ORDER BY tc.position) FILTER (WHERE tc.is_auto), '{}') AS auto_collection_ids
    FROM thoughts t
    LEFT JOIN thought_collections tc ON tc.user_id = t.user_id AND tc.thought_id = t.id
`;

async function listThoughts(db, userId) {
  const { rows } = await db.query(
    `${THOUGHT_SELECT} WHERE t.user_id = $1 GROUP BY t.user_id, t.id ORDER BY t.created_at DESC`,
    [userId]
  );
  return rows.map(thoughtFromRow);
}

async function getThought(db, userId, thoughtId) {
  const { rows } = await db.query(
    `${THOUGHT_SELECT} WHERE t.user_id = $1 AND t.id = $2 GROUP BY t.user_id, t.id`,
    [userId, thoughtId]
  );
  return rows[0] ? thoughtFromRow(rows[0]) : null;
}

const THOUGHT_RECORD = `x(id text, text text, stage text, category text, is_saved boolean, organize_locked boolean,
  classify_state text, classified_at timestamptz, created_at timestamptz, updated_at timestamptz,
  edit_count integer, stage_manual boolean)`;

function thoughtRecord(t) {
  return {
    id: t.id,
    text: t.text,
    stage: t.stage,
    category: t.category,
    is_saved: t.isSaved,
    organize_locked: t.organizeLocked,
    classify_state: t.classifyState,
    classified_at: t.classifiedAt,
    created_at: t.createdAt,
    updated_at: t.updatedAt,
    edit_count: t.editCount || 0,
    stage_manual: Boolean(t.stageManual),
  };
}

/** Membership rows for parsed thoughts. Ids of collections the user doesn't have are dropped on insert. */
function membershipRecords(thoughts) {
  const records = [];
  for (const t of thoughts) {
    const auto = new Set(t.autoCollectionIds);
    t.collectionIds.forEach((collectionId, position) => {
      records.push({ thought_id: t.id, collection_id: collectionId, is_auto: auto.has(collectionId), position });
    });
  }
  return records;
}

async function insertMemberships(db, userId, records) {
  if (records.length === 0) return;
  await db.query(
    `INSERT INTO thought_collections (user_id, thought_id, collection_id, is_auto, position)
     SELECT $1, x.thought_id, x.collection_id, x.is_auto, x.position
       FROM jsonb_to_recordset($2::jsonb) AS x(thought_id text, collection_id text, is_auto boolean, position integer)
       JOIN collections c ON c.user_id = $1 AND c.id = x.collection_id
     ON CONFLICT DO NOTHING`,
    [userId, JSON.stringify(records)]
  );
}

/** Creates or replaces one thought and its collection memberships. Call inside a transaction. */
async function upsertThought(db, userId, t) {
  await db.query(
    `INSERT INTO thoughts (user_id, id, text, stage, category, is_saved, organize_locked, classify_state,
                           classified_at, created_at, updated_at, edit_count, stage_manual)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     ON CONFLICT (user_id, id) DO UPDATE SET
       text = EXCLUDED.text, stage = EXCLUDED.stage, category = EXCLUDED.category,
       is_saved = EXCLUDED.is_saved, organize_locked = EXCLUDED.organize_locked,
       classify_state = EXCLUDED.classify_state, classified_at = EXCLUDED.classified_at,
       updated_at = EXCLUDED.updated_at, edit_count = EXCLUDED.edit_count,
       stage_manual = EXCLUDED.stage_manual`,
    [userId, t.id, t.text, t.stage, t.category, t.isSaved, t.organizeLocked, t.classifyState,
      t.classifiedAt, t.createdAt, t.updatedAt, t.editCount, t.stageManual]
  );
  await db.query('DELETE FROM thought_collections WHERE user_id = $1 AND thought_id = $2', [userId, t.id]);
  await insertMemberships(db, userId, membershipRecords([t]));
  return getThought(db, userId, t.id);
}

/** Inserts thoughts that don't exist yet; returns how many were added. */
async function insertThoughts(db, userId, thoughts) {
  if (thoughts.length === 0) return 0;
  const { rows } = await db.query(
    `INSERT INTO thoughts (user_id, id, text, stage, category, is_saved, organize_locked, classify_state,
                           classified_at, created_at, updated_at, edit_count, stage_manual)
     SELECT $1, x.id, x.text, x.stage, x.category, x.is_saved, x.organize_locked, x.classify_state,
            x.classified_at, x.created_at, x.updated_at, x.edit_count, x.stage_manual
       FROM jsonb_to_recordset($2::jsonb) AS ${THOUGHT_RECORD}
     ON CONFLICT DO NOTHING
     RETURNING id`,
    [userId, JSON.stringify(thoughts.map(thoughtRecord))]
  );
  const added = new Set(rows.map((r) => r.id));
  await insertMemberships(db, userId, membershipRecords(thoughts.filter((t) => added.has(t.id))));
  return added.size;
}

async function deleteThought(db, userId, thoughtId) {
  await db.query(
    'DELETE FROM connections WHERE user_id = $1 AND (source_thought_id = $2 OR target_thought_id = $2)',
    [userId, thoughtId]
  );
  const { rowCount } = await db.query('DELETE FROM thoughts WHERE user_id = $1 AND id = $2', [userId, thoughtId]);
  return rowCount > 0;
}

async function listCollections(db, userId) {
  const { rows } = await db.query(
    'SELECT * FROM collections WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return rows.map(collectionFromRow);
}

const COLLECTION_COLUMNS =
  'id, name, description, color_variant, icon_type, origin, auto_reason, created_at, updated_at, is_saved';

function collectionRecord(c) {
  return {
    id: c.id,
    name: c.name,
    description: c.description,
    color_variant: c.colorVariant,
    icon_type: c.iconType,
    origin: c.origin,
    auto_reason: c.autoReason,
    is_saved: Boolean(c.isSaved),
    created_at: c.createdAt,
    updated_at: c.updatedAt,
  };
}

const COLLECTION_RECORD = `x(id text, name text, description text, color_variant text, icon_type text, origin text,
  auto_reason text, created_at timestamptz, updated_at timestamptz, is_saved boolean)`;

async function upsertCollection(db, userId, c) {
  const { rows } = await db.query(
    `INSERT INTO collections (user_id, ${COLLECTION_COLUMNS})
     SELECT $1, ${COLLECTION_COLUMNS} FROM jsonb_to_recordset($2::jsonb) AS ${COLLECTION_RECORD}
     ON CONFLICT (user_id, id) DO UPDATE SET
       name = EXCLUDED.name, description = EXCLUDED.description, color_variant = EXCLUDED.color_variant,
       icon_type = EXCLUDED.icon_type, origin = EXCLUDED.origin, auto_reason = EXCLUDED.auto_reason,
       is_saved = EXCLUDED.is_saved,
       updated_at = EXCLUDED.updated_at
     RETURNING *`,
    [userId, JSON.stringify([collectionRecord(c)])]
  );
  return collectionFromRow(rows[0]);
}

async function insertCollections(db, userId, collections) {
  if (collections.length === 0) return 0;
  const { rowCount } = await db.query(
    `INSERT INTO collections (user_id, ${COLLECTION_COLUMNS})
     SELECT $1, ${COLLECTION_COLUMNS} FROM jsonb_to_recordset($2::jsonb) AS ${COLLECTION_RECORD}
     ON CONFLICT DO NOTHING`,
    [userId, JSON.stringify(collections.map(collectionRecord))]
  );
  return rowCount;
}

async function deleteCollection(db, userId, collectionId) {
  const { rowCount } = await db.query('DELETE FROM collections WHERE user_id = $1 AND id = $2', [
    userId,
    collectionId,
  ]);
  return rowCount > 0;
}

async function listConnections(db, userId) {
  const { rows } = await db.query(
    'SELECT * FROM connections WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return rows.map(connectionFromRow);
}

const CONNECTION_COLUMNS = 'id, source_thought_id, target_thought_id, status, score, reason, created_at, updated_at';
const CONNECTION_RECORD = `x(id text, source_thought_id text, target_thought_id text, status text,
  score double precision, reason text, created_at timestamptz, updated_at timestamptz)`;

function connectionRecord(c) {
  return {
    id: c.id,
    source_thought_id: c.sourceThoughtId,
    target_thought_id: c.targetThoughtId,
    status: c.status,
    score: c.score,
    reason: c.reason,
    created_at: c.createdAt,
    updated_at: c.updatedAt,
  };
}

async function upsertConnection(db, userId, c) {
  const { rows } = await db.query(
    `INSERT INTO connections (user_id, ${CONNECTION_COLUMNS})
     SELECT $1, ${CONNECTION_COLUMNS} FROM jsonb_to_recordset($2::jsonb) AS ${CONNECTION_RECORD}
     ON CONFLICT (user_id, id) DO UPDATE SET
       status = EXCLUDED.status, score = EXCLUDED.score, reason = EXCLUDED.reason, updated_at = EXCLUDED.updated_at
     RETURNING *`,
    [userId, JSON.stringify([connectionRecord(c)])]
  );
  return connectionFromRow(rows[0]);
}

async function insertConnections(db, userId, connections) {
  if (connections.length === 0) return 0;
  const { rowCount } = await db.query(
    `INSERT INTO connections (user_id, ${CONNECTION_COLUMNS})
     SELECT $1, ${CONNECTION_COLUMNS} FROM jsonb_to_recordset($2::jsonb) AS ${CONNECTION_RECORD}
     ON CONFLICT DO NOTHING`,
    [userId, JSON.stringify(connections.map(connectionRecord))]
  );
  return rowCount;
}

async function deleteConnection(db, userId, connectionId) {
  const { rowCount } = await db.query('DELETE FROM connections WHERE user_id = $1 AND id = $2', [
    userId,
    connectionId,
  ]);
  return rowCount > 0;
}

async function listOrganizeEvents(db, userId) {
  const { rows } = await db.query(
    'SELECT * FROM organize_events WHERE user_id = $1 ORDER BY created_at DESC LIMIT 500',
    [userId]
  );
  return rows.map(organizeEventFromRow);
}

async function upsertOrganizeEvent(db, userId, e) {
  const { rows } = await db.query(
    `INSERT INTO organize_events (user_id, id, thought_id, action, collection_id, collection_name,
                                  partner_thought_id, reason, source, created_at, undone_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     ON CONFLICT (user_id, id) DO UPDATE SET undone_at = EXCLUDED.undone_at
     RETURNING *`,
    [userId, e.id, e.thoughtId, e.action, e.collectionId, e.collectionName, e.partnerThoughtId, e.reason,
      e.source, e.createdAt, e.undoneAt]
  );
  return organizeEventFromRow(rows[0]);
}

const CLEARABLE = {
  thoughts: 'thoughts',
  collections: 'collections',
  connections: 'connections',
  'organize-events': 'organize_events',
};

async function clearAll(db, userId, resource) {
  const table = CLEARABLE[resource];
  if (!table) throw new Error(`Unknown resource ${resource}`);
  await db.query(`DELETE FROM ${table} WHERE user_id = $1`, [userId]);
}

module.exports = {
  ValidationError,
  parseThought,
  parseCollection,
  parseConnection,
  parseOrganizeEvent,
  listThoughts,
  getThought,
  upsertThought,
  insertThoughts,
  deleteThought,
  listCollections,
  upsertCollection,
  insertCollections,
  deleteCollection,
  listConnections,
  upsertConnection,
  insertConnections,
  deleteConnection,
  listOrganizeEvents,
  upsertOrganizeEvent,
  clearAll,
};
