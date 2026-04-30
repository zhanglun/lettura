CREATE TABLE user_feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    signal_id INTEGER NOT NULL,
    feedback_type VARCHAR(20) NOT NULL CHECK (feedback_type IN ('useful', 'not_relevant', 'follow_topic')),
    comment TEXT,
    create_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (signal_id) REFERENCES article_ai_analysis(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_feedback_signal_id ON user_feedback(signal_id);
CREATE INDEX idx_user_feedback_type ON user_feedback(feedback_type);
CREATE INDEX idx_user_feedback_created ON user_feedback(create_date);
