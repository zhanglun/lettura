use diesel::prelude::*;
use uuid::Uuid;

use crate::db;
use crate::models;
use crate::schema;

pub fn get_collections() -> Vec<models::Collection> {
    let mut connection = db::establish_connection();
    schema::collections::dsl::collections
        .order(schema::collections::dsl::sort_order.asc())
        .load::<models::Collection>(&mut connection)
        .expect("Expect loading collections")
}

pub fn get_collection_by_uuid(uuid: String) -> Option<models::Collection> {
    let mut connection = db::establish_connection();
    let mut results = schema::collections::dsl::collections
        .filter(schema::collections::uuid.eq(&uuid))
        .load::<models::Collection>(&mut connection)
        .expect("Expect find collection");
    results.pop()
}

pub fn create_collection(name: String, description: Option<String>, icon: Option<String>) -> (usize, String) {
    let mut connection = db::establish_connection();
    let uuid = Uuid::new_v4().hyphenated().to_string();
    let collection = models::NewCollection {
        uuid,
        name,
        description: description.unwrap_or_default(),
        icon: icon.unwrap_or_default(),
        sort_order: 0,
    };
    let result = diesel::insert_into(schema::collections::dsl::collections)
        .values(collection)
        .execute(&mut connection);
    match result {
        Ok(r) => (r, String::from("")),
        Err(e) => (0, e.to_string()),
    }
}

pub fn update_collection(uuid: String, name: Option<String>, description: Option<String>, icon: Option<String>) -> (usize, String) {
    let mut connection = db::establish_connection();
    let existing = schema::collections::dsl::collections
        .filter(schema::collections::uuid.eq(&uuid))
        .load::<models::Collection>(&mut connection)
        .expect("Expect find collection");
    if existing.is_empty() {
        return (0, "Collection not found".to_string());
    }
    let existing = &existing[0];

    use schema::collections::dsl::{name as col_name, description as col_desc, icon as col_icon};
    let result = diesel::update(schema::collections::dsl::collections.filter(schema::collections::uuid.eq(&uuid)))
        .set((
            col_name.eq(name.unwrap_or_else(|| existing.name.clone())),
            col_desc.eq(description.unwrap_or_else(|| existing.description.clone())),
            col_icon.eq(icon.unwrap_or_else(|| existing.icon.clone())),
        ))
        .execute(&mut connection);
    match result {
        Ok(r) => (r, String::from("")),
        Err(e) => (0, e.to_string()),
    }
}

pub fn delete_collection(uuid: String) -> usize {
    let mut connection = db::establish_connection();
    diesel::delete(schema::collections::dsl::collections.filter(schema::collections::uuid.eq(&uuid)))
        .execute(&mut connection)
        .unwrap_or(0)
}

pub fn add_article_to_collection(article_id: i32, collection_id: i32) -> (usize, String) {
    let mut connection = db::establish_connection();
    let link = models::NewArticleCollection { article_id, collection_id };
    let result = diesel::insert_or_ignore_into(schema::article_collections::dsl::article_collections)
        .values(link)
        .execute(&mut connection);
    match result {
        Ok(r) => (r, String::from("")),
        Err(e) => (0, e.to_string()),
    }
}

pub fn remove_article_from_collection(article_id: i32, collection_id: i32) -> usize {
    let mut connection = db::establish_connection();
    diesel::delete(
        schema::article_collections::dsl::article_collections
            .filter(schema::article_collections::article_id.eq(article_id))
            .filter(schema::article_collections::collection_id.eq(collection_id))
    )
    .execute(&mut connection)
    .unwrap_or(0)
}

pub fn get_article_collections(article_id: i32) -> Vec<models::Collection> {
    let mut connection = db::establish_connection();
    schema::article_collections::dsl::article_collections
        .inner_join(schema::collections::dsl::collections.on(
            schema::article_collections::collection_id.eq(schema::collections::id),
        ))
        .filter(schema::article_collections::article_id.eq(article_id))
        .select(schema::collections::all_columns)
        .load::<models::Collection>(&mut connection)
        .expect("Expect loading article collections")
}

pub fn get_collection_article_ids(collection_uuid: String) -> Vec<i32> {
    let mut connection = db::establish_connection();
    let collection = schema::collections::dsl::collections
        .filter(schema::collections::uuid.eq(&collection_uuid))
        .first::<models::Collection>(&mut connection);

    match collection {
        Ok(col) => {
            schema::article_collections::dsl::article_collections
                .filter(schema::article_collections::collection_id.eq(col.id))
                .select(schema::article_collections::article_id)
                .load::<i32>(&mut connection)
                .unwrap_or_default()
        }
        Err(_) => vec![],
    }
}
