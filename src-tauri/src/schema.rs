// @generated automatically by Diesel CLI.

diesel::table! {
    articles (id) {
        id -> Integer,
        uuid -> Text,
        title -> Text,
        link -> Text,
        feed_url -> Text,
        image -> Text,
        description -> Text,
        content -> Text,
        pub_date -> Timestamp,
    }
}

diesel::table! {
    feed_article_relation (id) {
        id -> Integer,
        feed_uuid -> Text,
        article_uuid -> Text,
    }
}

diesel::table! {
    feeds (id) {
        id -> Integer,
        uuid -> Text,
        title -> Text,
        link -> Text,
        feed_url -> Text,
        image -> Text,
        description -> Text,
        pub_date -> Timestamp,
    }
}

diesel::allow_tables_to_appear_in_same_query!(
    articles,
    feed_article_relation,
    feeds,
);
