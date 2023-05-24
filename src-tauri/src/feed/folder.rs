use diesel::connection;
use diesel::prelude::*;
use uuid::Uuid;

use crate::db;
use crate::feed;
use crate::models;
use crate::schema;

pub fn get_channels_in_folders(
  mut connection: diesel::SqliteConnection,
  uuids: Vec<String>,
) -> Vec<models::FeedMeta> {
  let result = schema::feed_metas::dsl::feed_metas
    .filter(schema::feed_metas::parent_uuid.eq_any(&uuids))
    .load::<models::FeedMeta>(&mut connection)
    .expect("Expect get feed meta");

  result
}

pub fn create_folder(folder_name: String) -> usize {
  let mut connection = db::establish_connection();
  let last_sort = schema::feed_metas::dsl::feed_metas
    .select(schema::feed_metas::sort)
    .filter(schema::feed_metas::parent_uuid.eq(""))
    .get_results::<i32>(&mut connection);

  let last_sort = match last_sort {
    Ok(mut rec) => rec.pop(),
    Err(_) => None,
  };

  let last_sort = match last_sort {
    Some(s) => s,
    None => 0,
  };

  println!("{:?}", last_sort);

  let uuid = Uuid::new_v4().hyphenated().to_string();
  let folder = models::NewFolder {
    uuid: String::from(&uuid),
    name: folder_name,
    sort: last_sort + 1,
  };

  let folder_record = diesel::insert_or_ignore_into(schema::folders::dsl::folders)
    .values(folder)
    .execute(&mut connection);
  let result = match folder_record {
    Ok(record) => {
      if record == 1 {
        let feed_meta = models::NewFeedMeta {
          child_uuid: String::from(&uuid),
          parent_uuid: "".to_string(),
          sort: last_sort + 1,
        };

        let result = diesel::insert_or_ignore_into(schema::feed_metas::dsl::feed_metas)
          .values(feed_meta)
          .execute(&mut connection);

        match result {
          Ok(r) => r,
          Err(_) => 0,
        }
      } else {
        0
      }
    }
    _ => {
      return 0;
    }
  };

  result
}

pub fn get_folders() -> Vec<models::Folder> {
  let mut connection = db::establish_connection();
  let results = schema::folders::dsl::folders
    .order(schema::folders::dsl::sort.asc())
    .load::<models::Folder>(&mut connection)
    .expect("Expect loading folders");

  results
}

pub fn delete_folder(uuid: String) -> (usize, usize) {
  let mut connection = db::establish_connection();
  let folder = schema::folders::dsl::folders
    .filter(schema::folders::uuid.eq(&uuid))
    .load::<models::Folder>(&mut connection)
    .expect("Expect find folder");

  println!(" ===> {:?}", folder);

  if folder.len() == 1 {
    let relations = schema::feed_metas::dsl::feed_metas
      .filter(schema::feed_metas::parent_uuid.eq_any(vec![String::from(&uuid)]))
      .load::<models::FeedMeta>(&mut connection)
      .expect("Expect get feed meta");
    let channel_uuids = relations.into_iter().map(|item| item.child_uuid).collect();

    println!("{:?}", channel_uuids);

    let channels = feed::channel::batch_delete_channel(channel_uuids);

    diesel::delete(schema::folders::dsl::folders.filter(schema::folders::uuid.eq(&uuid)))
      .execute(&mut connection)
      .expect("Expect delete folder");

    return (1, channels);
  } else {
    return (0, 0);
  }
}

pub fn update_folder(uuid: String, name: String) -> (usize, String) {
  let mut connection = db::establish_connection();
  let folder = schema::folders::dsl::folders
    .filter(schema::folders::uuid.eq(&uuid))
    .load::<models::Folder>(&mut connection)
    .expect("Expect find folder");

  println!(" ===> {:?}", folder);

  if folder.len() == 1 {

  }

  (1, String::from(""))
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_create_folder() {
    create_folder("asdf".to_string());
  }

  #[test]
  fn test_get_folders() {
    let result = get_folders();
    println!("{:?}", result);
  }
}
