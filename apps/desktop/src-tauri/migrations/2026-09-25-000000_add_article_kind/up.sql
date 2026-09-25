-- 类型落库（A 步）：把「文章 / 播客 / 平台」从**读路径的启发式判定**（TS 正则 + SQL JSON 扫描，
-- 一处谓词三份实现）改成**入库时写一次的列**。
--
-- 两条正交轴：
--   * articles.kind  —— 条目级：这条能不能站内播（audio enclosure）/ 是不是平台内容
--   * feeds.feed_type —— 源级：这源是什么（rss / podcast / platform:<generator-route>）
-- 前者由解析到的条目自身决定，后者由订阅时确定的生成器（或解析结果）决定，
-- 于是列表筛选/计数变成可索引的 WHERE，前端不必再自己实现一遍判定。

ALTER TABLE articles ADD COLUMN kind TEXT NOT NULL DEFAULT 'article';

-- 回填：与原先 article.rs 的 SQL 镜像同一标准
-- （B站/抖音/YouTube URL → platform；audio enclosure → podcast；否则 article）
UPDATE articles
SET kind = CASE
    WHEN (link || ' ' || COALESCE(feed_url, '')) LIKE '%bilibili.com%'
      OR (link || ' ' || COALESCE(feed_url, '')) LIKE '%b23.tv%'
      OR (link || ' ' || COALESCE(feed_url, '')) LIKE '%/bilibili/%'
      OR (link || ' ' || COALESCE(feed_url, '')) LIKE '%douyin.com%'
      OR (link || ' ' || COALESCE(feed_url, '')) LIKE '%/douyin/%'
      OR (link || ' ' || COALESCE(feed_url, '')) LIKE '%youtube.com%'
      OR (link || ' ' || COALESCE(feed_url, '')) LIKE '%youtu.be%' THEN 'platform'
    WHEN json_valid(COALESCE(media_object, '[]')) AND EXISTS (
      SELECT 1
      FROM json_each(COALESCE(media_object, '[]')) m, json_each(m.value, '$.content') c
      WHERE json_extract(c.value, '$.content_type') LIKE 'audio%'
    ) THEN 'podcast'
    ELSE 'article'
  END;

-- 源类型回填：先按生成器域名认出平台子类型（路由键 = platform:<route>，未知平台留给前端走通用徽章）
UPDATE feeds SET feed_type = 'platform:bilibili'
  WHERE (feed_url LIKE '%bilibili%' OR feed_url LIKE '%b23.tv%') AND feed_type NOT LIKE 'platform%';
UPDATE feeds SET feed_type = 'platform:douyin'
  WHERE feed_url LIKE '%douyin%' AND feed_type NOT LIKE 'platform%';
UPDATE feeds SET feed_type = 'platform:zhihu'
  WHERE feed_url LIKE '%zhihu%' AND feed_type NOT LIKE 'platform%';
UPDATE feeds SET feed_type = 'platform:weibo'
  WHERE feed_url LIKE '%weibo%' AND feed_type NOT LIKE 'platform%';
UPDATE feeds SET feed_type = 'platform:youtube'
  WHERE feed_url LIKE '%youtube%' AND feed_type NOT LIKE 'platform%';
UPDATE feeds SET feed_type = 'platform:newsletter'
  WHERE (feed_url LIKE '%substack%' OR feed_url LIKE '%buttondown%'
      OR feed_url LIKE '%beehiiv%' OR feed_url LIKE '%kill-the-newsletter%')
    AND feed_type NOT LIKE 'platform%';

-- 其余按条目形态归类（一个源只要出过平台/播客条目就按它算）
UPDATE feeds SET feed_type = 'platform'
  WHERE feed_type NOT LIKE 'platform%'
    AND EXISTS (SELECT 1 FROM articles WHERE articles.feed_uuid = feeds.uuid AND articles.kind = 'platform');
UPDATE feeds SET feed_type = 'podcast'
  WHERE feed_type <> 'podcast' AND feed_type NOT LIKE 'platform%'
    AND EXISTS (SELECT 1 FROM articles WHERE articles.feed_uuid = feeds.uuid AND articles.kind = 'podcast');
UPDATE feeds SET feed_type = 'rss' WHERE feed_type = '' OR feed_type IS NULL;

CREATE INDEX IF NOT EXISTS articles_kind ON articles(kind);
