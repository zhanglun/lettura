use diesel::prelude::*;
use uuid::Uuid;

use crate::db;
use crate::folder;
use crate::models;
use crate::schema;

pub fn delete_channel(uuid: String) -> usize {
  let mut connection = db::establish_connection();
  let channel = schema::channels::dsl::channels
    .filter(schema::channels::uuid.eq(&uuid))
    .load::<models::Channel>(&mut connection)
    .expect("Expect find channel");

  if channel.len() == 1 {
    let result =
      diesel::delete(schema::channels::dsl::channels.filter(schema::channels::uuid.eq(&uuid)))
        .execute(&mut connection)
        .expect("Expect delete channel");

    diesel::delete(
      schema::articles::dsl::articles.filter(schema::articles::channel_uuid.eq(&uuid)),
    )
    .execute(&mut connection)
    .expect("Expect delete channel");

    return result;
  } else {
    return 0;
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

pub fn get_channel_meta_with_uuids(channel_uuids: Vec<String>) -> Vec<models::FeedMeta> {
  let mut connection = db::establish_connection();
  let result = schema::feed_metas::dsl::feed_metas
    .filter(schema::feed_metas::channel_uuid.eq_any(&channel_uuids))
    .load::<models::FeedMeta>(&mut connection)
    .expect("Expect get feed meta");

  result
}

pub fn get_all_channel_meta() -> Vec<models::FeedMeta> {
  let mut connection = db::establish_connection();
  let result = schema::feed_metas::dsl::feed_metas
    .load::<models::FeedMeta>(&mut connection)
    .expect("Expect get feed meta");

  result
}

pub fn get_feeds() -> (Vec<models::Folder>, Vec<models::Channel>) {
  let folders = folder::get_folders();
  let relations = get_all_channel_meta();
  let mut folder_uuids: Vec<String> = vec![];
  let mut channel_uuids: Vec<String> = vec![];

  println!("{:?}", relations);

  for relation in relations {
    if relation.parent_uuid == "" {
      folder_uuids.push(relation.parent_uuid);
    } else {
      channel_uuids.push(relation.channel_uuid);
    }
  }

  println!("{:?}", &channel_uuids);

  let mut connection = db::establish_connection();
  let channels = schema::channels::dsl::channels
    .filter(diesel::dsl::not(
      schema::channels::uuid.eq_any(&channel_uuids),
    ))
    .load::<models::Channel>(&mut connection)
    .expect("dff");

  return (folders, channels);
}

pub fn get_last_sort(connection: &mut diesel::SqliteConnection) -> i32 {
  let last_sort = schema::feed_metas::dsl::feed_metas
    .select(schema::feed_metas::sort)
    .filter(schema::feed_metas::dsl::parent_uuid.is_not(""))
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
        let uuid = Uuid::new_v4().hyphenated().to_string();
        let last_sort = get_last_sort(&mut connection);
        let meta_record = models::NewFeedMeta {
          uuid,
          channel_uuid: String::from(channel.uuid),
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

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_get_feeds() {
    let result = get_feeds();
    println!("{:?}", result)
  }
}
