// @generated automatically by Diesel CLI.

diesel::table! {
    articles (id) {
        id -> Integer,
        uuid -> Text,
        channel_uuid -> Text,
        title -> Text,
        link -> Text,
        feed_url -> Text,
        description -> Text,
        content -> Text,
        pub_date -> Timestamp,
        author -> Text,
        create_date -> Timestamp,
        update_date -> Timestamp,
        read_status -> Integer,
    }
}

diesel::table! {
    feed_metas (id) {
        id -> Integer,
        child_uuid -> Text,
        parent_uuid -> Text,
        sort -> Integer,
        health_status -> Integer,
        failure_reason -> Text,
        create_date -> Timestamp,
        update_date -> Timestamp,
    }
}

diesel::table! {
    feeds (id) {
        id -> Integer,
        uuid -> Text,
        feed_type -> Text,
        title -> Text,
        link -> Text,
        feed_url -> Text,
        logo -> Text,
        description -> Text,
        pub_date -> Timestamp,
        sync_interval -> Integer,
        last_sync_date -> Timestamp,
        sort -> Integer,
        updated -> Timestamp,
        create_date -> Timestamp,
        update_date -> Timestamp,
    }
}

diesel::table! {
    folders (id) {
        id -> Integer,
        uuid -> Text,
        name -> Text,
        sort -> Integer,
        create_date -> Timestamp,
        update_date -> Timestamp,
    }
}

diesel::allow_tables_to_appear_in_same_query!(
    articles,
    feed_metas,
    feeds,
    folders,
);
