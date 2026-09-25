-- C 步：载体（怎么消费）× 来源（要不要外跳）两轴，取代「文章/播客/平台」三桶
--   载体 carrier（条目级）：text | audio | video | email —— 决定"能不能站内播 / 要不要外跳"
--   来源 origin（源级）：native | generator:<route>        —— 决定"内容从哪来"（外跳与否由 载体×来源 推导）
ALTER TABLE articles RENAME COLUMN kind TO carrier;
UPDATE articles SET carrier = CASE carrier
  WHEN 'podcast' THEN 'audio'
  WHEN 'platform' THEN 'video'
  ELSE 'text' END;
DROP INDEX IF EXISTS articles_kind;
CREATE INDEX IF NOT EXISTS articles_carrier ON articles(carrier);

ALTER TABLE feeds RENAME COLUMN feed_type TO origin;
UPDATE feeds SET origin = 'generator:' || substr(origin, 10) WHERE origin LIKE 'platform:%';
UPDATE feeds SET origin = 'generator' WHERE origin = 'platform';
UPDATE feeds SET origin = 'native' WHERE origin IN ('rss', 'podcast', '');

ALTER TABLE feeds ADD COLUMN carrier TEXT NOT NULL DEFAULT 'text';
UPDATE feeds SET carrier = 'video'
  WHERE origin IN ('generator:bilibili', 'generator:douyin', 'generator:youtube');
UPDATE feeds SET carrier = 'email'
  WHERE origin IN ('generator:newsletter', 'generator:buttondown');
UPDATE feeds SET carrier = 'audio'
  WHERE carrier = 'text'
    AND EXISTS (SELECT 1 FROM articles WHERE articles.feed_uuid = feeds.uuid AND articles.carrier = 'audio');
