use diesel::prelude::*;
use uuid::Uuid;

use crate::db;
use crate::models;
use crate::schema;

pub fn get_tags() -> Vec<models::Tag> {
    let mut connection = db::establish_connection();
    schema::tags::dsl::tags
        .order(schema::tags::dsl::name.asc())
        .load::<models::Tag>(&mut connection)
        .expect("Expect loading tags")
}

pub fn create_tag(name: String) -> (usize, String) {
    let mut connection = db::establish_connection();
    let uuid = Uuid::new_v4().hyphenated().to_string();
    let tag = models::NewTag { uuid, name };
    let result = diesel::insert_into(schema::tags::dsl::tags)
        .values(tag)
        .execute(&mut connection);
    match result {
        Ok(r) => (r, String::from("")),
        Err(e) => (0, e.to_string()),
    }
}

pub fn delete_tag(uuid: String) -> usize {
    let mut connection = db::establish_connection();
    diesel::delete(schema::tags::dsl::tags.filter(schema::tags::uuid.eq(&uuid)))
        .execute(&mut connection)
        .unwrap_or(0)
}

pub fn add_tag_to_article(article_id: i32, tag_name: String) -> (usize, String) {
    let mut connection = db::establish_connection();

    let existing = schema::tags::dsl::tags
        .filter(schema::tags::name.eq(&tag_name))
        .first::<models::Tag>(&mut connection);

    let tag_id = match existing {
        Ok(tag) => tag.id,
        Err(_) => {
            let uuid = Uuid::new_v4().hyphenated().to_string();
            let tag = models::NewTag { uuid, name: tag_name.clone() };
            diesel::insert_into(schema::tags::dsl::tags)
                .values(tag)
                .returning(schema::tags::id)
                .get_result(&mut connection)
                .expect("Failed to create tag")
        }
    };

    let link = models::NewArticleTag { article_id, tag_id };
    let result = diesel::insert_or_ignore_into(schema::article_tags::dsl::article_tags)
        .values(link)
        .execute(&mut connection);
    match result {
        Ok(r) => (r, String::from("")),
        Err(e) => (0, e.to_string()),
    }
}

pub fn remove_tag_from_article(article_id: i32, tag_id: i32) -> usize {
    let mut connection = db::establish_connection();
    diesel::delete(
        schema::article_tags::dsl::article_tags
            .filter(schema::article_tags::article_id.eq(article_id))
            .filter(schema::article_tags::tag_id.eq(tag_id))
    )
    .execute(&mut connection)
    .unwrap_or(0)
}

