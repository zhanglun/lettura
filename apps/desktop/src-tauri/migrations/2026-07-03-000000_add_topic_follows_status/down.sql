ALTER TABLE topic_follows RENAME TO topic_follows_old;
CREATE TABLE topic_follows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    followed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'followed',
    UNIQUE(topic_id)
);
INSERT INTO topic_follows (id, topic_id, followed_at, status) SELECT id, topic_id, followed_at, 'followed' FROM topic_follows_old;
DROP TABLE topic_follows_old;
CREATE INDEX idx_topic_follows_topic ON topic_follows(topic_id);
