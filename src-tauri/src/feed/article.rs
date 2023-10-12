use diesel::prelude::*;
use diesel::sql_types::*;
use serde::{Deserialize, Serialize};

use crate::db::establish_connection;
use crate::models;
use crate::schema;

pub struct Article {}

#[derive(Debug, Serialize, Deserialize)]
pub struct ArticleFilter {
  pub channel_uuid: Option<String>,
  pub item_type: Option<String>,
  pub read_status: Option<i32>,
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
pub struct ArticleQueryItem {
  #[diesel(sql_type = Integer)]
  pub id: i32,
  #[diesel(sql_type = Text)]
  pub uuid: String,
  #[diesel(sql_type = Text)]
  pub channel_uuid: String,
  #[diesel(sql_type = Text)]
  pub channel_title: String,
  #[diesel(sql_type = Text)]
  pub channel_link: String,
  #[diesel(sql_type = Text)]
  pub link: String,
  #[diesel(sql_type = Text)]
  pub title: String,
  #[diesel(sql_type = Text)]
  pub feed_url: String,
  #[diesel(sql_type = Text)]
  pub description: String,
  #[diesel(sql_type = Text)]
  pub pub_date: String,
  #[diesel(sql_type = Integer)]
  pub read_status: i32,
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
    let mut query = diesel::sql_query("").into_boxed();
    let mut limit = 12;

    if let Some(channel_uuid) = filter.channel_uuid {
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
      // let relations = schema::feed_metas::dsl::feed_metas
      //   .filter(schema::feed_metas::uuid.eq(&channel_uuid))
      //   .load::<models::FeedMeta>(&mut connection)
      //   .expect("Expect find channel");
      let mut channel_uuids: Vec<String> = vec![];

      println!("relations {:?}", relations);

      if relations.len() > 0 {
        for relation in relations {
          let uuid = String::from(relation.uuid);

          channel_uuids.push(uuid.clone());
        }
      } else {
        channel_uuids.push(channel_uuid.clone());
      }

      let params = format!("?{}", ", ?".repeat(channel_uuids.len() - 1));
      query = query.sql(format!(
        "
            SELECT
              A.id, A.uuid,
              A.channel_uuid,
              C.title as channel_title,
              C.link as channel_link,
              A.link,
              A.title,
              A.feed_url,
              A.description as description,
              A.pub_date,
              A.read_status
            FROM
              feeds as C
            LEFT JOIN
              articles as A
            ON C.uuid = A.channel_uuid
            WHERE C.uuid in ({}) AND A.uuid IS NOT NULL",
        params
      ));

      for uuid in channel_uuids {
        query = query.bind::<Text, _>(uuid);
      }
    }

    match filter.read_status {
      Some(0) => {
        1;
      }
      Some(status) => {
        query = query
          .sql(" AND A.read_status = ?")
          .bind::<Integer, _>(status);
      }
      None => {
        1;
      }
    }

    query = query.sql(" ORDER BY A.pub_date DESC ");

    if let Some(l) = filter.limit {
      query = query.sql(" limit ?").bind::<Integer, _>(l);
      limit = l;
    }

    if let Some(c) = filter.cursor {
      query = query.sql(" OFFSET ?").bind::<Integer, _>((c - 1) * limit);
    }

    let debug = diesel::debug_query::<diesel::sqlite::Sqlite, _>(&query);

    println!("The insert query: {:?}", debug);

    let result = query
      .load::<ArticleQueryItem>(&mut connection)
      .expect("Expect loading articles");

    ArticleQueryResult { list: result }
  }

  /// get today articles for Today collection
  pub fn get_today_articles(filter: ArticleFilter) -> ArticleQueryResult {
    let mut connection = establish_connection();
    let mut query = diesel::sql_query("").into_boxed();
    let mut limit = 12;

    query = query.sql(
      "
        SELECT
          A.id, A.uuid,
          A.channel_uuid,
          C.title as channel_title,
          C.link as channel_link,
          A.link,
          A.title,
          A.feed_url,
          A.description as description,
          A.pub_date,
          A.create_date,
          A.read_status
        FROM
          feeds as C
        LEFT JOIN
          articles as A
        ON C.uuid = A.channel_uuid
        WHERE DATE(A.create_date) = DATE('now')",
    );

    match filter.read_status {
      Some(0) => {
        1;
      }
      Some(status) => {
        query = query
          .sql(" AND A.read_status = ?")
          .bind::<Integer, _>(status);
      }
      None => {
        1;
      }
    }

    query = query.sql(" ORDER BY A.pub_date DESC ");

    if let Some(l) = filter.limit {
      query = query.sql(" limit ?").bind::<Integer, _>(l);
      limit = l;
    }

    if let Some(c) = filter.cursor {
      query = query.sql(" OFFSET ?").bind::<Integer, _>((c - 1) * limit);
    }

    let result = query
      .load::<ArticleQueryItem>(&mut connection)
      .expect("Expect loading articles");

    ArticleQueryResult { list: result }
  }

  /// get all articles for All Items collection
  pub fn get_all_articles(filter: ArticleFilter) -> ArticleQueryResult {
    let mut connection = establish_connection();
    let mut query = diesel::sql_query("").into_boxed();
    let mut limit = 12;

    query = query.sql(
      "
        SELECT
          A.id, A.uuid,
          A.channel_uuid,
          C.title as channel_title,
          C.link as channel_link,
          A.link,
          A.title,
          A.feed_url,
          A.description as description,
          A.pub_date,
          A.create_date,
          A.read_status
        FROM
          feeds as C
        LEFT JOIN
          articles as A
        ON C.uuid = A.channel_uuid ",
    );

    match filter.read_status {
      Some(0) => {
        1;
      }
      Some(status) => {
        query = query
          .sql(" AND A.read_status = ?")
          .bind::<Integer, _>(status);
      }
      None => {
        1;
      }
    }

    query = query.sql(" ORDER BY A.pub_date DESC ");

    if let Some(l) = filter.limit {
      query = query.sql(" limit ?").bind::<Integer, _>(l);
      limit = l;
    }

    if let Some(c) = filter.cursor {
      query = query.sql(" OFFSET ?").bind::<Integer, _>((c - 1) * limit);
    }

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

  pub fn get_article_with_uuid(uuid: String) -> Option<models::Article> {
    let mut connection = establish_connection();
    let mut result = schema::articles::dsl::articles
      .filter(schema::articles::uuid.eq(&uuid))
      .load::<models::Article>(&mut connection)
      .unwrap_or(vec![]);

    if result.len() == 1 {
      return result.pop();
    } else {
      return None;
    }
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
            .set(schema::articles::read_status.eq(status))
            .execute(&mut connection);

        match res {
          Ok(r) => r,
          Err(_) => 0,
        }
      }
      None => 0,
    }
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
        .filter(schema::articles::channel_uuid.eq_any(channel_uuids))
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
}
