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
    .filter(schema::feed_metas::folder_uuid.eq_any(&uuids))
    .load::<models::FeedMeta>(&mut connection)
    .expect("Expect get feed meta");

  result
}

pub fn create_folder(folder_name: String) -> (usize, String) {
  let mut connection = db::establish_connection();
  let uuid = Uuid::new_v4().hyphenated().to_string();
  let folder = models::NewFolder {
    uuid: String::from(&uuid),
    name: folder_name,
    sort: 0,
  };

  let result = diesel::insert_or_ignore_into(schema::folders::dsl::folders)
    .values(folder)
    .execute(&mut connection);

  let result = match result {
    Ok(r) => (r, String::from("")),
    Err(error) => {
      return (0, error.to_string());
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
      .filter(schema::feed_metas::folder_uuid.eq_any(vec![String::from(&uuid)]))
      .load::<models::FeedMeta>(&mut connection)
      .expect("Expect get feed meta");
    let channel_uuids = relations.into_iter().map(|item| item.uuid).collect();

    println!("{:?}", channel_uuids);

    let channels = feed::channel::batch_delete_feed(channel_uuids);

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

  if folder.len() == 1 {
    let res = diesel::update(schema::folders::dsl::folders.filter(schema::folders::uuid.eq(&uuid)))
      .set(schema::folders::name.eq(name))
      .execute(&mut connection);
    match res {
      Ok(r) => {
        return (r, String::from(""));
      }
      Err(error) => {
        return (0, error.to_string());
      }
    }
  } else {
    (0, String::from("No Folder Found!"))
  }
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
