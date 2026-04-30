CREATE TABLE IF NOT EXISTS topics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'active',
    article_count INTEGER NOT NULL DEFAULT 0,
    source_count INTEGER NOT NULL DEFAULT 0,
    first_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_topics_status ON topics(status);
CREATE INDEX IF NOT EXISTS idx_topics_last_updated ON topics(last_updated_at);

CREATE TABLE IF NOT EXISTS topic_articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic_id INTEGER NOT NULL,
    article_id INTEGER NOT NULL,
    relevance_score REAL NOT NULL DEFAULT 0.5,
    FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    UNIQUE(topic_id, article_id)
);

CREATE INDEX IF NOT EXISTS idx_topic_articles_topic ON topic_articles(topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_articles_article ON topic_articles(article_id);