pub fn get_article_tags(article_id: i32) -> Vec<models::Tag> {
    let mut connection = db::establish_connection();
    let tag_ids = schema::article_tags::dsl::article_tags
        .filter(schema::article_tags::article_id.eq(article_id))
        .select(schema::article_tags::tag_id)
        .load::<i32>(&mut connection)
        .unwrap_or_default();

    if tag_ids.is_empty() {
        return vec![];
    }

    schema::tags::dsl::tags
        .filter(schema::tags::id.eq_any(tag_ids))
        .load::<models::Tag>(&mut connection)
        .unwrap_or_default()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{db, models, schema};
    use diesel::prelude::*;
    use diesel::sqlite::SqliteConnection;

    fn insert_test_feed(conn: &mut SqliteConnection) -> String {
        let feed_uuid = uuid::Uuid::new_v4().hyphenated().to_string();
        diesel::insert_into(schema::feeds::table)
            .values(models::NewFeed {
                uuid: feed_uuid.clone(),
                feed_type: "rss".to_string(),
                title: "Test Feed".to_string(),
                link: format!("https://{}.example.com", &feed_uuid[..8]),
                logo: "".to_string(),
                feed_url: format!("https://{}.example.com/feed.xml", &feed_uuid[..8]),
                description: "Test".to_string(),
                pub_date: "2024-01-01 00:00:00".to_string(),
                updated: "2024-01-01 00:00:00".to_string(),
                sort: 0,
            })
            .execute(conn)
            .expect("Failed to insert feed");
        feed_uuid
    }

    fn insert_test_article(conn: &mut SqliteConnection, feed_uuid: &str) -> i32 {
        let article_uuid = uuid::Uuid::new_v4().hyphenated().to_string();
        diesel::insert_into(schema::articles::table)
            .values(models::NewArticle {
                uuid: article_uuid,
                feed_uuid: feed_uuid.to_string(),
                title: format!("Test Article {}", uuid::Uuid::new_v4()),
                link: format!("https://example.com/a/{}", uuid::Uuid::new_v4()),
                feed_url: format!("https://example.com/f/{}", uuid::Uuid::new_v4()),
                description: "Test".to_string(),
                content: "Content".to_string(),
                author: "Author".to_string(),
                pub_date: "2024-01-01 00:00:00".to_string(),
                media_object: "".to_string(),
            })
            .returning(schema::articles::id)
            .get_result(conn)
            .expect("Failed to insert article")
    }

    #[test]
    fn test_add_new_tag_to_article() {
        let mut conn = db::establish_connection();
        let feed_uuid = insert_test_feed(&mut conn);
        let article_id = insert_test_article(&mut conn, &feed_uuid);

        // Create 2 pre-existing tags
        let tag1_name = format!("tag1_{}", uuid::Uuid::new_v4().hyphenated());
        let tag2_name = format!("tag2_{}", uuid::Uuid::new_v4().hyphenated());
        diesel::insert_into(schema::tags::table)
            .values(vec![
                models::NewTag {
                    uuid: uuid::Uuid::new_v4().hyphenated().to_string(),
                    name: tag1_name,
                },
                models::NewTag {
                    uuid: uuid::Uuid::new_v4().hyphenated().to_string(),
                    name: tag2_name,
                },
            ])
            .execute(&mut conn)
            .expect("Failed to insert tags");

        // Add a brand new tag "third_tag_*"
        let third_tag = format!("third_tag_{}", uuid::Uuid::new_v4().hyphenated());
        let (rows, err) = add_tag_to_article(article_id, third_tag.clone());
        assert_eq!(rows, 1, "Should insert 1 article-tag link");
        assert_eq!(err, "", "Should have no error");

        // Verify get_article_tags returns exactly 1 tag with the correct name
        let tags = get_article_tags(article_id);
        assert_eq!(tags.len(), 1, "Should have exactly 1 tag");
        assert_eq!(tags[0].name, third_tag, "Tag name should match the new tag");
    }

    #[test]
    fn test_add_existing_tag_to_article() {
        let mut conn = db::establish_connection();
        let feed_uuid = insert_test_feed(&mut conn);
        let article_id = insert_test_article(&mut conn, &feed_uuid);

        // Create a pre-existing tag
        let existing_name = format!("existing_{}", uuid::Uuid::new_v4().hyphenated());
        let existing_uuid = uuid::Uuid::new_v4().hyphenated().to_string();
        diesel::insert_into(schema::tags::table)
            .values(models::NewTag {
                uuid: existing_uuid.clone(),
                name: existing_name.clone(),
            })
            .execute(&mut conn)
            .expect("Failed to insert tag");

        // Add the existing tag by name
        let (rows, err) = add_tag_to_article(article_id, existing_name.clone());
        assert_eq!(rows, 1, "Should insert 1 article-tag link");
        assert_eq!(err, "", "Should have no error");

        // Verify it links to the correct existing tag
        let tags = get_article_tags(article_id);
        assert_eq!(tags.len(), 1, "Should have exactly 1 tag");
        assert_eq!(tags[0].name, existing_name, "Tag name should match");
        assert_eq!(
            tags[0].uuid, existing_uuid,
            "Tag UUID should match the pre-existing tag"
        );
    }
}
