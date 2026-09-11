-- ==============================================================================
-- LearnOS — Supabase / PostgreSQL Schema
-- ==============================================================================
-- HOW TO RUN
--   Supabase dashboard -> SQL Editor -> New query -> paste this whole file -> Run
--   (or: psql "$DATABASE_URL" -f database/schema.sql)
--
-- Safe to re-run. Every object uses IF NOT EXISTS / ON CONFLICT DO NOTHING,
-- so applying it twice will not error or duplicate seed data.
--
-- ------------------------------------------------------------------------------
-- TABLE MAP — what writes each table, and what reads it
-- ------------------------------------------------------------------------------
--   students              seed / manual                  -> identity
--   conversations         (not yet written by code)      -> chat threads
--   messages              (not yet written by code)      -> GET /api/conversations/{id}/messages
--   agent_routing_log     services/routing_log.py        -> GET /api/students/{id}/trace
--   student_mastery       services/student_service.py    -> GET /api/students/{id}/mastery
--                                                           + General agent reads it directly
--   mistakes              services/student_service.py    -> root-cause analysis
--   student_topic_edges   seed / manual                  -> prerequisite detection
--   assessments           services/student_service.py    -> escalation counting
--   recommendations       (seed / future)                -> GET /api/students/{id}/recommendations
--
--   Views: v_student_weak_topics, v_subject_summary, v_recent_routing
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()


