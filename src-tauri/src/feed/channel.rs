use std::collections::HashMap;

use diesel::prelude::*;
use serde::Deserialize;
use serde::Serialize;

use crate::db;
use crate::models;
use crate::schema;

pub fn get_channel_by_uuid(channel_uuid: String) -> Option<models::Channel> {
  let mut connection = db::establish_connection();
  let mut channel = schema::channels::dsl::channels
    .filter(schema::channels::uuid.eq(&channel_uuid))
    .load::<models::Channel>(&mut connection)
    .expect("Expect find channel");

  return if channel.len() == 1 {
    channel.pop()
  } else {
    None
  }
}

/// delete channel and associated articles
/// # Example
/// ```
/// let uuid = String::from("123456");
/// let result = delete_channel(uuid);
///
/// assert_eq!(1, result);
/// ```
pub fn delete_channel(uuid: String) -> usize {
  let mut connection = db::establish_connection();
  let channel = schema::channels::dsl::channels
    .filter(schema::channels::uuid.eq(&uuid))
    .load::<models::Channel>(&mut connection)
    .expect("Expect find channel");

  return if channel.len() == 1 {
    let result =
      diesel::delete(schema::channels::dsl::channels.filter(schema::channels::uuid.eq(&uuid)))
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
  }
}

pub fn batch_delete_channel(channel_uuids: Vec<String>) -> usize {
  let mut connection = db::establish_connection();
  let result = diesel::delete(
    schema::channels::dsl::channels.filter(schema::channels::uuid.eq_any(&channel_uuids)),
  )
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

#[derive(Debug, Queryable, Serialize, QueryableByName)]
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
    SELECT id, channel_uuid, count(read_status) as unread_count FROM articles WHERE  read_status = 1 group by channel_uuid;
  ";
  let sql_folders: &str = "
    SELECT child_uuid, parent_uuid, sort FROM feed_metas;
  ";

  let mut connection = db::establish_connection();
  let record = diesel::sql_query(SQL_QUERY_UNREAD_TOTAL)
    .load::<UnreadTotal>(&mut connection)
    .unwrap_or(vec![]);
  let total_map = record.into_iter()
  .map(|r| (r.channel_uuid.clone(), r.unread_count.clone()))
  .collect::<HashMap<String, i32>>();
  let meta_group = diesel::sql_query(sql_folders)
    .load::<MetaGroup>(&mut connection)
    .unwrap_or(vec![]);
  let mut result_map: HashMap<String, i32> = HashMap::new();

  for group in meta_group {
    match total_map.get(&group.child_uuid) {
      Some(count) => {
        if group.parent_uuid != "".to_string() {
          let c= result_map.entry(group.parent_uuid)
            .or_insert(0);

          *c += count;
        }

        result_map.entry(group.child_uuid)
          .or_insert(count.clone());
      },
      None => {}
    };
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
  pub uuid: String,
  pub title: String,
  pub sort: i32,
  pub link: Option<String>,
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
  pub link: String
}

pub fn get_feeds() -> Vec<FeedItem> {
  let sql_folder = "
  SELECT C.name AS title, F.child_uuid AS uuid, F.sort, F.parent_uuid as link, F.parent_uuid AS parent_uuid FROM folders AS C LEFT JOIN feed_metas AS F where F.parent_uuid = '' AND C.uuid = F.child_uuid;
  ";
  let sql_channel = "
  SELECT C.title AS title, F.child_uuid AS uuid, F.sort, C.link, F.parent_uuid as parent_uuid FROM channels as C LEFT JOIN  feed_metas AS F WHERE C.uuid = F.child_uuid;";

  let mut connection = db::establish_connection();

  let channels = diesel::sql_query(sql_channel)
  .load::<FeedJoinRecord>(&mut connection)
  .unwrap_or(vec![]);

  let folders = diesel::sql_query(sql_folder)
  .load::<FeedJoinRecord>(&mut connection)
  .unwrap_or(vec![]);

  let mut folder_channel_map: HashMap<String, Vec<ChildItem>> = HashMap::new();
  let mut result: Vec<FeedItem> = Vec::new();

  for channel in channels {
    let p_uuid = String::from(&channel.parent_uuid);

    if p_uuid != "".to_string() {
      let childs = folder_channel_map.entry(p_uuid.clone()).or_insert(vec![]);

      childs.push(ChildItem {
        uuid: channel.uuid,
        title: channel.title,
        sort: channel.sort,
        link: Some(channel.link),
      });
    } else {
      result.push(FeedItem {
        item_type: String::from("channel"),
        uuid: channel.uuid,
        title: channel.title,
        sort: channel.sort,
        link: Some(channel.link),
        parent_uuid: p_uuid,
        children: Some(Vec::new()),
      });
    }
  }

  for folder in folders {
    let c_uuids = folder_channel_map.entry(String::from(&folder.uuid)).or_insert(vec![]);

    result.push(FeedItem {
      item_type: String::from("folder"),
      uuid: folder.uuid,
      title: folder.title,
      sort: folder.sort,
      link: Some(folder.link),
      parent_uuid: "".to_string(),
      children: Some(c_uuids.to_vec()),
    });
  }

  result.sort_by(|a, b| a.sort.cmp(&b.sort));

  result
}

pub fn get_last_sort(connection: &mut diesel::SqliteConnection) -> i32 {
  let last_sort = schema::feed_metas::dsl::feed_metas
    .select(schema::feed_metas::sort)
    .filter(schema::feed_metas::dsl::parent_uuid.is(""))
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

pub fn add_channel(channel: models::NewChannel, articles: Vec<models::NewArticle>) -> usize {
  let mut connection = db::establish_connection();
  let result = diesel::insert_or_ignore_into(schema::channels::dsl::channels)
    .values(&channel)
    .execute(&mut connection);
  let result = match result {
    Ok(r) => {
      if r == 1 {
        let last_sort = get_last_sort(&mut connection);
        let meta_record = models::NewFeedMeta {
          child_uuid: String::from(channel.uuid),
          parent_uuid: "".to_string(),
          sort: last_sort + 1,
        };

        diesel::insert_or_ignore_into(schema::feed_metas::dsl::feed_metas)
          .values(meta_record)
          .execute(&mut connection)
          .expect("Expect create feed meta");
      }

      r
    }
    Err(_) => 0,
  };

  println!(" new result {:?}", result);

  if result == 1 {
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
  uuid: String,
  item_type: String,
  sort: i32,
}

pub fn update_feed_sort(sorts: Vec<FeedSort>) -> usize {
  let mut connection = db::establish_connection();

  for item in sorts {
    diesel::update(
      schema::feed_metas::dsl::feed_metas.filter(schema::feed_metas::child_uuid.eq(&item.uuid)),
    )
    .set(schema::feed_metas::sort.eq(item.sort))
    .execute(&mut connection)
    .expect("msg");

    println!(" update channel{:?} {:?}", &item.uuid, item.sort);
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
  pub image: String,
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
  parent_uuid: String,
}

#[derive(Debug, Serialize)]
pub struct ChannelQueryResult {
  list: Vec<ChannelQuery>,
}

pub fn get_channels() -> ChannelQueryResult {
  let mut connection = db::establish_connection();
  let sql_channels = "
    SELECT
      C.id as id,
      C.uuid AS uuid,
      C.title AS title,
      C.link AS link,
      C.feed_url AS feed_url,
      C.image AS image,
      C.description AS description,
      C.pub_date as pub_date,
      C.sort as sort,
      C.create_date as create_date,
      C.update_date as update_date,
      F.parent_uuid as parent_uuid
    FROM channels AS C LEFT JOIN feed_metas AS F
    ON F.child_uuid = C.uuid
    ORDER BY create_date DESC
  ";

  let channels = diesel::sql_query(sql_channels)
    .load::<ChannelQuery>(&mut connection)
    .unwrap_or(vec![]);

  ChannelQueryResult { list: channels }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_get_feeds() {
    let result = get_feeds();
    println!("{:?}", result)
  }

  #[test]
  fn test_get_unread_total() {
    let record = get_unread_total();

    println!("{:?}", record);
  }
}
