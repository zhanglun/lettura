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
    }
}

diesel::allow_tables_to_appear_in_same_query!(
    articles,
    channels,
);
