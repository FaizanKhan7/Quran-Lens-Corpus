/**
 * Seed Script — Full corpus pipeline
 * ─────────────────────────────────────────────────────────────────────────────
 * Parses quranic-corpus-morphology-0.4.txt and inserts all data into PostgreSQL.
 *
 * Pipeline:
 *   1. Truncate tables (idempotent re-runs)
 *   2. Seed 114 surahs from static JSON
 *   3. Parse corpus TSV → structured segments
 *   4. Derive + insert verses (from unique surah:verse pairs)
 *   5. Derive + insert words (from unique surah:verse:word triples)
 *   6. Insert all 128,219 segments with full features
 *   7. Extract + insert roots with frequency counts
 *   8. Extract + insert lemmas with frequency counts
 *   9. Insert word_roots and word_lemmas junction rows
 *
 * Usage:  npm run db:seed
 * Flags:  --skip-download   don't auto-download corpus
 *         --dry-run         parse only, no DB writes
 */

import { PrismaClient, RevelationPlace, SegmentType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as fs from "fs";
import * as path from "path";
import { parseCorpusFile, type ParseResult, type CorpusSegment } from "./parse-corpus.js";
import type { ParsedFeatures } from "./parse-corpus.js";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL not set");
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter, log: ["warn", "error"] });

const CORPUS_FILE = path.join(process.cwd(), "data", "corpus", "morphology.txt");
const XML_FILE    = path.join(process.cwd(), "data", "corpus", "quran-uthmani.xml");
const WBW_FILE    = path.join(process.cwd(), "data", "corpus", "word-by-word.txt");
const SURAHS_FILE = path.join(process.cwd(), "data", "seeds", "surahs.json");
const BATCH_SIZE  = 1000;
const DRY_RUN     = process.argv.includes("--dry-run");

// ─── Helpers ──────────────────────────────────────────────────────────────────

function log(msg: string) { console.log(`[seed] ${msg}`); }
function timer() {
  const start = Date.now();
  return () => `${((Date.now() - start) / 1000).toFixed(1)}s`;
}

async function batchInsert<T>(
  label: string,
  items: T[],
  inserter: (batch: T[]) => Promise<void>,
  batchSize = BATCH_SIZE,
) {
  const t = timer();
  let inserted = 0;
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await inserter(batch);
    inserted += batch.length;
    process.stdout.write(
      `\r  ${label}: ${inserted.toLocaleString()} / ${items.length.toLocaleString()}`,
    );
  }
  console.log(`\r  ✓ ${label}: ${inserted.toLocaleString()} rows — ${t()}`);
}

// ─── Step 1: Truncate (order matters for FK constraints) ─────────────────────

async function truncateTables() {
  log("Truncating tables...");
  await prisma.$executeRaw`TRUNCATE TABLE
    concept_verses, concept_relations, concepts,
    treebank_edges, treebank_nodes,
    word_lemmas, word_roots, lemmas, roots,
    segments, words, verses, surahs
    RESTART IDENTITY CASCADE`;
  log("  ✓ Tables truncated.");
}

// ─── Step 2: Seed surahs ──────────────────────────────────────────────────────

async function seedSurahs() {
  const t = timer();
  const raw = JSON.parse(fs.readFileSync(SURAHS_FILE, "utf-8")) as Array<{
    id: number;
    nameArabic: string;
    nameSimple: string;
    nameComplex: string;
    revelationPlace: string;
    revelationOrder: number;
    versesCount: number;
    bismillahPre: boolean;
    translatedName: string;
  }>;

  await prisma.surah.createMany({
    data: raw.map((s) => ({
      id:              s.id,
      nameArabic:      s.nameArabic,
      nameSimple:      s.nameSimple,
      nameComplex:     s.nameComplex,
      revelationPlace: s.revelationPlace as RevelationPlace,
      revelationOrder: s.revelationOrder,
      versesCount:     s.versesCount,
      bismillahPre:    s.bismillahPre,
      translatedName:  s.translatedName,
    })),
    skipDuplicates: true,
  });
  console.log(`  ✓ Surahs: 114 rows — ${t()}`);
}

