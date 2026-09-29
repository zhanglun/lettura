ALTER TABLE feeds DROP COLUMN unread_count;
DROP INDEX IF EXISTS idx_articles_feed_uuid_read_unread;
