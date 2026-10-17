-- Smart organising (AI) is on by default and stored per account, so turning it
-- off applies on every device and the server can refuse AI requests for it.
ALTER TABLE users ADD COLUMN smart_organizing boolean NOT NULL DEFAULT true;
