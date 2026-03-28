-- ─── Quran Lens — Initial Schema Migration ────────────────────────────────────
-- Generated for: quranic-corpus-morphology-0.4 (128,219 segments, 77,430 words)
-- Spec §12.3

-- ─── Enums ───────────────────────────────────────────────────────────────────

CREATE TYPE "RevelationPlace" AS ENUM ('makkah', 'madinah');
CREATE TYPE "SegmentType"     AS ENUM ('PREFIX', 'STEM', 'SUFFIX');
CREATE TYPE "NodeType"        AS ENUM ('terminal', 'non_terminal', 'hidden');

-- ─── Core Layer ───────────────────────────────────────────────────────────────

CREATE TABLE "surahs" (
    "id"               INTEGER           NOT NULL,
    "nameArabic"       TEXT              NOT NULL,
    "nameSimple"       TEXT              NOT NULL,
    "nameComplex"      TEXT              NOT NULL,
    "revelationPlace"  "RevelationPlace" NOT NULL,
    "revelationOrder"  INTEGER           NOT NULL,
    "versesCount"      INTEGER           NOT NULL,
    "bismillahPre"     BOOLEAN           NOT NULL DEFAULT true,
    "translatedName"   TEXT              NOT NULL,

    CONSTRAINT "surahs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "verses" (
    "id"           TEXT    NOT NULL,   -- "{surah}:{verse}"
    "surahId"      INTEGER NOT NULL,
    "verseNumber"  INTEGER NOT NULL,
    "textUthmani"  TEXT    NOT NULL DEFAULT '',
    "textSimple"   TEXT    NOT NULL DEFAULT '',
    "pageNumber"   INTEGER,
    "juzNumber"    INTEGER,
    "hizbNumber"   INTEGER,

    CONSTRAINT "verses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "words" (
    "id"              TEXT    NOT NULL,   -- "{surah}:{verse}:{word}"
    "verseId"         TEXT    NOT NULL,
    "surahId"         INTEGER NOT NULL,
    "verseNumber"     INTEGER NOT NULL,
    "position"        INTEGER NOT NULL,
    "textUthmani"     TEXT    NOT NULL DEFAULT '',
    "transliteration" TEXT    NOT NULL DEFAULT '',
    "translation"     TEXT    NOT NULL DEFAULT '',
    "audioUrl"        TEXT    NOT NULL DEFAULT '',
    "charTypeName"    TEXT    NOT NULL DEFAULT 'word',

    CONSTRAINT "words_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "segments" (
    "id"               SERIAL          NOT NULL,
    "wordId"           TEXT            NOT NULL,
    "surahId"          INTEGER         NOT NULL,
    "verseNumber"      INTEGER         NOT NULL,
    "wordPosition"     INTEGER         NOT NULL,
    "segmentPosition"  INTEGER         NOT NULL,
    "formBuckwalter"   TEXT            NOT NULL,
    "formArabic"       TEXT            NOT NULL DEFAULT '',
    "posTag"           TEXT            NOT NULL,
    "segmentType"      "SegmentType"   NOT NULL,
    "features"         JSONB           NOT NULL,
    "rootBuckwalter"   TEXT,
    "lemmaBuckwalter"  TEXT,
    "gramCase"         TEXT,
    "gramState"        TEXT,
    "verbAspect"       TEXT,
    "verbMood"         TEXT,
    "verbVoice"        TEXT,
    "verbForm"         TEXT,
    "person"           TEXT,
    "gender"           TEXT,
    "number"           TEXT,

    CONSTRAINT "segments_pkey" PRIMARY KEY ("id")
);

-- ─── Linguistic Layer ─────────────────────────────────────────────────────────

