-- Collections can be saved (bookmarked) like thoughts, and appear on the Saved tab.
ALTER TABLE collections ADD COLUMN is_saved boolean NOT NULL DEFAULT false;