// ─── Step 3: Seed verses ──────────────────────────────────────────────────────

async function seedVerses(parsed: ParseResult) {
  const verses = Array.from(parsed.verseIds).map((id) => {
    const [s, v] = id.split(":").map(Number);
    return {
      id,
      surahId:     s,
      verseNumber: v,
      textUthmani: parsed.verseTexts.get(id) ?? "",
    };
  });
  verses.sort((a, b) => a.surahId - b.surahId || a.verseNumber - b.verseNumber);

  await batchInsert("Verses", verses, async (batch) => {
    await prisma.verse.createMany({ data: batch, skipDuplicates: true });
  });
}

// ─── Step 4: Seed words ───────────────────────────────────────────────────────

async function seedWords(parsed: ParseResult) {
  const words = Array.from(parsed.wordGroups.values()).map((wg) => ({
    id:              wg.wordId,
    verseId:         `${wg.surahId}:${wg.verseNumber}`,
    surahId:         wg.surahId,
    verseNumber:     wg.verseNumber,
    position:        wg.position,
    textUthmani:     wg.textUthmani,
    transliteration: wg.transliteration,
    translation:     wg.translation,
  }));
  words.sort((a, b) => a.surahId - b.surahId || a.verseNumber - b.verseNumber || a.position - b.position);

  await batchInsert("Words", words, async (batch) => {
    await prisma.word.createMany({ data: batch, skipDuplicates: true });
  });
}

// ─── Step 5: Seed segments ────────────────────────────────────────────────────

function segmentTypeEnum(t: string): SegmentType {
  if (t === "PREFIX") return SegmentType.PREFIX;
  if (t === "SUFFIX") return SegmentType.SUFFIX;
  return SegmentType.STEM;
}

async function seedSegments(segments: CorpusSegment[]) {
  const rows = segments.map((seg) => {
    const f: ParsedFeatures = seg.features;
    return {
      wordId:          seg.wordId,
      surahId:         seg.surahId,
      verseNumber:     seg.verseNumber,
      wordPosition:    seg.wordPosition,
      segmentPosition: seg.segmentPosition,
      formBuckwalter:  seg.formBuckwalter,
      formArabic:      seg.formArabic,
      posTag:          seg.posTag,
      segmentType:     segmentTypeEnum(f.segmentType),
      features:        f as object,
      // Hot-path denormalized columns
      rootBuckwalter:  f.root     ?? null,
      lemmaBuckwalter: f.lemma    ?? null,
      gramCase:        f.gramCase ?? null,
      gramState:       f.gramState ?? null,
      verbAspect:      f.verbAspect ?? null,
      verbMood:        f.verbMood ?? null,
      verbVoice:       f.verbVoice ?? null,
      verbForm:        f.verbForm ?? null,
      person:          f.person ?? null,
      gender:          f.gender ?? null,
      number:          f.number ?? null,
    };
  });

  await batchInsert("Segments", rows, async (batch) => {
    await prisma.segment.createMany({ data: batch, skipDuplicates: true });
  });
}

// ─── Step 6: Seed roots ───────────────────────────────────────────────────────

async function seedRoots(parsed: ParseResult): Promise<Map<string, number>> {
  // Count word-level frequency per root (number of DISTINCT words using each root)
  const rootWordCount = new Map<string, Set<string>>();
  for (const [bw, arabic] of parsed.roots) {
    rootWordCount.set(bw, new Set());
  }
  for (const seg of parsed.segments) {
    if (seg.features.root) {
      const set = rootWordCount.get(seg.features.root);
      if (set) set.add(seg.wordId);
    }
  }

  const rows = Array.from(parsed.roots.entries()).map(([bw, arabic]) => ({
    lettersBuckwalter: bw,
    lettersArabic:     arabic,
    frequency:         rootWordCount.get(bw)?.size ?? 0,
  }));
  rows.sort((a, b) => b.frequency - a.frequency);

  await batchInsert("Roots", rows, async (batch) => {
    await prisma.root.createMany({ data: batch, skipDuplicates: true });
  });

  // Return buckwalter → id map for junction table
  const allRoots = await prisma.root.findMany({ select: { id: true, lettersBuckwalter: true } });
  return new Map(allRoots.map((r) => [r.lettersBuckwalter, r.id]));
}

