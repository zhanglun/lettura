-- Normalize articles.pub_date from RFC3339 (with timezone offset) to
-- 'YYYY-MM-DD HH:MM:SS' in UTC, matching create_date/update_date so that
-- string-order comparison in SQLite equals chronological order.
-- Rows with empty or unparseable pub_date are left untouched; the query
-- layer falls back to create_date for those via COALESCE.
UPDATE articles
SET pub_date = strftime('%Y-%m-%d %H:%M:%S', datetime(pub_date))
WHERE pub_date != ''
  AND datetime(pub_date) IS NOT NULL;
