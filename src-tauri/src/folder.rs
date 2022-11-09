use diesel::prelude::*;
use uuid::Uuid;

use crate::db;
use crate::models;
use crate::schema;

pub fn create_folder(folder: models::NewFolder) -> usize {
  let mut connection = db::establish_connection();
  let result = diesel::insert_or_ignore_into(schema::folders::dsl::folders)
    .values(folder)
    .execute(&mut connection);

  let result = match result {
    Ok(r) => r,
    Err(_) => 0,
  };

  result
}

pub struct FolderFilter {
  pub name: Option<String>,
  pub order_by: Option<String>,
  pub sort: Option<String>,
}

pub fn add_folder(folder_name: String) -> usize {
  let uuid = Uuid::new_v4().hyphenated().to_string();
  let folder = models::NewFolder {
    uuid,
    name: folder_name,
  };

  let result = create_folder(folder);

  result
}

pub fn get_folders() -> Vec<models::Folder> {
  let mut connection = db::establish_connection();
  let results = schema::folders::dsl::folders
    .order(schema::folders::dsl::name.desc())
    .load::<models::Folder>(&mut connection)
    .expect("Expect loading posts");

  results
}


pub fn delete_folders(uuid: String) -> usize {
  let mut connection = db::establish_connection();
  let folder = schema::folders::dsl::folders
    .filter(schema::folders::uuid.eq(&uuid))
    .load::<models::Folder>(&mut connection)
    .expect("Expect find folder");

  if folder.len() == 1 {
    // let result =
    //   diesel::delete(schema::folders::dsl::folders.filter(schema::folders::uuid.eq(&uuid)))
    //     .execute(&mut connection)
    //     .expect("Expect delete folder");
    let relations = get_folder_channel_relation_by_uuid(String::from(&uuid), None);
    let channel_uuids = relations.into_iter().map(|item| item.channle_uuid);

    println!("{:?}", channel_uuids);
    // TODO delete channel and articles

    // return result;
    return 1;
  } else {
    return 0;
  }
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
) -> Vec<models::FolderChannelRealtion> {
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
    .load::<models::FolderChannelRealtion>(&mut connection)
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
  let channel = db::get_channel_by_uuid(String::from(&channel_uuid));
  let folder = get_folder_by_uuid(String::from(&folder_uuid));
  let res = channel
    .map(|_channel| {
      return folder.map(|_folder| {
        let record = models::NewFolderChannelRealtion {
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
    let uuid = Uuid::new_v4().hyphenated().to_string();
    let folder = models::NewFolder {
      uuid,
      name: "test folder".to_string(),
    };
    let result = create_folder(folder);
    println!("{}", result);
  }

  #[test]
  fn test_get_folders() {
    let result = get_folders();
    println!("{:?}", result);
  }

  // #[test]
  // fn test_delete_folders() {
  //   let uuid = String::from("asdfasdf");
  //   let reuslt = delete_folders(uuid);
  //   println!("{:?}", result);
  // }

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