// ─── Step 7: Seed lemmas ──────────────────────────────────────────────────────

async function seedLemmas(
  parsed: ParseResult,
  rootIdMap: Map<string, number>,
): Promise<Map<string, number>> {
  // Frequency = number of distinct words using this lemma
  const lemmaWordCount = new Map<string, Set<string>>();
  for (const bw of parsed.lemmas.keys()) {
    lemmaWordCount.set(bw, new Set());
  }
  for (const seg of parsed.segments) {
    if (seg.features.lemma) {
      lemmaWordCount.get(seg.features.lemma)?.add(seg.wordId);
    }
  }

  // Need root for each lemma — find it from the segment that first defines it
  const lemmaRootMap = new Map<string, string>();
  for (const seg of parsed.segments) {
    if (seg.features.lemma && seg.features.root && !lemmaRootMap.has(seg.features.lemma)) {
      lemmaRootMap.set(seg.features.lemma, seg.features.root);
    }
  }

  const rows = Array.from(parsed.lemmas.entries()).map(([bw, { arabic, posTag }]) => {
    const rootBw = lemmaRootMap.get(bw);
    const rootId = rootBw ? (rootIdMap.get(rootBw) ?? null) : null;
    return {
      formBuckwalter: bw,
      formArabic:     arabic,
      posTag,
      rootId,
      frequency: lemmaWordCount.get(bw)?.size ?? 0,
    };
  });

  await batchInsert("Lemmas", rows, async (batch) => {
    await prisma.lemma.createMany({ data: batch, skipDuplicates: true });
  });

  const allLemmas = await prisma.lemma.findMany({ select: { id: true, formBuckwalter: true } });
  return new Map(allLemmas.map((l) => [l.formBuckwalter, l.id]));
}

// ─── Step 8: Seed junction tables ────────────────────────────────────────────

async function seedJunctions(
  parsed: ParseResult,
  rootIdMap: Map<string, number>,
  lemmaIdMap: Map<string, number>,
) {
  // word_roots: one row per distinct (word, root) pair
  const wordRootPairs = new Map<string, Set<number>>();
  const wordLemmaPairs = new Map<string, Set<number>>();

  for (const seg of parsed.segments) {
    if (seg.features.segmentType !== "STEM") continue;

    if (seg.features.root) {
      const rootId = rootIdMap.get(seg.features.root);
      if (rootId) {
        if (!wordRootPairs.has(seg.wordId)) wordRootPairs.set(seg.wordId, new Set());
        wordRootPairs.get(seg.wordId)!.add(rootId);
      }
    }

    if (seg.features.lemma) {
      const lemmaId = lemmaIdMap.get(seg.features.lemma);
      if (lemmaId) {
        if (!wordLemmaPairs.has(seg.wordId)) wordLemmaPairs.set(seg.wordId, new Set());
        wordLemmaPairs.get(seg.wordId)!.add(lemmaId);
      }
    }
  }

  const rootRows: { wordId: string; rootId: number }[] = [];
  for (const [wordId, rootIds] of wordRootPairs) {
    for (const rootId of rootIds) rootRows.push({ wordId, rootId });
  }

  const lemmaRows: { wordId: string; lemmaId: number }[] = [];
  for (const [wordId, lemmaIds] of wordLemmaPairs) {
    for (const lemmaId of lemmaIds) lemmaRows.push({ wordId, lemmaId });
  }

  await batchInsert("WordRoots",  rootRows,  async (b) => {
    await prisma.wordRoot.createMany({ data: b, skipDuplicates: true });
  });
  await batchInsert("WordLemmas", lemmaRows, async (b) => {
    await prisma.wordLemma.createMany({ data: b, skipDuplicates: true });
  });
}

// ─── Step 9: Update root + lemma frequencies in DB ───────────────────────────

