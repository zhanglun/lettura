table! {
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

table! {
    feed_metas (id) {
        id -> Integer,
        uuid -> Text,
        folder_uuid -> Nullable<Text>,
        sort -> Integer,
        create_date -> Timestamp,
        update_date -> Timestamp,
    }
}

table! {
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
    }
}

table! {
    folder_channel_relations (id) {
        id -> Integer,
        folder_uuid -> Text,
        channel_uuid -> Text,
        create_date -> Timestamp,
    }
}

table! {
    folders (id) {
        id -> Integer,
        uuid -> Text,
        name -> Text,
        sort -> Integer,
        create_date -> Timestamp,
        update_date -> Timestamp,
    }
}

allow_tables_to_appear_in_same_query!(
    articles,
    feed_metas,
    feeds,
    folder_channel_relations,
    folders,
);
