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
    }
}

table! {
    feed_article_relation (id) {
        id -> Integer,
        feed_uuid -> Text,
        article_uuid -> Text,
    }
}

table! {
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

allow_tables_to_appear_in_same_query!(
    articles,
    channels,
    feed_article_relation,
    feeds,
);
