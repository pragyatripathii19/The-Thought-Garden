-- Connections found by meaning: what kind of link it is and the subject both thoughts share.
ALTER TABLE connections ADD COLUMN kind text, ADD COLUMN subject text;
-- Which text of a thought was last checked for connections (a hash; "local:" when checked without the AI).
ALTER TABLE thoughts ADD COLUMN connect_checked text;