-- ==============================================================================
-- 1. students
-- ------------------------------------------------------------------------------
-- id is TEXT, not UUID, on purpose: the demo uses readable ids ('rahul') and
-- guest logins, and it is not tied to Supabase's auth.users. If you later wire
-- Supabase Auth, store auth.uid()::text here — the type already fits.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS students (
    id          TEXT        PRIMARY KEY,
    name        TEXT,
    goal        TEXT,                                   -- e.g. 'Data Scientist'
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  students    IS 'One row per learner. TEXT id supports guest/demo ids.';
COMMENT ON COLUMN students.goal IS 'Career target, used by the General agent when building roadmaps.';


-- ==============================================================================
-- 2. conversations
-- ------------------------------------------------------------------------------
-- NOTE: POST /api/chat currently generates a conversation_id but does NOT
-- insert a row here. Until that is wired, this table stays empty and
-- /api/conversations/{id}/messages returns []. See the note at the bottom.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS conversations (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id  TEXT        NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    title       TEXT,                                   -- first message, truncated
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversations_student
    ON conversations (student_id, created_at DESC);


-- ==============================================================================
-- 3. messages
-- ------------------------------------------------------------------------------
-- conversation_id is UUID because student_service.py queries it with
--     WHERE conversation_id = CAST(:cid AS uuid)
--
-- Deliberately NO foreign key to conversations: the chat endpoint does not
-- create the parent row yet, and a hard FK would make message inserts fail.
-- Add the FK once conversation creation is wired.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS messages (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id  UUID,
    student_id       TEXT        NOT NULL,
    role             TEXT        NOT NULL CHECK (role IN ('student', 'agent')),
    agent            TEXT        CHECK (agent IS NULL OR agent IN
                                     ('dsa', 'dbms', 'maths', 'aiml', 'general')),
    content          TEXT        NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation
    ON messages (conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_student
    ON messages (student_id, created_at DESC);

COMMENT ON COLUMN messages.agent IS 'Which agent produced this message; NULL when role = student.';


-- ==============================================================================
-- 4. agent_routing_log          <- powers the Agent Trace panel
-- ------------------------------------------------------------------------------
-- Written by services/routing_log.py on EVERY coordinator decision.
-- Read by GET /api/students/{id}/trace.
--
-- conversation_id is TEXT (not UUID) because routing_log.py binds a Python
-- str directly; a UUID column would require an explicit cast in that INSERT.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS agent_routing_log (
    id                 UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id         TEXT             NOT NULL,
    conversation_id    TEXT,
    message            TEXT,                            -- the student's raw question
    agent              TEXT             NOT NULL CHECK (agent IN
                                            ('dsa', 'dbms', 'maths', 'aiml', 'general')),
    confidence         DOUBLE PRECISION CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
    used_llm_fallback  BOOLEAN          NOT NULL DEFAULT FALSE,
    routed_reason      TEXT,                            -- human-readable "why this agent"
    created_at         TIMESTAMPTZ      NOT NULL DEFAULT now()
);

-- DESC index: the trace panel always wants the most recent decisions first
CREATE INDEX IF NOT EXISTS idx_routing_student
    ON agent_routing_log (student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_routing_agent
    ON agent_routing_log (agent);

COMMENT ON COLUMN agent_routing_log.used_llm_fallback
    IS 'TRUE when the trained router was below threshold and the LLM classified instead.';
COMMENT ON COLUMN agent_routing_log.confidence
    IS 'Tier-1 classifier confidence. Shown live in the Agent Trace panel.';


-- ==============================================================================
-- 5. student_mastery            <- powers the Student Brain dashboard
-- ------------------------------------------------------------------------------
-- The composite PRIMARY KEY (student_id, subject, topic) is REQUIRED:
-- student_service.py upserts with ON CONFLICT (student_id, subject, topic).
-- Changing this key breaks the assessment loop.
--
-- Read directly by the General agent (services/mastery_service.py) so it can
-- build a roadmap without forwarding the question to a specialist mid-turn.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS student_mastery (
    student_id  TEXT             NOT NULL,
    subject     TEXT             NOT NULL CHECK (subject IN ('dsa', 'dbms', 'maths', 'aiml')),
    topic       TEXT             NOT NULL,               -- snake_case, e.g. 'conditional_probability'
    score       DOUBLE PRECISION NOT NULL DEFAULT 0.0 CHECK (score BETWEEN 0 AND 1),
    state       TEXT             NOT NULL DEFAULT 'new'
                                 CHECK (state IN ('new', 'learning', 'weak', 'mastered')),
    attempts    INTEGER          NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    source      TEXT             NOT NULL DEFAULT 'bkt' CHECK (source IN ('bkt', 'dkt')),
    updated_at  TIMESTAMPTZ      NOT NULL DEFAULT now(),

    PRIMARY KEY (student_id, subject, topic)
);

-- Ascending score: "find this student's weakest topics" is the hot query
CREATE INDEX IF NOT EXISTS idx_mastery_weak
    ON student_mastery (student_id, score ASC);
CREATE INDEX IF NOT EXISTS idx_mastery_state
    ON student_mastery (student_id, state);

COMMENT ON COLUMN student_mastery.score  IS 'P(mastery) in [0,1]. Updated by BKT, or DKT once enough history exists.';
COMMENT ON COLUMN student_mastery.state  IS 'Qualitative band derived from score+attempts. Easier to read than a percentage.';
COMMENT ON COLUMN student_mastery.source IS 'Which Progress Engine tier produced this score.';


-- ==============================================================================
-- 6. mistakes                   <- typed misconception taxonomy
-- ------------------------------------------------------------------------------
-- The CHECK list must stay in sync with MISCONCEPTION_TYPES in
-- backend/app/agents/base.py. Typed (not free text) so root-cause detection
-- is a GROUP BY instead of string matching.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS mistakes (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id          TEXT        NOT NULL,
    subject             TEXT,
    topic               TEXT,
    misconception_type  TEXT        NOT NULL CHECK (misconception_type IN (
                                        'sign_error',
                                        'unit_confusion',
                                        'definition_confusion',
                                        'off_by_one',
                                        'base_case_missing',
                                        'formula_misapplication',
                                        'logic_error',
                                        'other')),
    description         TEXT,                            -- the student's actual wrong answer
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mistakes_student  ON mistakes (student_id, topic);
CREATE INDEX IF NOT EXISTS idx_mistakes_type     ON mistakes (misconception_type);


-- ==============================================================================
-- 7. student_topic_edges        <- the "knowledge graph", as adjacency rows
-- ------------------------------------------------------------------------------
-- Deliberate scope call: adjacency tables in Postgres give the same query
-- capability (prerequisites, weaknesses) as a graph DB, with zero new infra.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS student_topic_edges (
    id                 UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id         TEXT             NOT NULL,
    topic_id           TEXT             NOT NULL,        -- the source topic
    related_topic_id   TEXT             NOT NULL,        -- the target topic
    relationship_type  TEXT             NOT NULL CHECK (relationship_type IN (
                                            'prerequisite_for',   -- topic_id must precede related_topic_id
                                            'related_to',
                                            'harder_than')),
    weight             DOUBLE PRECISION NOT NULL DEFAULT 1.0 CHECK (weight BETWEEN 0 AND 1),
    created_at         TIMESTAMPTZ      NOT NULL DEFAULT now(),

    UNIQUE (student_id, topic_id, related_topic_id, relationship_type)
);

CREATE INDEX IF NOT EXISTS idx_edges_student  ON student_topic_edges (student_id, topic_id);
CREATE INDEX IF NOT EXISTS idx_edges_reverse  ON student_topic_edges (student_id, related_topic_id);

COMMENT ON COLUMN student_topic_edges.weight IS 'Edge strength 0-1. How strongly the prerequisite gates the dependent topic.';


-- ==============================================================================
-- 8. assessments                <- TEACH -> TEST -> DIAGNOSE -> ADAPT
-- ------------------------------------------------------------------------------
-- Written by POST /api/assessments. Also counted for human escalation:
--   3+ wrong answers on one topic AND mastery still < 0.40 -> recommend a teacher.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS assessments (
    id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id         TEXT        NOT NULL,
    conversation_id    TEXT,
    subject            TEXT,
    topic              TEXT,
    question           TEXT        NOT NULL,
    expected_answer    TEXT,
    student_answer     TEXT,
    is_correct         BOOLEAN,
    confidence_rating  INTEGER     CHECK (confidence_rating IS NULL
                                          OR confidence_rating BETWEEN 1 AND 5),
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assessments_student
    ON assessments (student_id, created_at DESC);
-- Partial index: the escalation query only ever counts WRONG answers
CREATE INDEX IF NOT EXISTS idx_assessments_failures
    ON assessments (student_id, topic) WHERE is_correct = FALSE;

COMMENT ON COLUMN assessments.confidence_rating
    IS 'Student self-rated confidence 1-5. High confidence + wrong answer = a real misconception, not a slip.';


-- ==============================================================================
-- 9. recommendations            <- next-best-action
-- ==============================================================================
CREATE TABLE IF NOT EXISTS recommendations (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id  TEXT        NOT NULL,
    topic       TEXT        NOT NULL,
    reason      TEXT,
    priority    TEXT        NOT NULL DEFAULT 'medium'
                            CHECK (priority IN ('low', 'medium', 'high')),
    done        BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Needed so the seed below is genuinely idempotent (ON CONFLICT DO NOTHING
    -- only suppresses a conflict if a constraint exists to conflict against).
    UNIQUE (student_id, topic)
);

CREATE INDEX IF NOT EXISTS idx_recommendations_student
    ON recommendations (student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recommendations_open
    ON recommendations (student_id, priority) WHERE done = FALSE;


-- ==============================================================================
-- VIEWS — convenience for the dashboard and the General agent's roadmap
-- ==============================================================================

-- Weak topics, plus what each one is a prerequisite for.
-- This is the cross-subject root-cause query in a single view.
CREATE OR REPLACE VIEW v_student_weak_topics AS
SELECT
    m.student_id,
    m.subject,
    m.topic,
    m.score,
    m.state,
    m.attempts,
    COALESCE(
        ARRAY_AGG(e.related_topic_id) FILTER (WHERE e.related_topic_id IS NOT NULL),
        '{}'::text[]
    ) AS blocks_topics
FROM student_mastery m
LEFT JOIN student_topic_edges e
       ON e.student_id = m.student_id
      AND e.topic_id   = m.topic
      AND e.relationship_type = 'prerequisite_for'
WHERE m.state IN ('weak', 'learning')
GROUP BY m.student_id, m.subject, m.topic, m.score, m.state, m.attempts
ORDER BY m.score ASC;

-- Per-subject rollup for the Student Brain dashboard
CREATE OR REPLACE VIEW v_subject_summary AS
SELECT
    student_id,
    subject,
    ROUND(AVG(score)::numeric, 4) AS average_score,
    COUNT(*)                      AS topic_count,
    COUNT(*) FILTER (WHERE state = 'weak')     AS weak_count,
    COUNT(*) FILTER (WHERE state = 'mastered') AS mastered_count
FROM student_mastery
GROUP BY student_id, subject;

-- Recent routing decisions, newest first
CREATE OR REPLACE VIEW v_recent_routing AS
SELECT
    student_id, agent, confidence, used_llm_fallback,
    routed_reason, message, created_at
FROM agent_routing_log
ORDER BY created_at DESC;


-- ==============================================================================
-- SEED — the "Rahul" demo persona
-- ------------------------------------------------------------------------------
-- Scores are chosen so the demo story works out of the box:
--   - conditional_probability is the weakest maths topic (root cause)
--   - naive_bayes is weak *because* of it (prerequisite edge below)
--   - arrays is mastered, so the dashboard isn't uniformly red
-- ==============================================================================
INSERT INTO students (id, name, goal) VALUES
    ('rahul', 'Rahul', 'Data Scientist')
ON CONFLICT (id) DO NOTHING;

INSERT INTO student_mastery (student_id, subject, topic, score, state, attempts) VALUES
    ('rahul', 'maths', 'probability',             0.42, 'weak',     4),
    ('rahul', 'maths', 'conditional_probability', 0.38, 'weak',     3),
    ('rahul', 'maths', 'linear_algebra',          0.61, 'learning', 2),
    ('rahul', 'dsa',   'recursion',               0.55, 'learning', 5),
    ('rahul', 'dsa',   'arrays',                  0.81, 'mastered', 7),
    ('rahul', 'dsa',   'dynamic_programming',     0.29, 'weak',     2),
    ('rahul', 'dbms',  'sql_joins',               0.64, 'learning', 3),
    ('rahul', 'dbms',  'normalization',           0.47, 'weak',     2),
    ('rahul', 'aiml',  'naive_bayes',             0.35, 'weak',     2),
    ('rahul', 'aiml',  'gradient_descent',        0.58, 'learning', 3)
ON CONFLICT (student_id, subject, topic) DO NOTHING;

-- Prerequisite chains. These are what make cross-subject root-cause work:
-- weak naive_bayes traces back through conditional_probability to probability.
INSERT INTO student_topic_edges
    (student_id, topic_id, related_topic_id, relationship_type, weight) VALUES
    ('rahul', 'probability',             'conditional_probability', 'prerequisite_for', 0.90),
    ('rahul', 'conditional_probability', 'naive_bayes',             'prerequisite_for', 0.95),
    ('rahul', 'linear_algebra',          'gradient_descent',        'prerequisite_for', 0.80),
    ('rahul', 'recursion',               'trees',                   'prerequisite_for', 0.85),
    ('rahul', 'recursion',               'dynamic_programming',     'prerequisite_for', 0.88),
    ('rahul', 'sql_joins',               'normalization',           'related_to',       0.60)
ON CONFLICT (student_id, topic_id, related_topic_id, relationship_type) DO NOTHING;

INSERT INTO recommendations (student_id, topic, reason, priority) VALUES
    ('rahul', 'conditional_probability',
     'Root cause of your weak Naive Bayes score — fix this first.', 'high'),
    ('rahul', 'dynamic_programming',
     'Lowest DSA score and heavily asked in placement interviews.', 'high'),
    ('rahul', 'normalization',
     'Commonly asked in DBMS interview rounds.', 'medium')
ON CONFLICT (student_id, topic) DO NOTHING;


-- ==============================================================================
-- SUPABASE NOTES
-- ------------------------------------------------------------------------------
-- ROW LEVEL SECURITY
--   The backend connects via DATABASE_URL as the postgres role, which BYPASSES
--   RLS entirely — so you do not need policies for the app to work, and
--   Supabase's "RLS disabled" warnings in the dashboard are expected here.
--
--   Only enable RLS if you later query from the browser with the anon key.
--   Starter policies for that case (leave commented for the hackathon):
--
--   ALTER TABLE student_mastery ENABLE ROW LEVEL SECURITY;
--   CREATE POLICY "own rows" ON student_mastery
--       FOR SELECT USING (student_id = auth.uid()::text);
--
-- CONNECTION STRING
--   Use the SESSION POOLER string (port 6543) for deployed backends —
--   Render/Railway can exhaust direct connections (port 5432) under reload.
--   Settings -> Database -> Connection string -> "Session pooler".
--
-- ==============================================================================
-- VERIFY — run these after applying to confirm everything landed
-- ==============================================================================
-- SELECT table_name FROM information_schema.tables
--   WHERE table_schema = 'public' ORDER BY table_name;           -- expect 9 tables
-- SELECT * FROM v_subject_summary WHERE student_id = 'rahul';    -- expect 4 rows
-- SELECT topic, score, blocks_topics FROM v_student_weak_topics
--   WHERE student_id = 'rahul';                                  -- weakest first
-- ==============================================================================
