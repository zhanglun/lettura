DROP INDEX IF EXISTS idx_ai_analysis_density;
DROP INDEX IF EXISTS idx_ai_analysis_duplicate;
ALTER TABLE article_ai_analysis DROP COLUMN information_density;
ALTER TABLE article_ai_analysis DROP COLUMN duplicate_of;
ALTER TABLE article_ai_analysis DROP COLUMN is_duplicate;