CREATE TABLE "roots" (
    "id"                SERIAL  NOT NULL,
    "lettersBuckwalter" TEXT    NOT NULL,
    "lettersArabic"     TEXT    NOT NULL,
    "frequency"         INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "roots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lemmas" (
    "id"               SERIAL  NOT NULL,
    "rootId"           INTEGER,
    "formBuckwalter"   TEXT    NOT NULL,
    "formArabic"       TEXT    NOT NULL,
    "posTag"           TEXT    NOT NULL,
    "frequency"        INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "lemmas_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "word_roots" (
    "wordId"  TEXT    NOT NULL,
    "rootId"  INTEGER NOT NULL,

    CONSTRAINT "word_roots_pkey" PRIMARY KEY ("wordId", "rootId")
);

CREATE TABLE "word_lemmas" (
    "wordId"   TEXT    NOT NULL,
    "lemmaId"  INTEGER NOT NULL,

    CONSTRAINT "word_lemmas_pkey" PRIMARY KEY ("wordId", "lemmaId")
);

-- ─── Treebank Layer ───────────────────────────────────────────────────────────

CREATE TABLE "treebank_nodes" (
    "id"         TEXT       NOT NULL,
    "verseId"    TEXT       NOT NULL,
    "wordId"     TEXT,
    "nodeType"   "NodeType" NOT NULL,
    "phraseTag"  TEXT,
    "label"      TEXT       NOT NULL,

    CONSTRAINT "treebank_nodes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "treebank_edges" (
    "id"              SERIAL NOT NULL,
    "headNodeId"      TEXT   NOT NULL,
    "dependentNodeId" TEXT   NOT NULL,
    "relation"        TEXT   NOT NULL,

    CONSTRAINT "treebank_edges_pkey" PRIMARY KEY ("id")
);

-- ─── Ontology Layer ───────────────────────────────────────────────────────────

CREATE TABLE "concepts" (
    "id"       TEXT NOT NULL,
    "name"     TEXT NOT NULL,
    "parentId" TEXT,
    "category" TEXT NOT NULL,

    CONSTRAINT "concepts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "concept_relations" (
    "id"        SERIAL NOT NULL,
    "subjectId" TEXT   NOT NULL,
    "predicate" TEXT   NOT NULL,
    "objectId"  TEXT   NOT NULL,

    CONSTRAINT "concept_relations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "concept_verses" (
    "id"        SERIAL NOT NULL,
    "conceptId" TEXT   NOT NULL,
    "verseId"   TEXT   NOT NULL,
    "wordId"    TEXT,

    CONSTRAINT "concept_verses_pkey" PRIMARY KEY ("id")
);

-- ─── Unique Constraints ───────────────────────────────────────────────────────

ALTER TABLE "verses"   ADD CONSTRAINT "verses_surahId_verseNumber_key"                    UNIQUE ("surahId", "verseNumber");
ALTER TABLE "words"    ADD CONSTRAINT "words_surahId_verseNumber_position_key"             UNIQUE ("surahId", "verseNumber", "position");
ALTER TABLE "segments" ADD CONSTRAINT "segments_surahId_verseNumber_wordPosition_segmentPosition_key" UNIQUE ("surahId", "verseNumber", "wordPosition", "segmentPosition");
ALTER TABLE "roots"    ADD CONSTRAINT "roots_lettersBuckwalter_key"                        UNIQUE ("lettersBuckwalter");
ALTER TABLE "lemmas"   ADD CONSTRAINT "lemmas_formBuckwalter_key"                          UNIQUE ("formBuckwalter");
ALTER TABLE "concepts" ADD CONSTRAINT "concepts_name_key"                                  UNIQUE ("name");

-- ─── Indexes ──────────────────────────────────────────────────────────────────

-- Core
CREATE INDEX "verses_surahId_idx"            ON "verses"   ("surahId");
CREATE INDEX "verses_juzNumber_idx"          ON "verses"   ("juzNumber");
CREATE INDEX "words_verseId_idx"             ON "words"    ("verseId");
CREATE INDEX "words_surahId_idx"             ON "words"    ("surahId");

-- Segments — hot-path query columns
CREATE INDEX "segments_wordId_idx"           ON "segments" ("wordId");
CREATE INDEX "segments_posTag_idx"           ON "segments" ("posTag");
CREATE INDEX "segments_rootBuckwalter_idx"   ON "segments" ("rootBuckwalter");
CREATE INDEX "segments_lemmaBuckwalter_idx"  ON "segments" ("lemmaBuckwalter");
CREATE INDEX "segments_segmentType_idx"      ON "segments" ("segmentType");
-- JSONB index for complex feature queries
CREATE INDEX "segments_features_gin_idx"     ON "segments" USING gin ("features");

-- Linguistic
CREATE INDEX "roots_lettersBuckwalter_idx"   ON "roots"    ("lettersBuckwalter");
CREATE INDEX "lemmas_rootId_idx"             ON "lemmas"   ("rootId");
CREATE INDEX "lemmas_formBuckwalter_idx"     ON "lemmas"   ("formBuckwalter");
CREATE INDEX "word_roots_rootId_idx"         ON "word_roots" ("rootId");
CREATE INDEX "word_lemmas_lemmaId_idx"       ON "word_lemmas" ("lemmaId");

-- Treebank
CREATE INDEX "treebank_nodes_verseId_idx"    ON "treebank_nodes" ("verseId");
CREATE INDEX "treebank_edges_headNodeId_idx" ON "treebank_edges" ("headNodeId");
CREATE INDEX "treebank_edges_depNodeId_idx"  ON "treebank_edges" ("dependentNodeId");

-- Ontology
CREATE INDEX "concept_verses_conceptId_idx" ON "concept_verses" ("conceptId");
CREATE INDEX "concept_verses_verseId_idx"   ON "concept_verses" ("verseId");
CREATE INDEX "concept_relations_subjId_idx" ON "concept_relations" ("subjectId");

-- ─── Foreign Keys ─────────────────────────────────────────────────────────────

ALTER TABLE "verses"
    ADD CONSTRAINT "verses_surahId_fkey"
    FOREIGN KEY ("surahId") REFERENCES "surahs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "words"
    ADD CONSTRAINT "words_verseId_fkey"
    FOREIGN KEY ("verseId") REFERENCES "verses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "segments"
    ADD CONSTRAINT "segments_wordId_fkey"
    FOREIGN KEY ("wordId") REFERENCES "words"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "lemmas"
    ADD CONSTRAINT "lemmas_rootId_fkey"
    FOREIGN KEY ("rootId") REFERENCES "roots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "word_roots"
    ADD CONSTRAINT "word_roots_wordId_fkey"
    FOREIGN KEY ("wordId") REFERENCES "words"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "word_roots"
    ADD CONSTRAINT "word_roots_rootId_fkey"
    FOREIGN KEY ("rootId") REFERENCES "roots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "word_lemmas"
    ADD CONSTRAINT "word_lemmas_wordId_fkey"
    FOREIGN KEY ("wordId") REFERENCES "words"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "word_lemmas"
    ADD CONSTRAINT "word_lemmas_lemmaId_fkey"
    FOREIGN KEY ("lemmaId") REFERENCES "lemmas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "treebank_nodes"
    ADD CONSTRAINT "treebank_nodes_verseId_fkey"
    FOREIGN KEY ("verseId") REFERENCES "verses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "treebank_nodes"
    ADD CONSTRAINT "treebank_nodes_wordId_fkey"
    FOREIGN KEY ("wordId") REFERENCES "words"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "treebank_edges"
    ADD CONSTRAINT "treebank_edges_headNodeId_fkey"
    FOREIGN KEY ("headNodeId") REFERENCES "treebank_nodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "treebank_edges"
    ADD CONSTRAINT "treebank_edges_dependentNodeId_fkey"
    FOREIGN KEY ("dependentNodeId") REFERENCES "treebank_nodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "concepts"
    ADD CONSTRAINT "concepts_parentId_fkey"
    FOREIGN KEY ("parentId") REFERENCES "concepts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "concept_relations"
    ADD CONSTRAINT "concept_relations_subjectId_fkey"
    FOREIGN KEY ("subjectId") REFERENCES "concepts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "concept_relations"
    ADD CONSTRAINT "concept_relations_objectId_fkey"
    FOREIGN KEY ("objectId") REFERENCES "concepts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "concept_verses"
    ADD CONSTRAINT "concept_verses_conceptId_fkey"
    FOREIGN KEY ("conceptId") REFERENCES "concepts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
