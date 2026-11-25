-- ========================================================
-- OTET Enterprise Examination System - PostgreSQL Schema
-- ========================================================

CREATE TABLE IF NOT EXISTS test_papers (
    id BIGSERIAL PRIMARY KEY,
    paper_code VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_class VARCHAR(100),
    duration_minutes INT DEFAULT 150,
    total_questions INT DEFAULT 150
);

CREATE TABLE IF NOT EXISTS questions (
    id BIGSERIAL PRIMARY KEY,
    test_paper_id BIGINT NOT NULL REFERENCES test_papers(id) ON DELETE CASCADE,
    question_number INT NOT NULL,
    subject VARCHAR(50) NOT NULL,
    question_en TEXT NOT NULL,
    question_or TEXT,
    correct_option_index INT NOT NULL, -- Stored securely on server
    explanation TEXT
);

CREATE INDEX IF NOT EXISTS idx_questions_paper_id ON questions(test_paper_id);
CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject);

CREATE TABLE IF NOT EXISTS question_options (
    id BIGSERIAL PRIMARY KEY,
    question_id BIGINT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    option_index INT NOT NULL,
    text_en TEXT NOT NULL,
    text_or TEXT
);

CREATE INDEX IF NOT EXISTS idx_options_question_id ON question_options(question_id);

CREATE TABLE IF NOT EXISTS test_attempts (
    id BIGSERIAL PRIMARY KEY,
    test_paper_id BIGINT NOT NULL REFERENCES test_papers(id),
    candidate_name VARCHAR(150),
    candidate_email VARCHAR(150),
    status VARCHAR(30) DEFAULT 'IN_PROGRESS',
    start_time TIMESTAMP NOT NULL,
    submit_time TIMESTAMP,
    last_active_time TIMESTAMP,
    remaining_seconds INT DEFAULT 9000,
    current_question_index INT DEFAULT 0,
    score INT DEFAULT 0,
    correct_count INT DEFAULT 0,
    wrong_count INT DEFAULT 0,
    skipped_count INT DEFAULT 0,
    percentage NUMERIC(5,2) DEFAULT 0.0,
    passed BOOLEAN DEFAULT FALSE,
    weak_areas_summary TEXT
);

CREATE INDEX IF NOT EXISTS idx_attempts_candidate_email ON test_attempts(candidate_email);
CREATE INDEX IF NOT EXISTS idx_attempts_status ON test_attempts(status);

CREATE TABLE IF NOT EXISTS user_answers (
    id BIGSERIAL PRIMARY KEY,
    test_attempt_id BIGINT NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
    question_id BIGINT NOT NULL REFERENCES questions(id),
    selected_option_index INT,
    is_correct BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_user_answers_attempt ON user_answers(test_attempt_id);
