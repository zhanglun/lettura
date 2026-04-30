CREATE TABLE topic_follows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    followed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(topic_id)
);
CREATE INDEX idx_topic_follows_topic ON topic_follows(topic_id);
