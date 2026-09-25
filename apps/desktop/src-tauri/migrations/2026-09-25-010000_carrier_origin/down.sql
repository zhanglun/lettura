DROP INDEX IF EXISTS articles_carrier;
UPDATE articles SET carrier = CASE carrier
  WHEN 'audio' THEN 'podcast'
  WHEN 'video' THEN 'platform'
  ELSE 'article' END;
ALTER TABLE articles RENAME COLUMN carrier TO kind;
CREATE INDEX IF NOT EXISTS articles_kind ON articles(kind);

UPDATE feeds SET origin = CASE
  WHEN origin LIKE 'generator:%' THEN 'platform:' || substr(origin, 11)
  WHEN origin = 'generator' THEN 'platform'
  ELSE 'rss' END;
ALTER TABLE feeds RENAME COLUMN origin TO feed_type;
ALTER TABLE feeds DROP COLUMN carrier;
