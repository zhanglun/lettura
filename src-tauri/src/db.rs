use diesel::prelude::*;
use diesel::sqlite::SqliteConnection;
use serde::Deserialize;
use serde::Serialize;
use std::path;

use dotenv::dotenv;
use std::env;

use crate::models;
use crate::schema;

pub fn establish_connection() -> SqliteConnection {
  dotenv().ok();

  let _env = env::var("LETTURA_ENV");

  match _env {
    Ok(_env) => {
      let database_url = &env::var("DATABASE_URL").unwrap();

      SqliteConnection::establish(&database_url)
        .expect(&format!("Error connecting to {}", &database_url))
    }
    Err(_) => {
      println!("no LETTURA_ENV");

      let database_url = path::Path::new(&tauri::api::path::home_dir().unwrap())
        .join(".lettura")
        .join("lettura.db");

      let database_url = database_url.to_str().clone().unwrap();

      SqliteConnection::establish(&database_url)
        .expect(&format!("Error connecting to {}", &database_url))
    }
  }
}

pub fn get_channel_by_uuid(channel_uuid: String) -> Option<models::Channel> {
  let mut connection = establish_connection();
  let mut channel = schema::channels::dsl::channels
    .filter(schema::channels::uuid.eq(&channel_uuid))
    .load::<models::Channel>(&mut connection)
    .expect("Expect find channel");

  if channel.len() == 1 {
    return channel.pop();
  } else {
    return None;
  }
}

pub fn add_articles(channel_uuid: String, articles: Vec<models::NewArticle>) -> usize {
  let mut connection = establish_connection();
  let channel = schema::channels::dsl::channels
    .filter(schema::channels::uuid.eq(&channel_uuid))
    .load::<models::Channel>(&mut connection)
    .expect("Expect find channel");

  if channel.len() == 1 {
    println!("articles count ====> {:?}", &articles.len());

    let result = diesel::insert_or_ignore_into(schema::articles::dsl::articles)
      .values(articles)
      .execute(&mut connection)
      .expect("Expect add articles");

    println!("insert count ====> {:?}", result);

    return result;
  } else {
    return 0;
  }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ArticleFilter {
  pub channel_uuid: Option<String>,
  pub read_status: Option<i32>,
  pub cursor: Option<i32>,
  pub limit: Option<i32>,
}

#[derive(Debug, Serialize)]
pub struct ArticleQueryResult {
  list: Vec<models::Article>,
  // pub count: i32,
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
  let article = get_article_with_uuid(String::from(&uuid));

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

pub fn get_article(filter: ArticleFilter) -> ArticleQueryResult {
  let mut connection = establish_connection();
  let mut query = schema::articles::dsl::articles.into_boxed();

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
            let uuid = String::from(relation.channel_uuid);

            channel_uuids.push(uuid.clone());
          }
        }

        query = query.filter(schema::articles::channel_uuid.eq_any(channel_uuids));
      } else {
        query = query.filter(schema::articles::channel_uuid.eq(channel_uuid));
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
      query = query.filter(schema::articles::read_status.eq(status));
    }
    None => {
      1;
    }
  }

  match filter.cursor {
    Some(cursor) => {
      query = query.filter(schema::articles::id.gt(cursor));
    }
    None => {
      1;
    }
  }

  match filter.limit {
    Some(limit) => {
      query = query.limit(limit.into());
    }
    None => {
      1;
    }
  }

  query = query.order(schema::articles::dsl::pub_date.desc());

  let result = query
    .load::<models::Article>(&mut connection)
    .expect("Expect loading articles");

  ArticleQueryResult { list: result }
}

pub fn update_articles_read_status_channel(uuid: String) -> usize {
  let mut connection = establish_connection();
  let result = diesel::update(
    schema::articles::dsl::articles
      .filter(schema::articles::channel_uuid.eq(uuid))
      .filter(schema::articles::read_status.eq(1)),
  )
  .set(schema::articles::read_status.eq(2))
  .execute(&mut connection);

  match result {
    Ok(r) => r,
    Err(_) => 0,
  }
}

#[cfg(test)]
mod tests {
  use super::*;

}
