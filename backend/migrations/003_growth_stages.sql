-- Growth stages evolve automatically (seed -> sprout -> bloom) from how a thought
-- is tended. edit_count counts text edits; stage_manual means the user picked the
-- stage themselves, which stops automatic changes for that thought.
ALTER TABLE thoughts ADD COLUMN edit_count integer NOT NULL DEFAULT 0;
ALTER TABLE thoughts ADD COLUMN stage_manual boolean NOT NULL DEFAULT false;
