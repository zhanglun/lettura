use diesel::prelude::*;

use crate::models;
use crate::schema;
use crate::db;

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

pub fn get_channel_meta_with_uuids (channel_uuids: Vec<String>) -> Vec<models::FeedMeta> {
  let mut connection = db::establish_connection();
  let result = schema::feed_metas::dsl::feed_metas
    .filter(schema::feed_metas::channel_uuid.eq_any(&channel_uuids))
    .load::<models::FeedMeta>(&mut connection)
    .expect("Expect get feed meta");

  result
}


pub fn get_feeds() {
  // 1. 获取folders
  // 2. 获取 feed_meta
  // 3. 遍历folders，绑定channel_uuid
  // 4. 没有parent_uuid的channel 按照order排序
  // 5. 返回folder+channel的列表
}
