use std::collections::HashMap;

use diesel::prelude::*;
use diesel::sql_types::*;
use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};

use crate::cmd::create_client;
use crate::db;
use crate::models;
use crate::schema;

pub fn get_feed_by_uuid(channel_uuid: String) -> Option<models::Feed> {
  let mut connection = db::establish_connection();
  let mut channel = schema::feeds::dsl::feeds
    .filter(schema::feeds::uuid.eq(&channel_uuid))
    .load::<models::Feed>(&mut connection)
    .expect("Expect find channel");

  return if channel.len() == 1 {
    channel.pop()
  } else {
    None
  };
}

/// delete channel and associated articles
/// # Example
/// ```
/// let uuid = String::from("123456");
/// let result = delete_feed(uuid);
///
/// assert_eq!(1, result);
/// ```
pub fn delete_feed(uuid: String) -> usize {
  let mut connection = db::establish_connection();
  let channel = schema::feeds::dsl::feeds
    .filter(schema::feeds::uuid.eq(&uuid))
    .load::<models::Feed>(&mut connection)
    .expect("Expect find channel");

  return if channel.len() == 1 {
    let result = diesel::delete(schema::feeds::dsl::feeds.filter(schema::feeds::uuid.eq(&uuid)))
      .execute(&mut connection)
      .expect("Expect delete channel");

    diesel::delete(
      schema::articles::dsl::articles.filter(schema::articles::channel_uuid.eq(&uuid)),
    )
    .execute(&mut connection)
    .expect("Expect delete channel");

    diesel::delete(
      schema::feed_metas::dsl::feed_metas.filter(schema::feed_metas::child_uuid.eq(&uuid)),
    )
    .execute(&mut connection)
    .expect("Expect delete channel");

    result
  } else {
    0
  };
}

pub fn batch_delete_feed(channel_uuids: Vec<String>) -> usize {
  let mut connection = db::establish_connection();
  let result =
    diesel::delete(schema::feeds::dsl::feeds.filter(schema::feeds::uuid.eq_any(&channel_uuids)))
      .execute(&mut connection)
      .expect("Expect delete channel");

  diesel::delete(
    schema::articles::dsl::articles.filter(schema::articles::channel_uuid.eq_any(&channel_uuids)),
  )
  .execute(&mut connection)
  .expect("Expect delete channel");

  result
}

pub fn get_feed_meta_with_uuids(channel_uuids: Vec<String>) -> Vec<models::FeedMeta> {
  let mut connection = db::establish_connection();
  let result = schema::feed_metas::dsl::feed_metas
    .filter(schema::feed_metas::child_uuid.eq_any(&channel_uuids))
    .load::<models::FeedMeta>(&mut connection)
    .expect("Expect get feed meta");

  result
}

pub fn get_all_feed_meta() -> Vec<models::FeedMeta> {
  let mut connection = db::establish_connection();
  let result = schema::feed_metas::dsl::feed_metas
    .order(schema::feed_metas::sort.desc())
    .load::<models::FeedMeta>(&mut connection)
    .expect("Expect get feed meta");

  result
}

#[derive(Debug, Clone, Queryable, Serialize, QueryableByName)]
pub struct UnreadTotal {
  #[diesel(sql_type = diesel::sql_types::Text)]
  pub channel_uuid: String,
  #[diesel(sql_type = diesel::sql_types::Integer)]
  pub unread_count: i32,
}

#[derive(Debug, Queryable, Serialize, QueryableByName)]
pub struct MetaGroup {
  #[diesel(sql_type = diesel::sql_types::Text)]
  pub child_uuid: String,
  #[diesel(sql_type = diesel::sql_types::Text)]
  pub parent_uuid: String,
  #[diesel(sql_type = diesel::sql_types::Integer)]
  pub sort: i32,
}

pub fn get_unread_total() -> HashMap<String, i32> {
  const SQL_QUERY_UNREAD_TOTAL: &str = "
    SELECT
      id,
      channel_uuid,
      count(read_status) as unread_count
    FROM articles
    WHERE read_status = 1
    GROUP BY channel_uuid;
  ";
  let sql_folders: &str = "
    SELECT
      child_uuid,
      parent_uuid,
      sort
    FROM feed_metas;
  ";

  let mut connection = db::establish_connection();
  let record = diesel::sql_query(SQL_QUERY_UNREAD_TOTAL)
    .load::<UnreadTotal>(&mut connection)
    .unwrap_or(vec![]);
  let total_map = record
    .clone()
    .into_iter()
    .map(|r| (r.channel_uuid.clone(), r.unread_count.clone()))
    .collect::<HashMap<String, i32>>();
  let meta_group = diesel::sql_query(sql_folders)
    .load::<MetaGroup>(&mut connection)
    .unwrap_or(vec![]);
  let mut result_map: HashMap<String, i32> = HashMap::new();

  for group in meta_group {
    if let Some(count) = total_map.get(&group.child_uuid) {
      if group.parent_uuid != "".to_string() {
        let c = result_map.entry(group.parent_uuid).or_insert(0);

        *c += count;
      }

      result_map.entry(group.child_uuid).or_insert(count.clone());
    }
  }

  for i in record {
    if let Some(count) = total_map.get(&i.channel_uuid) {
      result_map.entry(i.channel_uuid).or_insert(count.clone());
    }
  }

  result_map
}

