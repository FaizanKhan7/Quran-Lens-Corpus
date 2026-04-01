/**
 * index-elasticsearch.ts — Bulk-indexes the Quran corpus into Elasticsearch.
 *
 * Reads from Postgres via Prisma, writes to three ES indices:
 *   quran-words-v1   — 77,429 word documents
 *   quran-roots-v1   — ~1,642 root documents
 *   quran-verses-v1  — 6,236 verse documents
 *
 * Usage:
 *   npm run es:index
 *
 * Options:
 *   --index=words|roots|verses   Only index one type (default: all)
 *   --batch=N                    Batch size (default: 500)
 *   --drop                       Delete and recreate indices before indexing
 */

import { Client } from "@elastic/elasticsearch";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  IDX_WORDS, IDX_ROOTS, IDX_VERSES,
} from "../src/lib/elasticsearch.js";
import {
  WORDS_SETTINGS,  WORDS_MAPPINGS,
  ROOTS_SETTINGS,  ROOTS_MAPPINGS,
  VERSES_SETTINGS, VERSES_MAPPINGS,
} from "../src/lib/es-indices.js";

// ─── Init ─────────────────────────────────────────────────────────────────────

const esUrl = process.env.ELASTICSEARCH_URL ?? "http://localhost:9200";
const es    = new Client({ node: esUrl, requestTimeout: 30_000, maxRetries: 3 });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL not set");
const adapter = new PrismaPg({ connectionString });
const prisma  = new PrismaClient({ adapter });

// ─── CLI args ─────────────────────────────────────────────────────────────────

const args       = process.argv.slice(2);
const targetIdx  = args.find(a => a.startsWith("--index="))?.split("=")[1];
const batchSize  = parseInt(args.find(a => a.startsWith("--batch="))?.split("=")[1] ?? "500", 10);
const drop       = args.includes("--drop");

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function ensureIndex(
  name:     string,
  settings: object,
  mappings: object,
): Promise<void> {
  const exists = await es.indices.exists({ index: name });

  if (exists) {
    if (drop) {
      console.log(`  🗑  Deleting existing index ${name} …`);
      await es.indices.delete({ index: name });
    } else {
      console.log(`  ✓  Index ${name} already exists (use --drop to recreate)`);
      return;
    }
  }

  await es.indices.create({
    index:    name,
    settings,
    mappings: { properties: mappings },
  });
  console.log(`  ✓  Created index ${name}`);
}

async function bulkIndex(
  index:   string,
  docs:    object[],
  idField: string,
): Promise<number> {
  if (docs.length === 0) return 0;

  const body = docs.flatMap((doc) => [
    { index: { _index: index, _id: String((doc as Record<string, unknown>)[idField]) } },
    doc,
  ]);

  const res = await es.bulk({ body, refresh: false });

  const errors = res.items.filter((i) => i.index?.error);
  if (errors.length > 0) {
    console.warn(`  ⚠  ${errors.length} bulk errors (sample: ${JSON.stringify(errors[0].index?.error)})`);
  }
  return docs.length - errors.length;
}

// ─── Index: words ─────────────────────────────────────────────────────────────

async function indexWords(): Promise<void> {
  console.log("\n📝  Indexing words …");
  await ensureIndex(IDX_WORDS, WORDS_SETTINGS, WORDS_MAPPINGS);

  const total = await prisma.word.count();
  console.log(`  Total words: ${total.toLocaleString()}`);

  let indexed = 0;
  let cursor  = 0;

  while (cursor < total) {
    const words = await prisma.word.findMany({
      skip:    cursor,
      take:    batchSize,
      orderBy: [{ surahId: "asc" }, { verseNumber: "asc" }, { position: "asc" }],
      include: {
        verse: { include: { surah: { select: { nameSimple: true } } } },
        segments: {
          where: { segmentType: "STEM" },
          take:  1,
          select: {
            posTag:          true,
            rootBuckwalter:  true,
            lemmaBuckwalter: true,
            verbAspect:      true,
            verbMood:        true,
            verbVoice:       true,
            verbForm:        true,
            gramCase:        true,
            gramState:       true,
            person:          true,
            gender:          true,
            number:          true,
          },
        },
      },
    });

    const docs = words.map((w) => {
      const seg = w.segments[0];
      return {
        id:              w.id,
        surahId:         w.surahId,
        verseNumber:     w.verseNumber,
        position:        w.position,
        surahNameSimple: w.verse.surah.nameSimple,
        textUthmani:     w.textUthmani,
        transliteration: w.transliteration,
        translation:     w.translation,
        posTag:          seg?.posTag          ?? null,
        rootBuckwalter:  seg?.rootBuckwalter  ?? null,
        lemmaBuckwalter: seg?.lemmaBuckwalter ?? null,
        verbAspect:      seg?.verbAspect      ?? null,
        verbMood:        seg?.verbMood        ?? null,
        verbVoice:       seg?.verbVoice       ?? null,
        verbForm:        seg?.verbForm        ?? null,
        gramCase:        seg?.gramCase        ?? null,
        gramState:       seg?.gramState       ?? null,
        person:          seg?.person          ?? null,
        gender:          seg?.gender          ?? null,
        number:          seg?.number          ?? null,
      };
    });

    indexed += await bulkIndex(IDX_WORDS, docs, "id");
    cursor  += words.length;

    const pct = Math.round((cursor / total) * 100);
    process.stdout.write(`\r  ${cursor.toLocaleString()} / ${total.toLocaleString()} (${pct}%) `);
  }

  // Refresh so the index is immediately searchable
  await es.indices.refresh({ index: IDX_WORDS });
  console.log(`\n  ✅ Indexed ${indexed.toLocaleString()} words`);
}

