CREATE TABLE sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT NOT NULL UNIQUE,
    feed_url TEXT NOT NULL,
    title TEXT,
    site_url TEXT,
    source_type TEXT NOT NULL CHECK(source_type IN ('starter_pack', 'user', 'opml_import')),
    pack_id TEXT,
    language TEXT NOT NULL DEFAULT 'en',
    quality_score REAL NOT NULL DEFAULT 0.5,
    weight REAL NOT NULL DEFAULT 1.0,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    create_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sources_source_type ON sources(source_type);
CREATE INDEX idx_sources_pack_id ON sources(pack_id);
CREATE INDEX idx_sources_feed_url ON sources(feed_url);

ALTER TABLE feeds ADD COLUMN source_id INTEGER REFERENCES sources(id) ON DELETE SET NULL;

CREATE INDEX idx_feeds_source_id ON feeds(source_id);
