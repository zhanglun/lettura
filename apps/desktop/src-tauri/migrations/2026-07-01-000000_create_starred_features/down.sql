DROP TABLE IF EXISTS article_tags;
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS article_collections;
DROP TABLE IF EXISTS collections;
-- SQLite doesn't support DROP COLUMN before 3.35.0, but we can recreate.
-- For safety, we'll just drop the new tables. The new columns in articles are harmless.