// ─── Index: roots ─────────────────────────────────────────────────────────────

async function indexRoots(): Promise<void> {
  console.log("\n🌱  Indexing roots …");
  await ensureIndex(IDX_ROOTS, ROOTS_SETTINGS, ROOTS_MAPPINGS);

  const roots = await prisma.root.findMany({
    orderBy: { frequency: "desc" },
    select:  { id: true, lettersBuckwalter: true, lettersArabic: true, frequency: true },
  });

  const indexed = await bulkIndex(IDX_ROOTS, roots, "id");
  await es.indices.refresh({ index: IDX_ROOTS });
  console.log(`  ✅ Indexed ${indexed} roots`);
}

// ─── Index: verses ────────────────────────────────────────────────────────────

async function indexVerses(): Promise<void> {
  console.log("\n📖  Indexing verses …");
  await ensureIndex(IDX_VERSES, VERSES_SETTINGS, VERSES_MAPPINGS);

  const total = await prisma.verse.count();
  console.log(`  Total verses: ${total.toLocaleString()}`);

  let indexed = 0;
  let cursor  = 0;

  while (cursor < total) {
    const verses = await prisma.verse.findMany({
      skip:    cursor,
      take:    batchSize,
      orderBy: [{ surahId: "asc" }, { verseNumber: "asc" }],
      select: {
        id:          true,
        surahId:     true,
        verseNumber: true,
        textUthmani: true,
        textSimple:  true,
        surah:       { select: { nameSimple: true } },
      },
    });

    const docs = verses.map((v) => ({
      id:              v.id,
      surahId:         v.surahId,
      verseNumber:     v.verseNumber,
      surahNameSimple: v.surah.nameSimple,
      textUthmani:     v.textUthmani,
      textSimple:      v.textSimple,
    }));

    indexed += await bulkIndex(IDX_VERSES, docs, "id");
    cursor  += verses.length;

    const pct = Math.round((cursor / total) * 100);
    process.stdout.write(`\r  ${cursor.toLocaleString()} / ${total.toLocaleString()} (${pct}%) `);
  }

  await es.indices.refresh({ index: IDX_VERSES });
  console.log(`\n  ✅ Indexed ${indexed.toLocaleString()} verses`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`🔍 Quran Lens — Elasticsearch Indexer`);
  console.log(`   ES:  ${esUrl}`);
  console.log(`   Batch size: ${batchSize} | Drop: ${drop}`);

  // Verify ES is reachable
  try {
    const health = await es.cluster.health({ timeout: "5s" });
    console.log(`   ES health: ${health.status}`);
  } catch (err) {
    console.error("❌ Elasticsearch is not reachable:", (err as Error).message);
    console.error("   Start it with: docker compose up -d elasticsearch");
    process.exit(1);
  }

  const runWords  = !targetIdx || targetIdx === "words";
  const runRoots  = !targetIdx || targetIdx === "roots";
  const runVerses = !targetIdx || targetIdx === "verses";

  if (runWords)  await indexWords();
  if (runRoots)  await indexRoots();
  if (runVerses) await indexVerses();

  console.log("\n🎉  Indexing complete.");
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
