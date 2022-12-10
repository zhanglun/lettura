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
    channels (id) {
        id -> Integer,
        uuid -> Text,
        title -> Text,
        link -> Text,
        feed_url -> Text,
        image -> Text,
        description -> Text,
        pub_date -> Timestamp,
        sort -> Integer,
        create_date -> Timestamp,
        update_date -> Timestamp,
    }
}

diesel::table! {
    feed_metas (id) {
        id -> Integer,
        child_uuid -> Text,
        parent_uuid -> Text,
        sort -> Integer,
        create_date -> Timestamp,
        update_date -> Timestamp,
    }
}

diesel::table! {
    folder_channel_relations (id) {
        id -> Integer,
        folder_uuid -> Text,
        channel_uuid -> Text,
        create_date -> Timestamp,
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
    channels,
    feed_metas,
    folder_channel_relations,
    folders,
);
