use diesel::prelude::*;
use uuid::Uuid;

use crate::db;
use crate::feed;
use crate::models;
use crate::schema;

pub struct FolderFilter {
  pub name: Option<String>,
  pub order_by: Option<String>,
  pub sort: Option<String>,
}

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

pub fn update_folder_name(uuid: String, name: &str) -> usize {
  let mut connection = db::establish_connection();
  let result =
    diesel::update(schema::folders::dsl::folders.filter(schema::folders::uuid.eq(&uuid)))
      .set(schema::folders::name.eq(name))
      .execute(&mut connection)
      .expect("update folder name");

  result
}

pub fn get_folder_by_uuid(folder_uuid: String) -> Option<models::Folder> {
  let mut connection = db::establish_connection();
  let mut folder = schema::folders::dsl::folders
    .filter(schema::folders::uuid.eq(&folder_uuid))
    .load::<models::Folder>(&mut connection)
    .expect("Expect find folder");

  if folder.len() == 1 {
    return folder.pop();
  } else {
    return None;
  }
}

pub fn get_folder_channel_relation_by_uuid(
  folder_uuid: String,
  channel_uuid: Option<String>,
) -> Vec<models::FolderChannelRelation> {
  let mut connection = db::establish_connection();
  let mut query = schema::folder_channel_relations::dsl::folder_channel_relations.into_boxed();

  query = query.filter(schema::folder_channel_relations::folder_uuid.eq(folder_uuid));

  match channel_uuid {
    Some(channel_uuid) => {
      query = query.filter(schema::folder_channel_relations::channel_uuid.eq(channel_uuid));
    }
    None => {}
  };

  let relations = query
    .load::<models::FolderChannelRelation>(&mut connection)
    .expect("Expect find relations");

  relations
}

pub fn add_folder_channel_relation(folder_uuid: String, channel_uuid: String) -> usize {
  let relation = get_folder_channel_relation_by_uuid(
    String::from(&folder_uuid),
    Some(String::from(&channel_uuid)),
  );

  if relation.len() == 1 {
    return 0;
  }

  let mut connection = db::establish_connection();
  let channel = feed::channel::get_channel_by_uuid(String::from(&channel_uuid));
  let folder = get_folder_by_uuid(String::from(&folder_uuid));
  let res = channel
    .map(|_channel| {
      return folder.map(|_folder| {
        let record = models::NewFolderChannelRelation {
          channel_uuid,
          folder_uuid,
        };

        let result = diesel::insert_or_ignore_into(
          schema::folder_channel_relations::dsl::folder_channel_relations,
        )
        .values(record)
        .execute(&mut connection);

        match result {
          Ok(r) => r,
          Err(_) => 0,
        }
      });
    })
    .and_then(|res| res);

  match res {
    Some(res) => res,
    None => 0,
  }
}

pub fn delete_folder_channel_relation(
  folder_uuid: String,
  channel_uuids: Option<Vec<String>>,
) -> usize {
  let mut connection = db::establish_connection();
  let mut query =
    diesel::delete(schema::folder_channel_relations::dsl::folder_channel_relations).into_boxed();

  query = query.filter(schema::folder_channel_relations::folder_uuid.eq(folder_uuid));

  match channel_uuids {
    Some(channel_uuids) => {
      query = query.filter(schema::folder_channel_relations::channel_uuid.eq_any(channel_uuids))
    }
    None => {}
  };

  let result = query
    .execute(&mut connection)
    .expect("Expect delete folder channel relations");

  result
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

  #[test]
  fn test_get_folder_channel_relation_by_uuid() {
    let uuid = String::from("9fdf54ce-6397-485d-959a-2992ee4a89e7");
    let result = get_folder_channel_relation_by_uuid(uuid, None);

    println!("{:?}", result);
  }

  #[test]
  fn test_add_folder_channel_relation() {
    let result = add_folder_channel_relation(
      String::from("9fdf54ce-6397-485d-959a-2992ee4a89e7"),
      String::from("8c8b86b3-4df2-49b6-b690-83cf3a28208e"),
    );
    println!("{:?}", result);
  }

  #[test]
  fn test_delete_folder_channel_relation() {
    let mut uuids = Vec::new();

    uuids.push(String::from("20ffec43-2557-4573-8a38-4a29885712a7"));

    let result = delete_folder_channel_relation(
      String::from("9fdf54ce-6397-485d-959a-2992ee4a89e7"),
      Some(uuids),
    );
    println!("{:?}", result);
  }
}
