-- Add indexes for common query patterns
-- These indexes improve performance for:
-- - Filtering articles by read_status
-- - Filtering articles by feed_uuid
-- - Sorting articles by pub_date
-- - Managing feeds by health_status

-- Index on articles.read_status for filtering unread/read articles
CREATE INDEX idx_articles_read_status ON articles(read_status);

-- Index on articles.feed_uuid for filtering by feed
CREATE INDEX idx_articles_feed_uuid ON articles(feed_uuid);

-- Index on articles.pub_date for sorting
CREATE INDEX idx_articles_pub_date ON articles(pub_date DESC);

-- Index on feeds.health_status for feed management
CREATE INDEX idx_feeds_health_status ON feeds(health_status);

-- Add composite index for common pattern: filtering by read_status AND sorting by pub_date
-- This optimizes queries like: SELECT ... WHERE read_status = 1 ORDER BY pub_date DESC
CREATE INDEX idx_articles_read_status_pub_date ON articles(read_status, pub_date DESC);