#[derive(Deserialize)]
pub struct FeedMetaUpdateRequest {
  pub parent_uuid: String,
  pub sort: i32,
}

pub fn update_feed_meta(uuid: String, update: FeedMetaUpdateRequest) -> usize {
  let mut connection = db::establish_connection();
  let updated_row = diesel::update(
    schema::feed_metas::dsl::feed_metas.filter(schema::feed_metas::child_uuid.eq(uuid)),
  )
  .set((
    schema::feed_metas::parent_uuid.eq(update.parent_uuid),
    schema::feed_metas::sort.eq(update.sort),
  ))
  .execute(&mut connection)
  .expect("update feed meta");

  updated_row
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct ChildItem {
  pub item_type: String,
  pub uuid: String,
  pub title: String,
  pub sort: i32,
  pub link: Option<String>,
  pub logo: String,
  pub feed_url: String,
  pub description: String,
  pub create_date: String,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct FeedItem {
  pub item_type: String,
  pub uuid: String,
  pub title: String,
  pub sort: i32,
  pub children: Option<Vec<ChildItem>>,
  pub parent_uuid: String,
  pub link: Option<String>,
  pub logo: String,
  pub feed_url: String,
  pub description: String,
  pub create_date: String,
}

#[derive(Debug, Queryable, Serialize, QueryableByName)]
pub struct FeedJoinRecord {
  #[diesel(sql_type = diesel::sql_types::Text)]
  pub title: String,
  #[diesel(sql_type = diesel::sql_types::Integer)]
  pub sort: i32,
  #[diesel(sql_type = diesel::sql_types::Text)]
  pub uuid: String,
  #[diesel(sql_type = diesel::sql_types::Text)]
  pub parent_uuid: String,
  #[diesel(sql_type = diesel::sql_types::Text)]
  pub link: String,
  #[diesel(sql_type = diesel::sql_types::Text)]
  pub logo: String,
  #[diesel(sql_type = diesel::sql_types::Text)]
  pub feed_url: String,
  #[diesel(sql_type = diesel::sql_types::Text)]
  pub description: String,
  #[diesel(sql_type = diesel::sql_types::Text)]
  pub create_date: String,
}

pub fn get_feeds() -> Vec<FeedItem> {
  let sql_channel_in_folder = "
    SELECT
      C.title AS title,
      F.child_uuid AS uuid,
      F.sort,
      C.link,
      C.logo,
      C.feed_url,
      C.description,
      C.create_date,
      F.parent_uuid as parent_uuid
    FROM feeds as C
    LEFT JOIN feed_metas AS F
    ON C.uuid = F.child_uuid
    WHERE parent_uuid != '' and parent_uuid IS NOT NULL
    ORDER BY F.sort ASC;";

  let mut connection = db::establish_connection();

  let channels_in_folder = diesel::sql_query(sql_channel_in_folder)
    .load::<FeedJoinRecord>(&mut connection)
    .unwrap_or(vec![]);
  let folders = schema::folders::dsl::folders
    .load::<models::Folder>(&mut connection)
    .unwrap();

  let mut folder_channel_map: HashMap<String, Vec<ChildItem>> = HashMap::new();
  let mut result: Vec<FeedItem> = Vec::new();
  let mut filter_uuids: Vec<String> = Vec::new();

  for channel in channels_in_folder {
    let p_uuid = String::from(&channel.parent_uuid);
    let children = folder_channel_map.entry(p_uuid.clone()).or_insert(vec![]);

    children.push(ChildItem {
      item_type: String::from("channel"),
      uuid: String::from(&channel.uuid),
      title: channel.title,
      sort: channel.sort,
      link: Some(channel.link),
      logo: channel.logo,
      feed_url: channel.feed_url,
      description: channel.description,
      create_date: channel.create_date,
    });

    filter_uuids.push(channel.uuid);
  }

  for folder in folders {
    let c_uuids = folder_channel_map
      .entry(String::from(&folder.uuid))
      .or_insert(vec![]);

    result.push(FeedItem {
      item_type: String::from("folder"),
      uuid: folder.uuid,
      title: folder.name,
      sort: folder.sort,
      link: Some(String::from("")),
      logo: String::from(""),
      parent_uuid: "".to_string(),
      children: Some(c_uuids.to_vec()),
      feed_url: "".to_string(),
      description: "".to_string(),
      create_date: folder.create_date,
    });
  }

  println!("filter_uuids :{:?}", &filter_uuids);

  let channels = schema::feeds::dsl::feeds
    .filter(diesel::dsl::not(schema::feeds::uuid.eq_any(&filter_uuids)))
    .load::<models::Feed>(&mut connection)
    .unwrap();

  for channel in channels {
    result.push(FeedItem {
      item_type: String::from("channel"),
      uuid: channel.uuid,
      title: channel.title,
      sort: channel.sort,
      link: Some(channel.link),
      logo: channel.logo,
      feed_url: channel.feed_url,
      description: channel.description,
      create_date: channel.create_date,
      parent_uuid: String::from(""),
      children: Some(Vec::new()),
    });
  }

  result.sort_by(|a, b| a.sort.cmp(&b.sort));

  result
}

pub fn get_last_sort(connection: &mut diesel::SqliteConnection) -> i32 {
  let last_sort = schema::feeds::dsl::feeds
    .select(schema::feeds::sort)
    .order(schema::feeds::sort.desc())
    .get_results::<i32>(connection);

  let last_sort = match last_sort {
    Ok(mut rec) => rec.pop(),
    Err(_) => None,
  };

  let last_sort = match last_sort {
    Some(s) => s,
    None => 0,
  };

  last_sort
}

pub fn add_feed(feed: models::NewFeed, articles: Vec<models::NewArticle>) -> (usize, String) {
  let mut connection = db::establish_connection();
  let last_sort = get_last_sort(&mut connection);
  let record = models::NewFeed {
    sort: last_sort + 1,
    ..feed
  };
  let result = diesel::insert_into(schema::feeds::dsl::feeds)
    .values(&record)
    .execute(&mut connection);

  println!("result ===> {:?}", result);

  let result = match result {
    Ok(r) => (r, String::from("")),
    Err(error) => (0, error.to_string()),
  };

  println!(" new result {:?}", result);

  if result.0 == 1 {
    println!("start insert articles");

    let articles = diesel::insert_or_ignore_into(schema::articles::dsl::articles)
      .values(articles)
      .execute(&mut connection);

    println!("articles {:?}", articles);
  }

  result
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FeedSort {
  item_type: String,
  parent_uuid: String,
  child_uuid: String,
  sort: i32,
}

#[derive(Debug, Queryable, Serialize, QueryableByName)]
pub struct FeedSortRes {
  #[diesel(sql_type = Text)]
  parent_uuid: String,
  #[diesel(sql_type = Text)]
  child_uuid: String,
  #[diesel(sql_type = Integer)]
  sort: i32,
}

pub fn update_feed_sort(sorts: Vec<FeedSort>) -> usize {
  let mut connection = db::establish_connection();

  for item in sorts {
    let mut query = diesel::sql_query("").into_boxed();

    if item.parent_uuid.len() > 0 && item.item_type == "channel" {
      query = query
        .sql(format!(
          "
          insert into feed_metas (id, parent_uuid, child_uuid, sort) values
        ((select id from feed_metas where parent_uuid = ? and child_uuid = ? ), ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET sort = excluded.sort;
        "
        ))
        .bind::<Text, _>(&item.parent_uuid)
        .bind::<Text, _>(&item.child_uuid)
        .bind::<Text, _>(&item.parent_uuid)
        .bind::<Text, _>(&item.child_uuid)
        .bind::<Integer, _>(&item.sort);

      let debug = diesel::debug_query::<diesel::sqlite::Sqlite, _>(&query);

      println!("The insert query: {:?}", debug);

      query
        .load::<FeedSortRes>(&mut connection)
        .expect("Expect loading articles");
    }

    if item.parent_uuid.len() == 0 && item.item_type == "channel" {
      diesel::update(schema::feeds::dsl::feeds.filter(schema::feeds::uuid.eq(&item.child_uuid)))
        .set(schema::feeds::sort.eq(item.sort))
        .execute(&mut connection)
        .expect("msg");
    }

    if item.parent_uuid.len() == 0 && item.item_type == "folder" {
      diesel::update(
        schema::folders::dsl::folders.filter(schema::folders::uuid.eq(&item.child_uuid)),
      )
      .set(schema::folders::sort.eq(item.sort))
      .execute(&mut connection)
      .expect("msg");
    }

    println!(" update sort {:?}", item);
  }

  1
}

#[derive(Debug, Queryable, Serialize, QueryableByName)]
pub struct ChannelQuery {
  #[diesel(sql_type = diesel::sql_types::Integer)]
  pub id: i32,
  #[diesel(sql_type = diesel::sql_types::Text)]
  pub uuid: String,
  #[diesel(sql_type = diesel::sql_types::Text)]
  pub title: String,
  #[diesel(sql_type = diesel::sql_types::Text)]
  pub link: String,
  #[diesel(sql_type = diesel::sql_types::Text)]
  pub feed_url: String,
  #[diesel(sql_type = diesel::sql_types::Text)]
  pub logo: String,
  #[diesel(sql_type = diesel::sql_types::Text)]
  pub description: String,
  #[diesel(sql_type = diesel::sql_types::Text)]
  pub pub_date: String,
  #[diesel(sql_type = diesel::sql_types::Integer)]
  pub sort: i32,
  #[diesel(sql_type = diesel::sql_types::Text)]
  pub create_date: String,
  #[diesel(sql_type = diesel::sql_types::Text)]
  pub update_date: String,
  #[diesel(sql_type = diesel::sql_types::Text)]
  pub parent_uuid: String,
}

#[derive(Debug, Serialize)]
pub struct ChannelQueryResult {
  list: Vec<ChannelQuery>,
}

pub fn get_channels() -> ChannelQueryResult {
  let mut connection = db::establish_connection();
  let channels = schema::feeds::dsl::feeds
    .load::<models::Feed>(&mut connection)
    .unwrap();
  let relations = schema::feed_metas::dsl::feed_metas
    .load::<models::FeedMeta>(&mut connection)
    .unwrap_or(vec![]);
  let mut folder_channel_map: HashMap<String, String> = HashMap::new();

  for r in relations {
    folder_channel_map.insert(r.child_uuid.clone(), r.parent_uuid);
  }

  let result: Vec<ChannelQuery> = channels
    .into_iter()
    .map(|channel| ChannelQuery {
      id: channel.id,
      uuid: String::from(&channel.uuid),
      title: channel.title,
      link: channel.link,
      feed_url: channel.feed_url,
      logo: channel.logo,
      description: channel.description,
      pub_date: channel.pub_date,
      sort: channel.sort,
      create_date: channel.create_date,
      update_date: channel.update_date,
      parent_uuid: String::from(
        folder_channel_map
          .get(&String::from(&channel.uuid))
          .unwrap_or(&String::from("")),
      ),
    })
    .collect::<Vec<ChannelQuery>>();

  ChannelQueryResult { list: result }
}

pub async fn update_icon(uuid: &str, url: &str) -> usize {
  let mut connection = db::establish_connection();

  match schema::feeds::dsl::feeds
      .filter(schema::feeds::uuid.eq(uuid))
      .first::<models::Feed>(&mut connection)
  {
      Ok(feed) => {
          if let Some(url) = fetch_site_favicon(url).await {
              println!("url {:?}", url);

              let update_row = diesel::update(schema::feeds::dsl::feeds
                .filter(schema::feeds::uuid.eq(uuid)))
                  .set(schema::feeds::logo.eq(url))
                  .execute(&mut connection);

              match update_row {
                Ok(r) => r,
                Err(err) => {
                  println!("{:?}", err);
                  0
                },
              }
          } else {
              0
          }
      }
      Err(_) => 0,
  }
}

pub async fn fetch_site_favicon(url: &str) -> Option<String> {
  let client = create_client();
  let response = client.get(url).send().await.unwrap();
  let html = response.text().await.unwrap();
  let url = String::from(url);
  let document = Html::parse_document(&html);
  let selector = Selector::parse("link[rel='icon'], link[rel='shortcut icon']").unwrap();
  let mut favicon_url: Option<String> = None;

  for element in document.select(&selector) {
    if let Some(href) = element.value().attr("href") {
      if href.starts_with("http") {
        favicon_url = Some(href.to_string());
      } else {
        let base_url = url::Url::parse(&url).unwrap();
        let mut absolute_url = base_url.join(href).unwrap();
        absolute_url.set_fragment(None);
        favicon_url = Some(absolute_url.as_str().to_string());
      };
    }
  }

  favicon_url
}

#[cfg(test)]
mod tests {
  use super::*;

  #[tokio::test]
  async fn test_fetch_site_favicon() {
    // let url = "https://anyway.fm/now/";
    let url = "/feed.xml";

    let res = fetch_site_favicon(url).await;

    println!("res {:?}", res);
  }

  #[test]
  fn test_get_feeds() {
    let result = get_feeds();
    println!("{:?}", result)
  }

  #[test]
  fn test_get_channels() {
    let result = get_channels();
    println!("result {:?}", result)
  }

  #[test]
  fn test_get_unread_total() {
    let record = get_unread_total();

    println!("{:?}", record);
  }

  #[test]
  fn test_get_last_sort() {
    let mut connection = db::establish_connection();
    let sort = get_last_sort(&mut connection);

    println!("sort {:?}", sort);
  }
}
