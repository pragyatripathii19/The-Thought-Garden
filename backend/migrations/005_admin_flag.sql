-- Admins can be set per account in the database (UPDATE users SET is_admin = true ...),
-- in addition to the ADMIN_EMAILS environment variable.
ALTER TABLE users ADD COLUMN is_admin boolean NOT NULL DEFAULT false;
