table! {
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
        create_date -> Timestamp,
        update_date -> Timestamp,
        read_status -> Integer,
    }
}

table! {
    channels (id) {
        id -> Integer,
        uuid -> Text,
        title -> Text,
        link -> Text,
        feed_url -> Text,
        image -> Text,
        description -> Text,
        pub_date -> Timestamp,
        create_date -> Timestamp,
        update_date -> Timestamp,
    }
}

table! {
    feed_metas (id) {
        id -> Integer,
        uuid -> Text,
        channel_uuid -> Text,
        parent_uuid -> Text,
        sort -> Integer,
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
    channels,
    feed_metas,
    folder_channel_relations,
    folders,
);
