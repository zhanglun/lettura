-- user_feedback was created without ON DELETE CASCADE in early installs;
-- the create migration file was later corrected, but Diesel never re-runs an
-- applied migration. Recreate the table so existing databases match the
-- intended schema: deleting an article cascades to article_ai_analysis and
-- then to its feedback rows, otherwise the retention purge violates the FK.
PRAGMA foreign_keys = OFF;

CREATE TABLE sqlitestudio_temp_table AS SELECT * FROM user_feedback;
DROP TABLE user_feedback;

CREATE TABLE user_feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    signal_id INTEGER NOT NULL,
    feedback_type VARCHAR(20) NOT NULL CHECK (feedback_type IN ('useful', 'not_relevant', 'follow_topic')),
    comment TEXT,
    create_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (signal_id) REFERENCES article_ai_analysis(id) ON DELETE CASCADE
);

INSERT INTO user_feedback (id, signal_id, feedback_type, comment, create_date)
SELECT id, signal_id, feedback_type, comment, create_date FROM sqlitestudio_temp_table;

DROP TABLE sqlitestudio_temp_table;

CREATE INDEX idx_user_feedback_signal_id ON user_feedback(signal_id);
CREATE INDEX idx_user_feedback_type ON user_feedback(feedback_type);
CREATE INDEX idx_user_feedback_created ON user_feedback(create_date);

PRAGMA foreign_keys = ON;
