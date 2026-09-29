use crate::core::config::get_user_config;
use chrono::{Duration, Utc};
use diesel::prelude::*;
use diesel::sql_types::*;
use serde::{Deserialize, Serialize};

use crate::db::establish_connection;
use crate::models;
use crate::schema;
use diesel::sqlite::SqliteConnection;

pub struct Article {}

#[derive(Debug, Serialize, Deserialize)]
pub enum ArticleReadStatus {
  UNREAD = 1,
  READ = 2,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ArticleFilter {
  pub feed_uuid: Option<String>,
  pub folder_uuid: Option<String>,
  pub item_type: Option<String>,
  pub is_today: Option<i32>,
  pub is_starred: Option<i32>,
  pub read_status: Option<i32>,
  pub collection_uuid: Option<String>,
  pub tag_uuid: Option<String>,
  pub is_archived: Option<i32>,
  pub is_read_later: Option<i32>,
  pub has_notes: Option<i32>,
  /// 载体过滤：text | audio | video | email
  pub carrier: Option<String>,
  /// 日期桶过滤（时间流每桶独立懒加载）：today | yesterday | week | lastweek | month | earlier。
  /// 口径与前端 buckets.ts 一致：发布时间优先缺省退创建时间，滚动窗口（本地时区）
  pub day_bucket: Option<String>,
  pub cursor: Option<i32>,
  pub limit: Option<i32>,
}

/// 过滤条件拼装（get_article 与 get_carrier_counts 共用）：
/// 返回 (SQL 片段, 绑定参数)，两者顺序一一对应。
/// `is_global`：WHERE 只引用 A.* 时为 true——计数查询可省去 feeds JOIN
/// （实测 36k 行 687ms → 37ms），行查询也可用 A.feed_uuid 替代 C.uuid。
pub fn article_filter_parts(
  filter: &ArticleFilter,
  connection: &mut SqliteConnection,
) -> ArticleFilterParts {
  let (conditions, params, uses_join) = article_filter_conditions(filter, connection);
  let where_clause = if conditions.is_empty() {
    String::new()
  } else {
    format!(" WHERE {}", conditions.join(" AND "))
  };
  ArticleFilterParts {
    conditions,
    params,
    where_clause,
    uses_join,
  }
}

pub struct ArticleFilterParts {
  pub conditions: Vec<String>,
  pub params: Vec<String>,
  /// 已拼好的 WHERE 片段（空条件为空串）
  pub where_clause: String,
  /// WHERE 是否引用了 feeds（C.*）——true 时计数不能省 JOIN
  pub uses_join: bool,
}

fn article_filter_conditions(
  filter: &ArticleFilter,
  connection: &mut SqliteConnection,
) -> (Vec<String>, Vec<String>, bool) {
  let mut conditions = vec![];
  let mut params = vec![];
  let mut uses_join = false;

  if let Some(channel_uuid) = &filter.feed_uuid {
    let mut relations = vec![];

    if let Some(item_type) = &filter.item_type {
      if item_type == "folder" {
        relations = schema::feed_metas::dsl::feed_metas
          .filter(schema::feed_metas::folder_uuid.eq(channel_uuid))
          .load::<models::FeedMeta>(connection)
          .expect("Expect find channel");
      } else {
        relations = schema::feed_metas::dsl::feed_metas
          .filter(schema::feed_metas::uuid.eq(channel_uuid))
          .load::<models::FeedMeta>(connection)
          .expect("Expect find channel");
      }
    }

    let mut channel_uuids: Vec<String> = vec![];

    log::debug!("relations {:?}", relations);

    if relations.len() > 0 {
      for relation in relations {
        channel_uuids.push(String::from(relation.uuid));
      }
    } else {
      channel_uuids.push(channel_uuid.clone());
    }

    let in_params = format!("?{}", ", ?".repeat(channel_uuids.len() - 1));
    // 行查询里 C 与 A 一一对应，用 A.feed_uuid 即可不引 JOIN；
    // 但计数查询也复用此片段，SQLite 允许引用未 JOIN 的列会报错——
    // 这里保持 C.uuid 形态并标记 uses_join，行查询同样带 JOIN（单源场景 20 行，无谓开销可忽略）
    conditions.push(format!("C.uuid in ({}) AND A.uuid IS NOT NULL", in_params));
    uses_join = true;
    for uuid in channel_uuids {
      params.push(uuid);
    }
  }

  if let Some(_is_today) = filter.is_today {
    conditions.push("DATE(A.create_date) = DATE('now')".to_string());
  }

  if let Some(is_starred) = filter.is_starred {
    conditions.push("A.starred = ?".to_string());
    params.push(is_starred.to_string());
  }

  if let Some(read_status) = filter.read_status {
    if read_status > 0 {
      conditions.push("A.read_status = ?".to_string());
      params.push(read_status.to_string());
    }
  }

  if let Some(_collection_uuid) = &filter.collection_uuid {
    conditions.push(
      "A.id IN (SELECT AC.article_id FROM article_collections AC JOIN collections COL ON COL.id = AC.collection_id WHERE COL.uuid = ?)"
        .to_string(),
    );
    params.push(_collection_uuid.clone());
  }

  if let Some(_tag_uuid) = &filter.tag_uuid {
    conditions.push(
      "A.id IN (SELECT AT.article_id FROM article_tags AT JOIN tags T ON T.id = AT.tag_id WHERE T.uuid = ?)"
        .to_string(),
    );
    params.push(_tag_uuid.clone());
  }

  if let Some(is_archived) = filter.is_archived {
    conditions.push("A.is_archived = ?".to_string());
    params.push(is_archived.to_string());
  }

  if let Some(is_read_later) = filter.is_read_later {
    conditions.push("A.is_read_later = ?".to_string());
    params.push(is_read_later.to_string());
  }

  if let Some(_has_notes) = filter.has_notes {
    if _has_notes > 0 {
      conditions.push("TRIM(A.notes) != ''".to_string());
    }
  }

  if let Some(carrier) = &filter.carrier {
    if ["text", "audio", "video", "email"].contains(&carrier.as_str()) {
      // 入库时判定一次（articles.carrier），这里只是可索引的等值过滤
      conditions.push("A.carrier = ?".to_string());
      params.push(carrier.clone());
    }
  }

  // 日期桶（滚动窗口，DATE 全在 A 上——不引入 JOIN）：
  //   today [今,今]  yesterday [昨,昨]  week [前天,6天前]  lastweek [7天前,13天前]
  //   month [14天前,29天前]  earlier [<29天前]
  // 排序时刻 = COALESCE(NULLIF(pub_date,''), create_date)，与前端 buckets.ts 同口径
  if let Some(bucket) = &filter.day_bucket {
    let d = "DATE(COALESCE(NULLIF(A.pub_date, ''), A.create_date))";
    let range: Option<(String, String)> = match bucket.as_str() {
      "today" => Some((
        format!("{d} <= DATE('now', 'localtime')"),
        format!("{d} >= DATE('now', 'localtime')"),
      )),
      "yesterday" => Some((
        format!("{d} <= DATE('now', 'localtime', '-1 day')"),
        format!("{d} >= DATE('now', 'localtime', '-1 day')"),
      )),
      "week" => Some((
        format!("{d} <= DATE('now', 'localtime', '-2 day')"),
        format!("{d} >= DATE('now', 'localtime', '-6 day')"),
      )),
      "lastweek" => Some((
        format!("{d} <= DATE('now', 'localtime', '-7 day')"),
        format!("{d} >= DATE('now', 'localtime', '-13 day')"),
      )),
      "month" => Some((
        format!("{d} <= DATE('now', 'localtime', '-14 day')"),
        format!("{d} >= DATE('now', 'localtime', '-29 day')"),
      )),
      "earlier" => Some((
        format!("{d} < DATE('now', 'localtime', '-29 day')"),
        "1 = 1".to_string(),
      )),
      _ => None,
    };
    if let Some((upper, lower)) = range {
      conditions.push(format!("({upper} AND {lower})"));
    }
  }

  (conditions, params, uses_join)
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MarkAllUnreadParam {
  pub uuid: Option<String>,
  pub is_today: Option<bool>,
  pub is_all: Option<bool>,
}

#[derive(Debug, Queryable, Serialize, QueryableByName)]
pub struct ArticleDetailResult {
  #[diesel(sql_type = Integer)]
  pub id: i32,
  #[diesel(sql_type = Text)]
  pub uuid: String,
  #[diesel(sql_type = Text)]
  pub feed_uuid: String,
  #[diesel(sql_type = Text)]
  pub feed_title: String,
  #[diesel(sql_type = Text)]
  pub feed_logo: String,
  #[diesel(sql_type = Text)]
  pub feed_url: String,
  #[diesel(sql_type = Text)]
  pub link: String,
  #[diesel(sql_type = Text)]
  pub title: String,
  #[diesel(sql_type = Text)]
  pub description: String,
  #[diesel(sql_type = Text)]
  pub content: String,
  #[diesel(sql_type = Text)]
  pub author: String,
  #[diesel(sql_type = Text)]
  pub pub_date: String,
  #[diesel(sql_type = Text)]
  pub create_date: String,
  #[diesel(sql_type = Integer)]
  pub read_status: i32,
  #[diesel(sql_type = Text)]
  pub media_object: String,
  #[diesel(sql_type = Integer)]
  pub starred: i32,
  #[diesel(sql_type = Nullable<Text>)]
  pub starred_at: Option<String>,
  #[diesel(sql_type = Nullable<Integer>)]
  pub is_archived: Option<i32>,
  #[diesel(sql_type = Nullable<Integer>)]
  pub is_read_later: Option<i32>,
  #[diesel(sql_type = Nullable<Text>)]
  pub notes: Option<String>,
  #[diesel(sql_type = Text)]
  pub carrier: String,
  #[diesel(sql_type = Text)]
  pub origin: String,
  #[diesel(sql_type = Text)]
  pub feed_carrier: String,
}

#[derive(Debug, Queryable, Serialize, QueryableByName)]
pub struct ArticleQueryItem {
  #[diesel(sql_type = Integer)]
  pub id: i32,
  #[diesel(sql_type = Text)]
  pub uuid: String,
  #[diesel(sql_type = Text)]
  pub feed_uuid: String,
  #[diesel(sql_type = Text)]
  pub feed_title: String,
  #[diesel(sql_type = Text)]
  pub feed_url: String,
  #[diesel(sql_type = Text)]
  pub feed_logo: String,
  #[diesel(sql_type = Text)]
  pub link: String,
  #[diesel(sql_type = Text)]
  pub title: String,
  #[diesel(sql_type = Text)]
  pub description: String,
  #[diesel(sql_type = Text)]
  pub author: String,
  #[diesel(sql_type = Text)]
  pub pub_date: String,
  #[diesel(sql_type = Text)]
  pub create_date: String,
  #[diesel(sql_type = Integer)]
  pub read_status: i32,
  #[diesel(sql_type = Text)]
  pub media_object: String,
  /// 载体：text | audio | video | email
  #[diesel(sql_type = Text)]
  pub carrier: String,
  /// 来源：native | generator:<route>
  #[diesel(sql_type = Text)]
  pub origin: String,
  #[diesel(sql_type = Text)]
  pub feed_carrier: String,
  #[diesel(sql_type = Integer)]
  pub starred: i32,
  #[diesel(sql_type = Integer)]
  pub is_duplicate: i32,
  #[diesel(sql_type = Nullable<Text>)]
  pub starred_at: Option<String>,
  #[diesel(sql_type = Nullable<Integer>)]
  pub is_archived: Option<i32>,
  #[diesel(sql_type = Nullable<Integer>)]
  pub is_read_later: Option<i32>,
  #[diesel(sql_type = Nullable<Text>)]
  pub notes: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct ArticleQueryResult {
  list: Vec<ArticleQueryItem>,
  /// 同条件总数（不衰减分页），过滤条「全部」的真实计数
  total: i64,
}

/// 类型过滤条计数：文章 / 播客 / 平台（服务端全量）
#[derive(Debug, Serialize, QueryableByName)]
pub struct CarrierCounts {
  #[diesel(sql_type = diesel::sql_types::BigInt)]
  pub text: i64,
  #[diesel(sql_type = diesel::sql_types::BigInt)]
  pub audio: i64,
  #[diesel(sql_type = diesel::sql_types::BigInt)]
  pub video: i64,
  #[diesel(sql_type = diesel::sql_types::BigInt)]
  pub email: i64,
}

/// 同条件单趟扫描的产出：总数 + 四档载体计数 + 日期桶分布（get_article_summary 用）。
/// 日期桶与前端 buckets.ts 同口径（滚动窗口）：week=前天~6天前、lastweek=7~13、
/// month=14~29；earlier = total − 五桶（前端推导）。
#[derive(Debug, QueryableByName, Serialize)]
pub struct ArticleSummary {
  #[diesel(sql_type = diesel::sql_types::BigInt)]
  pub total: i64,
  #[diesel(sql_type = diesel::sql_types::BigInt)]
  pub text: i64,
  #[diesel(sql_type = diesel::sql_types::BigInt)]
  pub audio: i64,
  #[diesel(sql_type = diesel::sql_types::BigInt)]
  pub video: i64,
  #[diesel(sql_type = diesel::sql_types::BigInt)]
  pub email: i64,
  #[diesel(sql_type = diesel::sql_types::BigInt)]
  pub day_today: i64,
  #[diesel(sql_type = diesel::sql_types::BigInt)]
  pub day_yesterday: i64,
  #[diesel(sql_type = diesel::sql_types::BigInt)]
  pub day_week: i64,
  #[diesel(sql_type = diesel::sql_types::BigInt)]
  pub day_lastweek: i64,
  #[diesel(sql_type = diesel::sql_types::BigInt)]
  pub day_month: i64,
}

/// COUNT(1) 查询的结果承载
#[derive(Debug, QueryableByName)]
struct TotalCountRow {
  #[diesel(sql_type = diesel::sql_types::BigInt)]
  total: i64,
}

#[derive(Debug, Clone, Queryable, Serialize, QueryableByName)]
pub struct CollectionMeta {
  #[diesel(sql_type=Integer)]
  total: i32,
  #[diesel(sql_type=Integer)]
  today: i32,
}

impl Article {
  /// get articles
  pub fn get_article(filter: ArticleFilter) -> ArticleQueryResult {
    let mut connection = establish_connection();
    let mut query = diesel::sql_query(
      "
    SELECT
      A.id, A.uuid,
      A.feed_uuid,
      C.title as feed_title,
      C.link as feed_url,
      C.logo as feed_logo,
      A.link,
      A.title,
      A.feed_url,
      A.description as description,
      A.author,
      A.pub_date,
      A.create_date,
      A.read_status,
      A.starred,
      COALESCE(A.media_object, '') as media_object,
      A.carrier as carrier,
      COALESCE(C.origin, 'native') as origin,
      COALESCE(C.carrier, 'text') as feed_carrier,
      COALESCE(AAA.is_duplicate, 0) as is_duplicate,
      A.starred_at,
      A.is_archived,
      A.is_read_later,
      A.notes
    FROM
      articles as A
    LEFT JOIN
      feeds as C
    ON C.uuid = A.feed_uuid
    LEFT JOIN
      article_ai_analysis as AAA
    ON AAA.article_id = A.id",
    )
    .into_boxed();
    let mut limit = 12;
    let parts = article_filter_parts(&filter, &mut connection);

    if parts.conditions.len() > 0 {
      query = query.sql(parts.where_clause.clone());
    }

    for param in &parts.params {
      query = query.bind::<Text, _>(param.clone());
    }
    query = query.sql(" ORDER BY COALESCE(NULLIF(A.pub_date, ''), A.create_date) DESC ");

    // 同条件计数（不含 limit/offset），供过滤条展示真实总数。
    // 全局过滤（WHERE 只引用 A.*）省去 feeds JOIN——36k 行实测 687ms → 37ms；
    // 单源/分组过滤引用了 C.uuid，保留 JOIN（行数少，无谓开销可忽略）。
    let count_from = if parts.uses_join {
      " FROM articles as A LEFT JOIN feeds as C ON C.uuid = A.feed_uuid"
    } else {
      " FROM articles as A"
    };
    let mut count_query = diesel::sql_query(format!(
      "SELECT COUNT(1) AS total{count_from}{}",
      parts.where_clause
    ))
    .into_boxed();
    for param in &parts.params {
      count_query = count_query.bind::<Text, _>(param.clone());
    }
    let total = count_query
      .load::<TotalCountRow>(&mut connection)
      .expect("Expect counting articles")
      .first()
      .map(|r| r.total)
      .unwrap_or(0);

    if let Some(l) = filter.limit {
      query = query.sql(" limit ?").bind::<Integer, _>(l);
      limit = l.clone();
    }

    if let Some(c) = filter.cursor {
      query = query.sql(" OFFSET ?").bind::<Integer, _>((c - 1) * limit);
    }

    let result = query
      .load::<ArticleQueryItem>(&mut connection)
      .expect("Expect loading articles");

    ArticleQueryResult {
      list: result,
      total,
    }
  }

  /// 同条件单趟扫描：total 与四档载体计数一次聚合产出。
  /// 前端首屏原来并行发 COUNT + carrier-counts 两个带 JOIN 的全表聚合
  /// （实测 687ms + 3187ms），合并后且全局过滤免 JOIN，一次 ~30ms。
  pub fn get_article_summary(filter: ArticleFilter) -> ArticleSummary {
    let mut connection = establish_connection();
    let parts = article_filter_parts(&filter, &mut connection);

    let from = if parts.uses_join {
      " FROM articles as A LEFT JOIN feeds as C ON C.uuid = A.feed_uuid"
    } else {
      " FROM articles as A"
    };
    let mut query = diesel::sql_query(format!(
      "SELECT
      COUNT(1) AS total,
      COALESCE(SUM(CASE WHEN A.carrier = 'text' THEN 1 ELSE 0 END), 0) AS text,
      COALESCE(SUM(CASE WHEN A.carrier = 'audio' THEN 1 ELSE 0 END), 0) AS audio,
      COALESCE(SUM(CASE WHEN A.carrier = 'video' THEN 1 ELSE 0 END), 0) AS video,
      COALESCE(SUM(CASE WHEN A.carrier = 'email' THEN 1 ELSE 0 END), 0) AS email,
      COALESCE(SUM(CASE WHEN DATE(COALESCE(NULLIF(A.pub_date, ''), A.create_date)) = DATE('now', 'localtime') THEN 1 ELSE 0 END), 0) AS day_today,
      COALESCE(SUM(CASE WHEN DATE(COALESCE(NULLIF(A.pub_date, ''), A.create_date)) = DATE('now', 'localtime', '-1 day') THEN 1 ELSE 0 END), 0) AS day_yesterday,
      COALESCE(SUM(CASE WHEN DATE(COALESCE(NULLIF(A.pub_date, ''), A.create_date)) BETWEEN DATE('now', 'localtime', '-6 day') AND DATE('now', 'localtime', '-2 day') THEN 1 ELSE 0 END), 0) AS day_week,
      COALESCE(SUM(CASE WHEN DATE(COALESCE(NULLIF(A.pub_date, ''), A.create_date)) BETWEEN DATE('now', 'localtime', '-13 day') AND DATE('now', 'localtime', '-7 day') THEN 1 ELSE 0 END), 0) AS day_lastweek,
      COALESCE(SUM(CASE WHEN DATE(COALESCE(NULLIF(A.pub_date, ''), A.create_date)) BETWEEN DATE('now', 'localtime', '-29 day') AND DATE('now', 'localtime', '-14 day') THEN 1 ELSE 0 END), 0) AS day_month
    {from}{}",
      parts.where_clause
    ))
    .into_boxed();

    for param in &parts.params {
      query = query.bind::<Text, _>(param.clone());
    }

    query
      .load::<ArticleSummary>(&mut connection)
      .expect("Expect loading article summary")
      .into_iter()
      .next()
      .unwrap_or(ArticleSummary {
        total: 0,
        text: 0,
        audio: 0,
        video: 0,
        email: 0,
        day_today: 0,
        day_yesterday: 0,
        day_week: 0,
        day_lastweek: 0,
        day_month: 0,
      })
  }

  /// 类型过滤条的真实计数（服务端全量，不随分页衰减）：
  /// 与 get_article 同一套过滤条件，只是不分页、按类型分组。
  /// 首屏路径请改用 get_article_summary（一趟出 total + 四档）；
  /// 本函数保留给只需要载体计数的调用方。
  pub fn get_carrier_counts(filter: ArticleFilter) -> CarrierCounts {
    let summary = Self::get_article_summary(filter);
    CarrierCounts {
      text: summary.text,
      audio: summary.audio,
      video: summary.video,
      email: summary.email,
    }
  }

  pub fn get_collection_metas() -> Option<CollectionMeta> {
    let mut connection = establish_connection();
    let mut query = diesel::sql_query("").into_boxed();

    query = query.sql(
      "
      SELECT
        COUNT(1) AS today,
        (SELECT COUNT(1) FROM articles WHERE read_status = 1) AS total
      FROM articles
      WHERE DATE(create_date) = DATE('now') AND read_status = 1",
    );

    let mut result: Vec<CollectionMeta> = query
      .load::<CollectionMeta>(&mut connection)
      .expect("Expect loading articles");

    if result.len() == 1 {
      return result.pop();
    } else {
      return None;
    }
  }

  pub fn get_article_with_uuid(uuid: String) -> Option<ArticleDetailResult> {
    let mut connection = establish_connection();
    let query = diesel::sql_query(
      "
     SELECT
              A.id,
              A.uuid,
              A.feed_uuid,
              C.title as feed_title,
              C.logo as feed_logo,
              A.feed_url,
              A.link,
              A.title,
              A.description as description,
              A.content as content,
              A.author,
              A.pub_date,
              A.create_date,
              A.read_status,
               COALESCE(A.media_object, '') as media_object,
               A.carrier as carrier,
               COALESCE(C.origin, 'native') as origin,
               COALESCE(C.carrier, 'text') as feed_carrier,
               A.starred,
               A.starred_at,
               A.is_archived,
               A.is_read_later,
               A.notes
            FROM
              articles as A
            LEFT JOIN
              feeds as C ON C.uuid = A.feed_uuid
            WHERE
              A.uuid = ?
    ",
    )
    .bind::<Text, _>(uuid);

    let mut result = query
      .load::<ArticleDetailResult>(&mut connection)
      .unwrap_or(vec![]);

    return if result.len() == 1 {
      result.pop()
    } else {
      None
    };
  }

  pub fn mark_as_read(params: MarkAllUnreadParam) -> usize {
    if let Some(uuid) = params.uuid {
      return Self::update_articles_read_status_channel(uuid);
    }

    if let Some(_is_today) = params.is_today {
      return Self::mark_today_as_read();
    }

    if let Some(_is_all) = params.is_all {
      return Self::mark_all_as_read();
    }

    0
  }

  pub fn mark_today_as_read() -> usize {
    let mut connection = establish_connection();
    // 先收集受影响源再改状态：物化计数按差值回写（迁移 2026-09-29）
    let affected: Vec<String> = schema::articles::dsl::articles
      .filter(schema::articles::create_date.eq(diesel::dsl::now))
      .filter(schema::articles::read_status.eq(1))
      .select(schema::articles::feed_uuid)
      .distinct()
      .load(&mut connection)
      .unwrap_or(vec![]);
    let result = diesel::update(
      schema::articles::dsl::articles
        .filter(schema::articles::create_date.eq(diesel::dsl::now))
        .filter(schema::articles::read_status.eq(1)),
    )
    .set(schema::articles::read_status.eq(2))
    .execute(&mut connection);

    match result {
      Ok(changed) => {
        crate::feed::channel::recalc_unread_count(&affected);
        changed
      }
      Err(_) => 0,
    }
  }

  pub fn mark_all_as_read() -> usize {
    let mut connection = establish_connection();
    let affected: Vec<String> = schema::articles::dsl::articles
      .filter(schema::articles::read_status.eq(1))
      .select(schema::articles::feed_uuid)
      .distinct()
      .load(&mut connection)
      .unwrap_or(vec![]);
    let result =
      diesel::update(schema::articles::dsl::articles.filter(schema::articles::read_status.eq(1)))
        .set(schema::articles::read_status.eq(2))
        .execute(&mut connection);

    match result {
      Ok(changed) => {
        crate::feed::channel::recalc_unread_count(&affected);
        changed
      }
      Err(_) => 0,
    }
  }

  pub fn update_article_read_status(uuid: String, status: i32) -> usize {
    let mut connection = establish_connection();
    let article = Self::get_article_with_uuid(String::from(&uuid));

    match article {
      Some(_article) => {
        // 物化计数：1(未读)→2(已读) -1；2→1 +1（迁移 2026-09-29）
        let delta: i32 = match (_article.read_status, status) {
          (1, s) if s != 1 => -1,
          (s, 1) if s != 1 => 1,
          _ => 0,
        };
        let res =
          diesel::update(schema::articles::dsl::articles.filter(schema::articles::uuid.eq(&uuid)))
            .set(schema::articles::read_status.eq(status))
            .execute(&mut connection);

        if delta != 0 && matches!(res, Ok(1)) {
          crate::feed::channel::adjust_unread_count(&[_article.feed_uuid.clone()], delta);
        }

        match res {
          Ok(r) => r,
          Err(_) => 0,
        }
      }
      None => 0,
    }
  }

  pub fn update_article_star_status(uuid: String, status: i32) -> usize {
    let mut connection = establish_connection();
    let article = Self::get_article_with_uuid(String::from(&uuid));

    if let Some(article) = article {
      let starred_at = if status == 1 {
        chrono::Utc::now()
          .naive_utc()
          .format("%Y-%m-%d %H:%M:%S")
          .to_string()
      } else {
        String::from("")
      };
      let res =
        diesel::update(schema::articles::dsl::articles.filter(schema::articles::uuid.eq(&uuid)))
          .set((
            schema::articles::starred.eq(status as i32),
            schema::articles::starred_at.eq(starred_at),
          ))
          .execute(&mut connection)
          .unwrap_or(0);
      res
    } else {
      0
    }
  }

  pub fn update_article_read_later_status(uuid: String, status: i32) -> usize {
    let mut connection = establish_connection();
    let article = Self::get_article_with_uuid(String::from(&uuid));

    if article.is_none() {
      return 0;
    }

    diesel::update(schema::articles::dsl::articles.filter(schema::articles::uuid.eq(&uuid)))
      .set(schema::articles::is_read_later.eq(status as i32))
      .execute(&mut connection)
      .unwrap_or(0)
  }

  pub fn update_articles_read_status_channel(uuid: String) -> usize {
    let mut connection = establish_connection();
    let mut channel_uuids: Vec<String> = vec![];
    let relations = schema::feed_metas::dsl::feed_metas
      .filter(schema::feed_metas::folder_uuid.eq(&uuid))
      .load::<models::FeedMeta>(&mut connection)
      .expect("Expect find channel");

    if relations.len() > 0 {
      for relation in relations {
        if relation.folder_uuid == uuid {
          let uuid = String::from(relation.uuid);

          channel_uuids.push(uuid.clone());
        }
      }
    } else {
      channel_uuids.push(uuid);
    }
    let result = diesel::update(
      schema::articles::dsl::articles
        .filter(schema::articles::feed_uuid.eq_any(channel_uuids.clone()))
        .filter(schema::articles::read_status.eq(1)),
    )
    .set(schema::articles::read_status.eq(2))
    .execute(&mut connection);

    match result {
      // 组头「全部已读」涉及多源，按实际值校准物化计数（迁移 2026-09-29）
      Ok(changed) => {
        crate::feed::channel::recalc_unread_count(&channel_uuids);
        changed
      }
      Err(_) => 0,
    }
  }

  pub fn add_articles(channel_uuid: String, articles: Vec<models::NewArticle>) -> usize {
    let mut connection = establish_connection();
    let channel = schema::feeds::dsl::feeds
      .filter(schema::feeds::uuid.eq(&channel_uuid))
      .load::<models::Feed>(&mut connection)
      .expect("Expect find channel");

    if channel.len() == 1 {
      let result = diesel::insert_or_ignore_into(schema::articles::dsl::articles)
        .values(articles)
        .execute(&mut connection)
        .expect("Expect add articles");

      // 同步入库的新条目默认未读：物化计数按插入数递增（迁移 2026-09-29）
      if result > 0 {
        crate::feed::channel::adjust_unread_count(&[channel_uuid], result as i32);
      }

      return result;
    } else {
      return 0;
    }
  }

  pub fn purge_articles() -> usize {
    let cfg = get_user_config();

    if cfg.purge_on_days == 0 {
      return 0;
    }

    let expired_date = Utc::now().naive_utc() - Duration::days(cfg.purge_on_days as i64);
    let mut connection = establish_connection();
    let mut query = diesel::delete(schema::articles::dsl::articles).into_boxed();

    if !cfg.purge_unread_articles {
      query = query.filter(schema::articles::read_status.eq(2));
    }

    let query = query
      .filter(schema::articles::create_date.lt(expired_date))
      .filter(schema::articles::starred.eq(0))
      .filter(schema::articles::is_archived.eq(0));

    match query.execute(&mut connection) {
      Ok(r) => {
        log::info!("{:?} articles purged", r);
        r
      }
      Err(e) => {
        log::error!("purge failed: {}", e);
        0
      }
    }
  }

  pub fn purge_by_data_retention() -> usize {
    let cfg = get_user_config();

    if cfg.data_retention_days == 0 {
      return 0;
    }

    let cutoff = Utc::now().naive_utc() - Duration::days(cfg.data_retention_days as i64);
    let mut connection = establish_connection();

    match diesel::delete(schema::articles::dsl::articles)
      .filter(schema::articles::read_status.eq(2))
      .filter(schema::articles::create_date.lt(cutoff))
      .filter(schema::articles::starred.eq(0))
      .filter(schema::articles::is_archived.eq(0))
      .execute(&mut connection)
    {
      Ok(r) => {
        log::info!("{:?} read articles purged by data retention", r);
        r
      }
      Err(e) => {
        log::error!("data retention purge failed: {}", e);
        0
      }
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::{db, models, schema};
  use diesel::prelude::*;
  use diesel::sqlite::SqliteConnection;

  fn insert_test_feed(conn: &mut SqliteConnection) -> String {
    let feed_uuid = uuid::Uuid::new_v4().hyphenated().to_string();
    diesel::insert_into(schema::feeds::table)
      .values(models::NewFeed {
        provider: "rss".to_string(),
            account_uuid: None,
            source_config: None,
        uuid: feed_uuid.clone(),
        origin: "native".to_string(),
        carrier: "text".to_string(),
        title: "Test Feed".to_string(),
        link: format!("https://{}.example.com", &feed_uuid[..8]),
        logo: "".to_string(),
        feed_url: format!("https://{}.example.com/feed.xml", &feed_uuid[..8]),
        description: "Test".to_string(),
        pub_date: "2024-01-01 00:00:00".to_string(),
        updated: "2024-01-01 00:00:00".to_string(),
        sort: 0,
      })
      .execute(conn)
      .expect("Failed to insert feed");
    feed_uuid
  }

  fn insert_test_article(conn: &mut SqliteConnection, feed_uuid: &str) -> (i32, String) {
    let article_uuid = uuid::Uuid::new_v4().hyphenated().to_string();
    let id: i32 = diesel::insert_into(schema::articles::table)
      .values(models::NewArticle {
        uuid: article_uuid.clone(),
        feed_uuid: feed_uuid.to_string(),
        title: format!("Test Article {}", uuid::Uuid::new_v4()),
        link: format!("https://example.com/a/{}", uuid::Uuid::new_v4()),
        feed_url: format!("https://example.com/f/{}", uuid::Uuid::new_v4()),
        description: "Test".to_string(),
        content: "Content".to_string(),
        author: "Author".to_string(),
        pub_date: "2024-01-01 00:00:00".to_string(),
        media_object: "".to_string(),
        carrier: "text".to_string(),
      })
      .returning(schema::articles::id)
      .get_result(conn)
      .expect("Failed to insert article");
    (id, article_uuid)
  }

  fn set_article_attrs(
    conn: &mut SqliteConnection,
    article_id: i32,
    starred: i32,
    is_archived: i32,
    notes: &str,
    is_read_later: i32,
  ) {
    diesel::update(schema::articles::table.filter(schema::articles::id.eq(article_id)))
      .set((
        schema::articles::starred.eq(starred),
        schema::articles::is_archived.eq(is_archived),
        schema::articles::notes.eq(notes),
        schema::articles::is_read_later.eq(is_read_later),
      ))
      .execute(conn)
      .expect("Failed to update article attrs");
  }

  fn make_filter(feed_uuid: &str) -> ArticleFilter {
    ArticleFilter {
      feed_uuid: Some(feed_uuid.to_string()),
      folder_uuid: None,
      item_type: None,
      is_today: None,
      is_starred: None,
      read_status: None,
      collection_uuid: None,
      tag_uuid: None,
      is_archived: None,
      is_read_later: None,
      has_notes: None,
      carrier: None,
      day_bucket: None,
      cursor: None,
      limit: None,
    }
  }

  #[test]
  fn test_article_filters() {
    let mut conn = db::establish_connection();
    let feed_uuid = insert_test_feed(&mut conn);

    // Given: Article A — starred=1, is_archived=0, notes="important", is_read_later=0
    let (id_a, uuid_a) = insert_test_article(&mut conn, &feed_uuid);
    set_article_attrs(&mut conn, id_a, 1, 0, "important", 0);

    // Given: Article B — starred=1, is_archived=1, notes="", is_read_later=1
    let (id_b, uuid_b) = insert_test_article(&mut conn, &feed_uuid);
    set_article_attrs(&mut conn, id_b, 1, 1, "", 1);

    // Given: Article C — starred=0, is_archived=0, notes="", is_read_later=1
    let (id_c, uuid_c) = insert_test_article(&mut conn, &feed_uuid);
    set_article_attrs(&mut conn, id_c, 0, 0, "", 1);

    // Given: Article D — starred=1, is_archived=0, notes="", is_read_later=0
    let (id_d, uuid_d) = insert_test_article(&mut conn, &feed_uuid);
    set_article_attrs(&mut conn, id_d, 1, 0, "", 0);

    // Given: collection linked to Article A
    let coll_uuid = uuid::Uuid::new_v4().hyphenated().to_string();
    let coll_id: i32 = diesel::insert_into(schema::collections::table)
      .values(models::NewCollection {
        uuid: coll_uuid.clone(),
        name: format!("Test Collection {}", uuid::Uuid::new_v4()),
        description: "".to_string(),
        icon: "".to_string(),
        sort_order: 0,
      })
      .returning(schema::collections::id)
      .get_result(&mut conn)
      .expect("Failed to insert collection");

    diesel::insert_into(schema::article_collections::table)
      .values(models::NewArticleCollection {
        article_id: id_a,
        collection_id: coll_id,
      })
      .execute(&mut conn)
      .expect("Failed to link article to collection");

    // Given: tag linked to Article D
    let tag_uuid = uuid::Uuid::new_v4().hyphenated().to_string();
    let tag_id: i32 = diesel::insert_into(schema::tags::table)
      .values(models::NewTag {
        uuid: tag_uuid.clone(),
        name: format!("filter_tag_{}", uuid::Uuid::new_v4().hyphenated()),
      })
      .returning(schema::tags::id)
      .get_result(&mut conn)
      .expect("Failed to insert tag");

    diesel::insert_into(schema::article_tags::table)
      .values(models::NewArticleTag {
        article_id: id_d,
        tag_id,
      })
      .execute(&mut conn)
      .expect("Failed to link article to tag");

    // When/Then: is_starred=1 returns A, B, D
    let result = Article::get_article(ArticleFilter {
      is_starred: Some(1),
      ..make_filter(&feed_uuid)
    });
    let uuids: Vec<String> = result.list.iter().map(|a| a.uuid.clone()).collect();
    assert_eq!(
      uuids.len(),
      3,
      "Starred filter should return 3 articles (A, B, D)"
    );
    assert!(uuids.contains(&uuid_a), "Starred should contain A");
    assert!(uuids.contains(&uuid_b), "Starred should contain B");
    assert!(uuids.contains(&uuid_d), "Starred should contain D");

    // When/Then: is_archived=1 returns only B
    let result = Article::get_article(ArticleFilter {
      is_archived: Some(1),
      ..make_filter(&feed_uuid)
    });
    let uuids: Vec<String> = result.list.iter().map(|a| a.uuid.clone()).collect();
    assert_eq!(
      uuids.len(),
      1,
      "Archived filter should return 1 article (B)"
    );
    assert!(uuids.contains(&uuid_b), "Archived should contain B");

    // When/Then: is_read_later=1 returns B, C
    let result = Article::get_article(ArticleFilter {
      is_read_later: Some(1),
      ..make_filter(&feed_uuid)
    });
    let uuids: Vec<String> = result.list.iter().map(|a| a.uuid.clone()).collect();
    assert_eq!(
      uuids.len(),
      2,
      "Read later filter should return 2 articles (B, C)"
    );
    assert!(uuids.contains(&uuid_b), "Read later should contain B");
    assert!(uuids.contains(&uuid_c), "Read later should contain C");

    // When/Then: collection_uuid returns only A
    let result = Article::get_article(ArticleFilter {
      collection_uuid: Some(coll_uuid),
      ..make_filter(&feed_uuid)
    });
    let uuids: Vec<String> = result.list.iter().map(|a| a.uuid.clone()).collect();
    assert_eq!(
      uuids.len(),
      1,
      "Collection filter should return 1 article (A)"
    );
    assert!(uuids.contains(&uuid_a), "Collection should contain A");

    // When/Then: tag_uuid returns only D
    let result = Article::get_article(ArticleFilter {
      tag_uuid: Some(tag_uuid),
      ..make_filter(&feed_uuid)
    });
    let uuids: Vec<String> = result.list.iter().map(|a| a.uuid.clone()).collect();
    assert_eq!(uuids.len(), 1, "Tag filter should return 1 article (D)");
    assert!(uuids.contains(&uuid_d), "Tag filter should contain D");

    // When/Then: has_notes=1 returns only A
    let result = Article::get_article(ArticleFilter {
      has_notes: Some(1),
      ..make_filter(&feed_uuid)
    });
    let uuids: Vec<String> = result.list.iter().map(|a| a.uuid.clone()).collect();
    assert_eq!(
      uuids.len(),
      1,
      "Has notes filter should return 1 article (A)"
    );
    assert!(uuids.contains(&uuid_a), "Has notes should contain A");
  }

  #[test]
  fn test_carrier_filter_and_counts() {
    let mut conn = db::establish_connection();
    let feed_uuid = insert_test_feed(&mut conn);

    // Given: text + audio + video（载体是**入库时写入的列**，测试直接给列赋值）
    let _plain = insert_test_article(&mut conn, &feed_uuid);

    let (_id_audio, uuid_audio) = insert_test_article(&mut conn, &feed_uuid);
    diesel::update(schema::articles::table.filter(schema::articles::uuid.eq(&uuid_audio)))
      .set(schema::articles::carrier.eq("audio"))
      .execute(&mut conn)
      .expect("Failed to set carrier");

    let (_id_video, uuid_video) = insert_test_article(&mut conn, &feed_uuid);
    diesel::update(schema::articles::table.filter(schema::articles::uuid.eq(&uuid_video)))
      .set(schema::articles::carrier.eq("video"))
      .execute(&mut conn)
      .expect("Failed to set carrier");

    // Then: counts 1 text / 1 audio / 1 video / 0 email
    let counts = Article::get_carrier_counts(make_filter(&feed_uuid));
    assert_eq!(counts.text, 1, "Carrier counts: text");
    assert_eq!(counts.audio, 1, "Carrier counts: audio");
    assert_eq!(counts.video, 1, "Carrier counts: video");
    assert_eq!(counts.email, 0, "Carrier counts: email");

    // Then: carrier filter returns the matching article only
    let result = Article::get_article(ArticleFilter {
      carrier: Some("audio".to_string()),
      ..make_filter(&feed_uuid)
    });
    assert_eq!(result.list.len(), 1, "Audio filter returns 1");
    assert_eq!(
      result.list[0].uuid, uuid_audio,
      "Audio filter returns the audio row"
    );
    assert_eq!(
      result.list[0].carrier, "audio",
      "Row carries the stored carrier"
    );

    let result = Article::get_article(ArticleFilter {
      carrier: Some("video".to_string()),
      ..make_filter(&feed_uuid)
    });
    assert_eq!(result.list.len(), 1, "Video filter returns 1");
    assert_eq!(
      result.list[0].uuid, uuid_video,
      "Video filter returns the video row"
    );
  }

  // 入库判定（classify/feed_carrier）测试已随实现迁往 packages/fetcher-rss

  #[test]
  fn test_update_article_read_later_status() {
    let mut conn = db::establish_connection();
    let feed_uuid = insert_test_feed(&mut conn);
    let (article_id, article_uuid) = insert_test_article(&mut conn, &feed_uuid);

    // When: set read_later to 1
    let updated = Article::update_article_read_later_status(article_uuid.clone(), 1);
    // Then: should update 1 row
    assert_eq!(updated, 1, "Should update 1 row when setting read_later=1");

    // Then: article should have is_read_later=1
    let article: models::Article = schema::articles::table
      .filter(schema::articles::id.eq(article_id))
      .first(&mut conn)
      .expect("Failed to query article");
    assert_eq!(
      article.is_read_later, 1,
      "Article should have is_read_later=1"
    );

    // When: set read_later to 0
    let updated = Article::update_article_read_later_status(article_uuid.clone(), 0);
    // Then: should update 1 row
    assert_eq!(updated, 1, "Should update 1 row when setting read_later=0");

    // Then: article should have is_read_later=0
    let article: models::Article = schema::articles::table
      .filter(schema::articles::id.eq(article_id))
      .first(&mut conn)
      .expect("Failed to query article");
    assert_eq!(
      article.is_read_later, 0,
      "Article should have is_read_later=0"
    );

    // When: update with non-existent UUID
    let fake_uuid = uuid::Uuid::new_v4().hyphenated().to_string();
    let updated = Article::update_article_read_later_status(fake_uuid, 1);
    // Then: should return 0
    assert_eq!(updated, 0, "Non-existent UUID should update 0 rows");
  }
}
