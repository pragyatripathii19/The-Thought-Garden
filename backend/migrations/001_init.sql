-- Accounts, sessions and each user's garden.
-- Garden rows are keyed by (user_id, id): ids are generated in the browser, and
-- every account starts with the same starter collection ids.

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  name text NOT NULL,
  reasons jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  last_active_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sessions (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);
CREATE INDEX sessions_user_idx ON sessions (user_id);

CREATE TABLE collections (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  id text NOT NULL,
  name text NOT NULL,
  description text,
  color_variant text,
  icon_type text,
  origin text,
  auto_reason text,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  PRIMARY KEY (user_id, id)
);

CREATE TABLE thoughts (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  id text NOT NULL,
  text text NOT NULL,
  stage text,
  category text,
  is_saved boolean NOT NULL DEFAULT false,
  organize_locked boolean NOT NULL DEFAULT false,
  classify_state text,
  classified_at timestamptz,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  PRIMARY KEY (user_id, id)
);
CREATE INDEX thoughts_user_created_idx ON thoughts (user_id, created_at DESC);

-- A thought's collections (Thought.collectionIds); is_auto marks the ones the organiser added.
CREATE TABLE thought_collections (
  user_id uuid NOT NULL,
  thought_id text NOT NULL,
  collection_id text NOT NULL,
  is_auto boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, thought_id, collection_id),
  FOREIGN KEY (user_id, thought_id) REFERENCES thoughts (user_id, id) ON DELETE CASCADE,
  FOREIGN KEY (user_id, collection_id) REFERENCES collections (user_id, id) ON DELETE CASCADE
);

CREATE TABLE connections (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  id text NOT NULL,
  source_thought_id text NOT NULL,
  target_thought_id text NOT NULL,
  status text NOT NULL,
  score double precision,
  reason text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  PRIMARY KEY (user_id, id)
);
-- One connection per pair of thoughts, in either direction.
CREATE UNIQUE INDEX connections_pair_idx ON connections (
  user_id,
  LEAST(source_thought_id, target_thought_id),
  GREATEST(source_thought_id, target_thought_id)
);

CREATE TABLE organize_events (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  id text NOT NULL,
  thought_id text NOT NULL,
  action text NOT NULL,
  collection_id text NOT NULL,
  collection_name text NOT NULL,
  partner_thought_id text,
  reason text NOT NULL DEFAULT '',
  source text NOT NULL,
  created_at timestamptz NOT NULL,
  undone_at timestamptz,
  PRIMARY KEY (user_id, id)
);

CREATE TABLE feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  category text NOT NULL,
  rating integer NOT NULL,
  message text NOT NULL,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX feedback_user_idx ON feedback (user_id);
