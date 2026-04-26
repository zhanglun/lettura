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

diesel::allow_tables_to_appear_in_same_query!(
    article_ai_analysis,
    articles,
    feed_metas,
    feeds,
    folders,
    pipeline_runs,
    sources,
);
