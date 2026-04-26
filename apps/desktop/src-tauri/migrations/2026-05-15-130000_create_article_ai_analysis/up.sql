CREATE TABLE article_ai_analysis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    signal_title TEXT,
    summary TEXT,
    why_it_matters TEXT,
    relevance_score REAL,
    topic_id INTEGER,
    embedding_id INTEGER,
    embedding_json TEXT,
    ai_processed_at TIMESTAMP,
    model_version TEXT,
    create_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(article_id)
);

CREATE INDEX idx_ai_analysis_article ON article_ai_analysis(article_id);
CREATE INDEX idx_ai_analysis_topic ON article_ai_analysis(topic_id);
CREATE INDEX idx_ai_analysis_score ON article_ai_analysis(relevance_score);
