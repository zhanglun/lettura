-- Drop indexes added for common query patterns

DROP INDEX IF EXISTS idx_articles_read_status;
DROP INDEX IF EXISTS idx_articles_feed_uuid;
DROP INDEX IF EXISTS idx_articles_pub_date;
DROP INDEX IF EXISTS idx_feeds_health_status;

DROP INDEX IF EXISTS idx_articles_read_status_pub_date;

