// use std::cmp;
use diesel::prelude::*;
use diesel::sql_types::*;
// use regex::Regex;
use serde::{Deserialize, Serialize};

use crate::db::establish_connection;
use crate::models;
use crate::schema;

pub struct Article {}

#[derive(Debug, Serialize, Deserialize)]
pub struct ArticleFilter {
  pub channel_uuid: Option<String>,
  pub read_status: Option<i32>,
  pub cursor: Option<i32>,
  pub limit: Option<i32>,
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

impl Article {
  /// get articles
  pub fn get_article(filter: ArticleFilter) -> ArticleQueryResult {
    let mut connection = establish_connection();
    let mut query = diesel::sql_query("").into_boxed();
    let mut limit = 12;

    if let Some(channel_uuid) = filter.channel_uuid {
      let relations = schema::feed_metas::dsl::feed_metas
        .filter(schema::feed_metas::parent_uuid.eq(&channel_uuid))
        .load::<models::FeedMeta>(&mut connection)
        .expect("Expect find channel");
      let mut channel_uuids: Vec<String> = vec![];

      if relations.len() > 0 {
        for relation in relations {
          if relation.parent_uuid == channel_uuid {
            let uuid = String::from(relation.child_uuid);

            channel_uuids.push(uuid.clone());
          }
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

    if let Some(status) = filter.read_status {
      query = query
        .sql(" and A.read_status = ?")
        .bind::<Integer, _>(status);
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

  /// get today articles
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

    if let Some(status) = filter.read_status {
      query = query
        .sql(" AND A.read_status = ?")
        .bind::<Integer, _>(status);
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

    if let Some(status) = filter.read_status {
      query = query
        .sql(" AND A.read_status = ?")
        .bind::<Integer, _>(status);
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
      .filter(schema::feed_metas::parent_uuid.eq(&uuid))
      .load::<models::FeedMeta>(&mut connection)
      .expect("Expect find channel");

    if relations.len() > 0 {
      for relation in relations {
        if relation.parent_uuid == uuid {
          let uuid = String::from(relation.child_uuid);

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
