use std::collections::HashMap;

use chrono::Local;
use diesel::prelude::*;
use diesel::sql_types::*;
use log::info;
use log::warn;
use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};

use crate::cmd::create_article_models;
use crate::db;
use crate::feed;
use crate::models;
use crate::schema;

pub fn get_feed_by_uuid(channel_uuid: &str) -> Option<models::Feed> {
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

    diesel::delete(schema::feed_metas::dsl::feed_metas.filter(schema::feed_metas::uuid.eq(&uuid)))
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
    .filter(schema::feed_metas::uuid.eq_any(&channel_uuids))
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

pub fn update_health_status(
  uuid: &str,
  health_status: i32,
  failure_reason: String,
) -> (usize, String, String) {
  let mut connection = db::establish_connection();

  match feed::channel::get_feed_by_uuid(uuid) {
    Some(_channel) => {
      let sync_date = Local::now();

      let updated_row =
        diesel::update(schema::feeds::dsl::feeds.filter(schema::feeds::uuid.eq(uuid)))
          .set((
            schema::feeds::health_status.eq(health_status),
            schema::feeds::failure_reason.eq(failure_reason),
            schema::feeds::last_sync_date.eq(sync_date.format("%Y-%m-%d %H:%M:%S").to_string()),
          ))
          .execute(&mut connection)
          .expect("update feed meta");

      return (updated_row, String::from(""), String::from(""));
    }
    None => return (0, String::from(uuid), "feed not found".to_string()),
  }
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
  pub folder_uuid: String,
  pub sort: i32,
}

pub fn update_feed_meta(uuid: String, update: FeedMetaUpdateRequest) -> usize {
  let mut connection = db::establish_connection();
  let updated_row =
    diesel::update(schema::feed_metas::dsl::feed_metas.filter(schema::feed_metas::uuid.eq(uuid)))
      .set((
        schema::feed_metas::folder_uuid.eq(update.folder_uuid),
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
pub struct SubscribeItem {
  pub item_type: String,
  pub uuid: String,
  pub title: String,
  pub sort: i32,
  pub children: Option<Vec<ChildItem>>,
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
  pub folder_uuid: String,
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

pub fn get_feeds() -> Vec<SubscribeItem> {
  let sql_feed_in_folder = "
    SELECT
      C.title AS title,
      F.uuid AS uuid,
      F.sort,
      C.link,
      C.logo,
      C.feed_url,
      C.description,
      C.create_date,
      F.folder_uuid as folder_uuid
    FROM feeds as C
    LEFT JOIN feed_metas AS F
    ON C.uuid = F.uuid
    WHERE folder_uuid != '' and folder_uuid IS NOT NULL
    ORDER BY F.sort ASC;";

  let mut connection = db::establish_connection();

  let feeds_in_folder = diesel::sql_query(sql_feed_in_folder)
    .load::<FeedJoinRecord>(&mut connection)
    .unwrap_or(vec![]);
  let folders = schema::folders::dsl::folders
    .load::<models::Folder>(&mut connection)
    .unwrap();

  let mut folder_channel_map: HashMap<String, Vec<ChildItem>> = HashMap::new();
  let mut result: Vec<SubscribeItem> = Vec::new();
  let mut filter_uuids: Vec<String> = Vec::new();

  for channel in feeds_in_folder {
    let p_uuid = String::from(&channel.folder_uuid);
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

    result.push(SubscribeItem {
      item_type: String::from("folder"),
      uuid: folder.uuid,
      title: folder.name,
      sort: folder.sort,
      link: Some(String::from("")),
      logo: String::from(""),
      children: Some(c_uuids.to_vec()),
      feed_url: "".to_string(),
      description: "".to_string(),
      create_date: folder.create_date,
    });
  }

  log::debug!("filter_uuids :{:?}", &filter_uuids);

  let feeds = schema::feeds::dsl::feeds
    .filter(diesel::dsl::not(schema::feeds::uuid.eq_any(&filter_uuids)))
    .load::<models::Feed>(&mut connection)
    .unwrap();

  for feed in feeds {
    result.push(SubscribeItem {
      item_type: String::from("channel"),
      uuid: feed.uuid,
      title: feed.title,
      sort: feed.sort,
      link: Some(feed.link),
      logo: feed.logo,
      feed_url: feed.feed_url,
      description: feed.description,
      create_date: feed.create_date,
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
    Err(error) => {
      if let diesel::result::Error::DatabaseError(
        diesel::result::DatabaseErrorKind::UniqueViolation,
        _,
      ) = error
      {
        return (
          0,
          "The feed you are trying to save already exists.".to_string(),
        );
      } else {
        return (0, error.to_string());
      }
    }
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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FeedSort {
  item_type: String,
  uuid: String,
  folder_uuid: String,
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

  warn!("sorts: {:?}", sorts);

  for item in sorts {
    let mut query = diesel::sql_query("").into_boxed();

    if item.folder_uuid.len() > 0 && item.uuid.len() > 0 && item.folder_uuid != item.uuid {
      query = query
        .sql(format!(
          "
          insert into feed_metas (id, uuid, folder_uuid, sort) values
        ((select id from feed_metas where uuid = ?), ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET folder_uuid = excluded.folder_uuid, sort = excluded.sort;
        "
        ))
        .bind::<Text, _>(&item.uuid)
        .bind::<Text, _>(&item.uuid)
        .bind::<Text, _>(&item.folder_uuid)
        .bind::<Integer, _>(&item.sort);

      let debug = diesel::debug_query::<diesel::sqlite::Sqlite, _>(&query);

      query
        .load::<FeedSortRes>(&mut connection)
        .expect("Expect loading articles");
    }

    if item.folder_uuid.len() == 0 && item.uuid.len() > 0 {
      diesel::update(schema::feeds::dsl::feeds.filter(schema::feeds::uuid.eq(&item.uuid)))
        .set(schema::feeds::sort.eq(item.sort))
        .execute(&mut connection)
        .expect("msg");
      diesel::delete(schema::feed_metas::dsl::feed_metas.filter(schema::feed_metas::uuid.eq(&item.uuid)))
      .execute(&mut connection)
      .expect("delete feed from folder");
    }

    if item.folder_uuid.len() > 0 && item.folder_uuid == item.uuid {
      diesel::update(schema::folders::dsl::folders.filter(schema::folders::uuid.eq(&item.uuid)))
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
  pub health_status: i32,
  #[diesel(sql_type = diesel::sql_types::Text)]
  pub failure_reason: String,
  #[diesel(sql_type = diesel::sql_types::Integer)]
  pub sort: i32,
  #[diesel(sql_type = diesel::sql_types::Integer)]
  pub sync_interval: i32,
  #[diesel(sql_type = diesel::sql_types::Text)]
  pub last_sync_date: String,
  #[diesel(sql_type = diesel::sql_types::Text)]
  pub create_date: String,
  #[diesel(sql_type = diesel::sql_types::Text)]
  pub update_date: String,
  #[diesel(sql_type = diesel::sql_types::Text)]
  pub parent_uuid: String,
  #[diesel(sql_type = diesel::sql_types::Text)]
  pub folder_uuid: String,
  #[diesel(sql_type = diesel::sql_types::Text)]
  pub folder_name: String,
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
  let folders = schema::folders::dsl::folders
    .load::<models::Folder>(&mut connection)
    .unwrap_or(vec![]);
  let mut folder_channel_map: HashMap<String, (String, String)> = HashMap::new();
  let mut folder_name_map: HashMap<String, String> = HashMap::new();

  for f in folders {
    folder_name_map.insert(f.uuid.clone(), String::from(f.name));
  }

  for r in relations {
    folder_channel_map.insert(
      r.uuid.clone(),
      (
        r.folder_uuid.clone(),
        folder_name_map
          .get(&r.folder_uuid)
          .unwrap_or(&"".to_string())
          .to_string(),
      ),
    );
  }

  let result: Vec<ChannelQuery> = channels
    .into_iter()
    .map(|channel| {
      let mut folder_uuid = "".to_string();
      let mut folder_name = "".to_string();

      if let Some((uuid, name)) = folder_channel_map.get(&channel.uuid).cloned() {
        folder_uuid = uuid;
        folder_name = name;
      }

      ChannelQuery {
        id: channel.id,
        uuid: String::from(&channel.uuid),
        title: channel.title,
        link: channel.link,
        feed_url: channel.feed_url,
        logo: channel.logo,
        description: channel.description,
        pub_date: channel.pub_date,
        health_status: channel.health_status,
        failure_reason: channel.failure_reason,
        sort: channel.sort,
        sync_interval: channel.sync_interval,
        last_sync_date: channel.last_sync_date,
        create_date: channel.create_date,
        update_date: channel.update_date,
        parent_uuid: folder_uuid.clone(),
        folder_uuid: folder_uuid,
        folder_name: folder_name,
      }
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
    Ok(_feed) => {
      if let Some(url) = fetch_site_favicon(url).await {
        println!("url {:?}", url);

        let update_row =
          diesel::update(schema::feeds::dsl::feeds.filter(schema::feeds::uuid.eq(uuid)))
            .set(schema::feeds::logo.eq(url))
            .execute(&mut connection);

        match update_row {
          Ok(r) => r,
          Err(err) => {
            println!("{:?}", err);
            0
          }
        }
      } else {
        0
      }
    }
    Err(_) => 0,
  }
}

pub async fn fetch_site_favicon(url: &str) -> Option<String> {
  let client = feed::create_client();
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

pub async fn sync_articles(uuid: String) -> HashMap<String, (usize, String)> {
  let mut result = HashMap::new();

  let channel = match feed::channel::get_feed_by_uuid(&uuid) {
    Some(channel) => channel,
    None => return HashMap::new(),
  };

  let res = match feed::parse_feed(&channel.feed_url).await {
    Ok(res) => {
      feed::channel::update_health_status(&uuid, 0, "".to_string());
      res
    }
    Err(err) => {
      feed::channel::update_health_status(&uuid, 1, err.to_string());
      result.insert(uuid, (0, err.to_string()));

      return result;
    }
  };

  let articles = create_article_models(&channel.uuid, &channel.feed_url, &res);
  let record = feed::article::Article::add_articles(channel.uuid, articles);

  result.insert(uuid, (record, "".to_string()));

  return result;

}

pub async fn sync_article_in_folder(uuid: String) -> HashMap<String, (usize, String)> {
  let connection = db::establish_connection();
  let feeds = feed::folder::get_channels_in_folders(connection, vec![uuid.clone()]);
  let mut result: HashMap<String, (usize, String)> = HashMap::new();
  let mut count = 0;


  log::debug!("sync_article_in_folder: feeds {:?}", feeds);

  for feed in feeds {
    let record = sync_articles(feed.uuid.clone()).await;
    let (num, _message) = record.get(&String::from(feed.uuid)).unwrap();
    result.extend(record.clone());
    count += num;
  }

  result.insert(uuid, (count, String::from("")));

  result
}

// pub struct SyncFeedResult {}
pub async fn sync_feed(uuid: String, feed_type: String) -> HashMap<String, (usize, String)> {
  if feed_type == "folder" {
    return feed::channel::sync_article_in_folder(uuid.to_string()).await;
  } else {
    log::debug!("start sync feed ===>");
    return feed::channel::sync_articles(uuid.to_string()).await;
  }
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

  #[tokio::test]
  async fn test_sync_feed() {
    let a = sync_feed(
      "efc718b5-14a8-45ce-8d0b-975013198ac1".to_string(),
      "feed".to_string(),
    )
    .await;

    println!("a {:?}", a);
  }
}
