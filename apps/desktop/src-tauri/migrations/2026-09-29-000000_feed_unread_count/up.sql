-- 订阅树未读数物化：feeds.unread_count 由写路径增量维护
-- （新文章入库 +N、标记已读 -N、退订/删源随行删除），替代每次
-- getSubscribes 时对 articles 的全表 GROUP BY（36k 行实测 217ms）。
-- 初值一次性回填；mark_as_read 批量路径在写后按实际差值回写。
ALTER TABLE feeds ADD COLUMN unread_count INTEGER NOT NULL DEFAULT 0;

UPDATE feeds SET unread_count = (
  SELECT COUNT(1) FROM articles A
  WHERE A.feed_uuid = feeds.uuid AND A.read_status = 1
);

CREATE INDEX idx_articles_feed_uuid_read_unread ON articles(feed_uuid, read_status) WHERE read_status = 1;
