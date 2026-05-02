use crate::core::config::get_user_config;
use chrono::{Duration, Utc};
use diesel::prelude::*;
use diesel::sql_types::*;
use serde::{Deserialize, Serialize};

use crate::db::establish_connection;
use crate::models;
use crate::schema;

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
  pub cursor: Option<i32>,
  pub limit: Option<i32>,
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
    let mut conditions = vec![];
    let mut params = vec![];

    if let Some(channel_uuid) = filter.feed_uuid {
      let mut relations = vec![];

      if let Some(item_type) = filter.item_type {
        if item_type == String::from("folder") {
          relations = schema::feed_metas::dsl::feed_metas
            .filter(schema::feed_metas::folder_uuid.eq(&channel_uuid))
            .load::<models::FeedMeta>(&mut connection)
            .expect("Expect find channel");
        } else {
          relations = schema::feed_metas::dsl::feed_metas
            .filter(schema::feed_metas::uuid.eq(&channel_uuid))
            .load::<models::FeedMeta>(&mut connection)
            .expect("Expect find channel");
        }
      }

      let mut channel_uuids: Vec<String> = vec![];

      log::debug!("relations {:?}", relations);

      if relations.len() > 0 {
        for relation in relations {
          let uuid = String::from(relation.uuid);

          channel_uuids.push(uuid.clone());
        }
      } else {
        channel_uuids.push(channel_uuid.clone());
      }

      let in_params = format!("?{}", ", ?".repeat(channel_uuids.len() - 1));
      conditions.push(format!("C.uuid in ({}) AND A.uuid IS NOT NULL", in_params));
      // query = query.sql(format!(
      //   "
      //       SELECT
      //         A.id, A.uuid,
      //         A.feed_uuid,
      //         C.title as feed_title,
      //         C.link as feed_url,
      //         C.logo as feed_logo,
      //         A.link,
      //         A.title,
      //         A.feed_url,
      //         A.description as description,
      //         A.author,
      //         A.pub_date,
      //         A.create_date,
      //         A.read_status,
      //         A.starred
      //       FROM
      //         articles as A
      //       LEFT JOIN
      //         feeds as C
      //       ON C.uuid = A.feed_uuid
      //       WHERE C.uuid in ({}) AND A.uuid IS NOT NULL",
      //   params
      // ));

      // for uuid in channel_uuids {
      //   query = query.bind::<Text, _>(uuid);
      // }

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

    if let Some(_collection_uuid) = filter.collection_uuid {
      conditions.push(
        "A.id IN (SELECT AC.article_id FROM article_collections AC JOIN collections COL ON COL.id = AC.collection_id WHERE COL.uuid = ?)".to_string(),
      );
      params.push(_collection_uuid);
    }

    if let Some(_tag_uuid) = filter.tag_uuid {
      conditions.push(
        "A.id IN (SELECT AT.article_id FROM article_tags AT JOIN tags T ON T.id = AT.tag_id WHERE T.uuid = ?)".to_string(),
      );
      params.push(_tag_uuid);
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

    if conditions.len() > 0 {
      query = query.sql(format!(" WHERE {}", conditions.join(" AND ")));
    }

    // else if let Some(_is_today) = filter.is_today {
    //   query = query.sql(
    //     "
    //     SELECT
    //       A.id, A.uuid,
    //       A.feed_uuid,
    //       C.title as feed_title,
    //       C.link as feed_url,
    //       C.logo as feed_logo,
    //       A.link,
    //       A.title,
    //       A.feed_url,
    //       A.description as description,
    //       A.author,
    //       A.pub_date,
    //       A.create_date,
    //       A.read_status,
    //       A.starred
    //     FROM
    //       articles as A
    //     LEFT JOIN
    //       feeds as C
    //     ON C.uuid = A.feed_uuid
    //     WHERE DATE(A.create_date) = DATE('now')",
    //   );
    // } else if let Some(_is_starred) = filter.is_starred {
    //   query = query.sql(
    //     "
    //     SELECT
    //       A.id, A.uuid,
    //       A.feed_uuid,
    //       C.title as feed_title,
    //       C.link as feed_url,
    //       C.logo as feed_logo,
    //       A.link,
    //       A.title,
    //       A.feed_url,
    //       A.description as description,
    //       A.author,
    //       A.pub_date,
    //       A.create_date,
    //       A.read_status,
    //       A.starred
    //     FROM
    //       articles as A
    //     LEFT JOIN
    //       feeds as C
    //     ON C.uuid = A.feed_uuid
    //     WHERE A.starred = 1
    //     ",
    //   );
    // } else {
    //   query = query.sql(
    //     "
    //       SELECT
    //         A.id, A.uuid,
    //         A.feed_uuid,
    //         C.title as feed_title,
    //         C.link as feed_url,
    //         C.logo as feed_logo,
    //         A.link,
    //         A.title,
    //         A.feed_url,
    //         A.description as description,
    //         A.author,
    //         A.pub_date,
    //         A.create_date,
    //         A.read_status,
    //         A.starred
    //       FROM
    //         articles as A
    //       LEFT JOIN
    //         feeds as C
    //       ON C.uuid = A.feed_uuid ",
    //   );
    // }

    // match filter.read_status {
    //   Some(0) => {
    //     1;
    //   }
    //   Some(status) => {
    //     query = query
    //       .sql(" WHERE A.read_status = ?")
    //       .bind::<Integer, _>(status);
    //   }
    //   None => {
    //     1;
    //   }
    // }

    for param in params {
      query = query.bind::<Text, _>(param);
    }
    query = query.sql(" ORDER BY A.pub_date DESC ");

    if let Some(l) = filter.limit {
      query = query.sql(" limit ?").bind::<Integer, _>(l);
      limit = l.clone();
    }

    if let Some(c) = filter.cursor {
      query = query.sql(" OFFSET ?").bind::<Integer, _>((c - 1) * limit);
    }

    log::info!("query: {:?}", diesel::debug_query(&query).to_string());

    let result = query
      .load::<ArticleQueryItem>(&mut connection)
      .expect("Expect loading articles");

    ArticleQueryResult { list: result }
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
               A.media_object,
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
    let result = diesel::update(
      schema::articles::dsl::articles
        .filter(schema::articles::create_date.eq(diesel::dsl::now))
        .filter(schema::articles::read_status.eq(1)),
    )
    .set(schema::articles::read_status.eq(2))
    .execute(&mut connection);

    match result {
      Ok(r) => r,
      Err(_) => 0,
    }
  }

  pub fn mark_all_as_read() -> usize {
    let mut connection = establish_connection();
    let result =
      diesel::update(schema::articles::dsl::articles.filter(schema::articles::read_status.eq(1)))
        .set(schema::articles::read_status.eq(2))
        .execute(&mut connection);

    match result {
      Ok(r) => r,
      Err(_) => 0,
    }
  }

  pub fn update_article_read_status(uuid: String, status: i32) -> usize {
    let mut connection = establish_connection();
    let article = Self::get_article_with_uuid(String::from(&uuid));

    match article {
      Some(_article) => {
        let res =
          diesel::update(schema::articles::dsl::articles.filter(schema::articles::uuid.eq(&uuid)))
            .set(schema::articles::read_status.eq(status as i32))
            .execute(&mut connection);

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
        chrono::Utc::now().naive_utc().format("%Y-%m-%d %H:%M:%S").to_string()
      } else {
        String::from("")
      };
      let res =
        diesel::update(schema::articles::dsl::articles.filter(schema::articles::uuid.eq(&uuid)))
          .set((schema::articles::starred.eq(status as i32), schema::articles::starred_at.eq(starred_at)))
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
        .filter(schema::articles::feed_uuid.eq_any(channel_uuids))
        .filter(schema::articles::read_status.eq(1)),
    )
    .set(schema::articles::read_status.eq(2))
    .execute(&mut connection);

    match result {
      Ok(r) => r,
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

    let query = query.filter(schema::articles::create_date.lt(expired_date));

    let result = query.execute(&mut connection).expect("purge failed!");

    log::info!("{:?} articles purged", result);

    return result;
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
                uuid: feed_uuid.clone(),
                feed_type: "rss".to_string(),
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

    fn make_filter() -> ArticleFilter {
        ArticleFilter {
            feed_uuid: None,
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
            ..make_filter()
        });
        let uuids: Vec<String> = result.list.iter().map(|a| a.uuid.clone()).collect();
        assert_eq!(uuids.len(), 3, "Starred filter should return 3 articles (A, B, D)");
        assert!(uuids.contains(&uuid_a), "Starred should contain A");
        assert!(uuids.contains(&uuid_b), "Starred should contain B");
        assert!(uuids.contains(&uuid_d), "Starred should contain D");

        // When/Then: is_archived=1 returns only B
        let result = Article::get_article(ArticleFilter {
            is_archived: Some(1),
            ..make_filter()
        });
        let uuids: Vec<String> = result.list.iter().map(|a| a.uuid.clone()).collect();
        assert_eq!(uuids.len(), 1, "Archived filter should return 1 article (B)");
        assert!(uuids.contains(&uuid_b), "Archived should contain B");

        // When/Then: is_read_later=1 returns B, C
        let result = Article::get_article(ArticleFilter {
            is_read_later: Some(1),
            ..make_filter()
        });
        let uuids: Vec<String> = result.list.iter().map(|a| a.uuid.clone()).collect();
        assert_eq!(uuids.len(), 2, "Read later filter should return 2 articles (B, C)");
        assert!(uuids.contains(&uuid_b), "Read later should contain B");
        assert!(uuids.contains(&uuid_c), "Read later should contain C");

        // When/Then: collection_uuid returns only A
        let result = Article::get_article(ArticleFilter {
            collection_uuid: Some(coll_uuid),
            ..make_filter()
        });
        let uuids: Vec<String> = result.list.iter().map(|a| a.uuid.clone()).collect();
        assert_eq!(uuids.len(), 1, "Collection filter should return 1 article (A)");
        assert!(uuids.contains(&uuid_a), "Collection should contain A");

        // When/Then: tag_uuid returns only D
        let result = Article::get_article(ArticleFilter {
            tag_uuid: Some(tag_uuid),
            ..make_filter()
        });
        let uuids: Vec<String> = result.list.iter().map(|a| a.uuid.clone()).collect();
        assert_eq!(uuids.len(), 1, "Tag filter should return 1 article (D)");
        assert!(uuids.contains(&uuid_d), "Tag filter should contain D");

        // When/Then: has_notes=1 returns only A
        let result = Article::get_article(ArticleFilter {
            has_notes: Some(1),
            ..make_filter()
        });
        let uuids: Vec<String> = result.list.iter().map(|a| a.uuid.clone()).collect();
        assert_eq!(uuids.len(), 1, "Has notes filter should return 1 article (A)");
        assert!(uuids.contains(&uuid_a), "Has notes should contain A");
    }

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
        assert_eq!(article.is_read_later, 1, "Article should have is_read_later=1");

        // When: set read_later to 0
        let updated = Article::update_article_read_later_status(article_uuid.clone(), 0);
        // Then: should update 1 row
        assert_eq!(updated, 1, "Should update 1 row when setting read_later=0");

        // Then: article should have is_read_later=0
        let article: models::Article = schema::articles::table
            .filter(schema::articles::id.eq(article_id))
            .first(&mut conn)
            .expect("Failed to query article");
        assert_eq!(article.is_read_later, 0, "Article should have is_read_later=0");

        // When: update with non-existent UUID
        let fake_uuid = uuid::Uuid::new_v4().hyphenated().to_string();
        let updated = Article::update_article_read_later_status(fake_uuid, 1);
        // Then: should return 0
        assert_eq!(updated, 0, "Non-existent UUID should update 0 rows");
    }
}
