// @generated automatically by Diesel CLI.

diesel::table! {
    article_ai_analysis (id) {
        id -> Nullable<Integer>,
        article_id -> Integer,
        signal_title -> Nullable<Text>,
        summary -> Nullable<Text>,
        why_it_matters -> Nullable<Text>,
        relevance_score -> Nullable<Float>,
        topic_id -> Nullable<Integer>,
        embedding_id -> Nullable<Integer>,
        embedding_json -> Nullable<Text>,
        ai_processed_at -> Nullable<Timestamp>,
        model_version -> Nullable<Text>,
        create_date -> Timestamp,
        update_date -> Timestamp,
        is_duplicate -> Bool,
        duplicate_of -> Nullable<Integer>,
        information_density -> Nullable<Float>,
    }
}

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
        starred_at -> Text,
        is_archived -> Integer,
        is_read_later -> Integer,
        notes -> Text,
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
    pipeline_runs (id) {
        id -> Nullable<Integer>,
        run_type -> Text,
        status -> Text,
        articles_processed -> Integer,
        error_message -> Nullable<Text>,
        started_at -> Timestamp,
        finished_at -> Nullable<Timestamp>,
        create_date -> Timestamp,
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

diesel::joinable!(article_ai_analysis -> articles (article_id));
diesel::joinable!(feeds -> sources (source_id));

diesel::table! {
    topics (id) {
        id -> Integer,
        uuid -> Text,
        title -> Text,
        description -> Text,
        status -> Text,
        article_count -> Integer,
        source_count -> Integer,
        first_seen_at -> Timestamp,
        last_updated_at -> Timestamp,
    }
}

diesel::table! {
    topic_articles (id) {
        id -> Integer,
        topic_id -> Integer,
        article_id -> Integer,
        relevance_score -> Float,
    }
}

diesel::joinable!(topic_articles -> topics (topic_id));

diesel::table! {
    topic_follows (id) {
        id -> Nullable<Integer>,
        topic_id -> Integer,
        followed_at -> Timestamp,
        status -> Text,
    }
}

diesel::joinable!(topic_follows -> topics (topic_id));

diesel::table! {
    user_feedback (id) {
        id -> Nullable<Integer>,
        signal_id -> Integer,
        feedback_type -> Varchar,
        comment -> Nullable<Text>,
        create_date -> Timestamp,
    }
}

diesel::table! {
    collections (id) {
        id -> Integer,
        uuid -> Text,
        name -> Text,
        description -> Text,
        icon -> Text,
        sort_order -> Integer,
        create_date -> Timestamp,
        update_date -> Timestamp,
    }
}

diesel::table! {
    article_collections (id) {
        id -> Integer,
        article_id -> Integer,
        collection_id -> Integer,
        create_date -> Timestamp,
    }
}

diesel::table! {
    tags (id) {
        id -> Integer,
        uuid -> Text,
        name -> Text,
        create_date -> Timestamp,
    }
}

diesel::table! {
    article_tags (id) {
        id -> Integer,
        article_id -> Integer,
        tag_id -> Integer,
        create_date -> Timestamp,
    }
}

diesel::joinable!(article_collections -> articles (article_id));
diesel::joinable!(article_collections -> collections (collection_id));
diesel::joinable!(article_tags -> articles (article_id));
diesel::joinable!(article_tags -> tags (tag_id));

diesel::allow_tables_to_appear_in_same_query!(
  article_ai_analysis,
  article_collections,
  article_tags,
  articles,
  collections,
  feed_metas,
  feeds,
  folders,
  pipeline_runs,
  sources,
  tags,
  topic_follows,
  topics,
  topic_articles,
  user_feedback,
);
