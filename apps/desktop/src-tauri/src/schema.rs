// @generated automatically by Diesel CLI.

diesel::table! {
    articles (id) {
        id -> Integer,
        uuid -> Text,
        title -> Text,
        link -> Text,
        feed_url -> Text,
        feed_uuid -> Text,
        description -> Text,
        author -> Text,
        pub_date -> Timestamp,
        content -> Text,
        create_date -> Timestamp,
        update_date -> Timestamp,
        read_status -> Integer,
        media_object -> Nullable<Text>,
        starred -> Integer,
    }
}

diesel::table! {
    feed_metas (id) {
        id -> Integer,
        uuid -> Text,
        folder_uuid -> Text,
        sort -> Integer,
        create_date -> Timestamp,
        update_date -> Timestamp,
    }
}

diesel::table! {
    feeds (id) {
        id -> Integer,
        uuid -> Text,
        title -> Text,
        link -> Text,
        feed_url -> Text,
        feed_type -> Text,
        description -> Text,
        pub_date -> Timestamp,
        updated -> Timestamp,
        logo -> Text,
        health_status -> Integer,
        failure_reason -> Text,
        sort -> Integer,
        sync_interval -> Integer,
        last_sync_date -> Timestamp,
        create_date -> Timestamp,
        update_date -> Timestamp,
        source_id -> Nullable<Integer>,
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

diesel::table! {
    sources (id) {
        id -> Nullable<Integer>,
        uuid -> Text,
        feed_url -> Text,
        title -> Nullable<Text>,
        site_url -> Nullable<Text>,
        source_type -> Text,
        pack_id -> Nullable<Text>,
        language -> Text,
        quality_score -> Float,
        weight -> Float,
        is_active -> Bool,
        create_date -> Timestamp,
        update_date -> Timestamp,
    }
}

diesel::joinable!(feeds -> sources (source_id));

diesel::allow_tables_to_appear_in_same_query!(
    articles,
    feed_metas,
    feeds,
    folders,
    sources,
);
