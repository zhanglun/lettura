-- v2.6 Dedup & Compression: add duplicate tracking and information density columns
ALTER TABLE article_ai_analysis ADD COLUMN is_duplicate BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE article_ai_analysis ADD COLUMN duplicate_of INTEGER REFERENCES article_ai_analysis(id);
ALTER TABLE article_ai_analysis ADD COLUMN information_density REAL;

CREATE INDEX idx_ai_analysis_duplicate ON article_ai_analysis(is_duplicate);
CREATE INDEX idx_ai_analysis_density ON article_ai_analysis(information_density);
