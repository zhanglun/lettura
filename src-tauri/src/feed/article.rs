use diesel::prelude::*;
use diesel::sql_types::*;
use serde::{Deserialize, Serialize};
use regex::Regex;

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
  // pub count: i32,
}

impl Article {
  /// get articles
  pub fn get_article(filter: ArticleFilter) -> ArticleQueryResult {
    let mut connection = establish_connection();
    let mut query = diesel::sql_query("").into_boxed();

    match filter.channel_uuid {
      Some(channel_uuid) => {
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

          let params = format!("?{}", ", ?".repeat(channel_uuids.len() - 1));
          query = query
          .sql(format!("
            select
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
            from
              channels as C
            Left join
              articles as A
            on C.uuid = A.channel_uuid where C.uuid in ({})", params));

          for uuid in channel_uuids {
            query = query.bind::<Text, _>(uuid);
          }
        } else {
          query = query.sql(format!("
            select
              A.id,
              A.uuid,
              A.channel_uuid,
              C.title as channel_title,
              C.link as channel_link,
              A.title,
              A.link,
              A.feed_url,
              A.description as description,
              A.pub_date,
              A.read_status
            from
              channels as C
            Left join
              articles as A
            on C.uuid = A.channel_uuid
            where C.uuid = {}", "?"));
          query = query.bind::<Text, _>(channel_uuid);
        }
      }
      None => {
        1;
      }
    }

    match filter.read_status {
      Some(0) => {
        1;
      }
      Some(status) => {
        query = query
          .sql(" and A.read_status = ?")
          .bind::<Integer, _>(status);
      }
      None => {
        1;
      }
    }

    match filter.cursor {
      Some(cursor) => {
        query = query.sql(" and A.id > ?").bind::<Integer, _>(cursor);
      }
      None => {
        1;
      }
    }

    match filter.limit {
      Some(limit) => {
        query = query.sql(" limit ?").bind::<Integer, _>(limit);
      }
      None => {
        1;
      }
    }

    query = query.sql(" order by A.pub_date DESC");

    let debug = diesel::debug_query::<diesel::sqlite::Sqlite, _>(&query);

    println!("The insert query: {:?}", debug);

    let result = query
      .load::<ArticleQueryItem>(&mut connection)
      .expect("Expect loading articles");

    let re = Regex::new(r"<[^>]+>").unwrap();

    let result = result.into_iter().map(|mut a| {
    //   lazy_static! {
    //     static ref RE: Regex = Regex::new("...").unwrap();
    // }
      a.description = re
        .replace_all(&a.description, String::from(""))
        .chars().into_iter().map(|x| x.to_string()).collect::<Vec<_>>()[0..60]
        .join("");
      a
    }).collect();

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
    let channel = schema::channels::dsl::channels
      .filter(schema::channels::uuid.eq(&channel_uuid))
      .load::<models::Channel>(&mut connection)
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