async function updateFrequencies() {
  log("Updating root frequencies...");
  await prisma.$executeRaw`
    UPDATE roots r
    SET frequency = (
      SELECT COUNT(DISTINCT wr.word_id)
      FROM word_roots wr
      WHERE wr.root_id = r.id
    )
  `;

  log("Updating lemma frequencies...");
  await prisma.$executeRaw`
    UPDATE lemmas l
    SET frequency = (
      SELECT COUNT(DISTINCT wl.word_id)
      FROM word_lemmas wl
      WHERE wl.lemma_id = l.id
    )
  `;
  log("  ✓ Frequencies updated.");
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const totalTimer = timer();
  console.log("\n═══════════════════════════════════════════════════");
  console.log("  Quran Lens — Corpus Seed Pipeline");
  console.log("═══════════════════════════════════════════════════\n");

  if (DRY_RUN) {
    log("DRY RUN MODE — no DB writes");
  }

  // Verify corpus files exist
  for (const [label, fp] of [["morphology.txt", CORPUS_FILE], ["quran-uthmani.xml", XML_FILE]] as const) {
    if (!fs.existsSync(fp)) {
      console.error(`\nCorpus file not found: ${fp}\n\nRun first:  npm run corpus:download\n`);
      process.exit(1);
    }
  }

  // ── Parse ────────────────────────────────────────────────────────────────
  log(`Parsing corpus: ${CORPUS_FILE}`);
  const parseTimer = timer();
  const parsed: ParseResult = await parseCorpusFile(CORPUS_FILE, XML_FILE, WBW_FILE);
  log(`  ✓ Parse complete — ${parseTimer()}`);
  log(`    Lines processed : ${parsed.lineCount.toLocaleString()}`);
  log(`    Segments parsed : ${parsed.segments.length.toLocaleString()}`);
  log(`    Unique words    : ${parsed.wordGroups.size.toLocaleString()}`);
  log(`    Unique verses   : ${parsed.verseIds.size.toLocaleString()}`);
  log(`    Unique surahs   : ${parsed.surahIds.size}`);
  log(`    Unique roots    : ${parsed.roots.size.toLocaleString()}`);
  log(`    Unique lemmas   : ${parsed.lemmas.size.toLocaleString()}`);
  log(`    Skipped lines   : ${parsed.skippedLines}`);

  if (DRY_RUN) {
    log("\nDry run complete — no rows written.");
    return;
  }

  // ── DB pipeline ──────────────────────────────────────────────────────────
  log("\nStarting database pipeline...\n");

  await truncateTables();

  log("Seeding surahs...");
  await seedSurahs();

  log("Seeding verses...");
  await seedVerses(parsed);

  log("Seeding words...");
  await seedWords(parsed);

  log("Seeding segments...");
  await seedSegments(parsed.segments);

  log("Seeding roots...");
  const rootIdMap = await seedRoots(parsed);

  log("Seeding lemmas...");
  const lemmaIdMap = await seedLemmas(parsed, rootIdMap);

  log("Seeding junction tables...");
  await seedJunctions(parsed, rootIdMap, lemmaIdMap);

  log("Updating frequencies...");
  await updateFrequencies();

  // ── Summary ──────────────────────────────────────────────────────────────
  const counts = await prisma.$transaction([
    prisma.surah.count(),
    prisma.verse.count(),
    prisma.word.count(),
    prisma.segment.count(),
    prisma.root.count(),
    prisma.lemma.count(),
    prisma.wordRoot.count(),
    prisma.wordLemma.count(),
  ]);

  console.log(`
═══════════════════════════════════════════════════
  Seed complete — ${totalTimer()}

  Table            Rows
  ─────────────────────────────────────────────
  surahs           ${counts[0].toLocaleString().padStart(10)}
  verses           ${counts[1].toLocaleString().padStart(10)}
  words            ${counts[2].toLocaleString().padStart(10)}
  segments         ${counts[3].toLocaleString().padStart(10)}
  roots            ${counts[4].toLocaleString().padStart(10)}
  lemmas           ${counts[5].toLocaleString().padStart(10)}
  word_roots       ${counts[6].toLocaleString().padStart(10)}
  word_lemmas      ${counts[7].toLocaleString().padStart(10)}
═══════════════════════════════════════════════════
`);
}

main()
  .catch((err) => {
    console.error("\nSeed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
