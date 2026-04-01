/**
 * seed-ontology.ts — Seeds the Quranic ontology (spec §3.5).
 *
 * Creates 12 top-level categories + 2 special instances (Allah, Allah's Throne)
 * and ~50 sub-concepts with subclass/instance relations and verse links.
 *
 * Usage: npm run db:seed:ontology
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL not set");
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter, log: ["warn", "error"] });

// ─── Concept definitions ───────────────────────────────────────────────────────

interface ConceptDef {
  id:       string;
  name:     string;
  category: string;
  parentId?: string;
}

interface RelationDef {
  subjectId: string;
  predicate: "subclass" | "instance";
  objectId:  string;
}

interface VerseLinkDef {
  conceptId: string;
  verseId:   string;
  wordId?:   string;
}

// ── 12 top-level categories + 2 special instances ──────────────────────────
const concepts: ConceptDef[] = [
  // Root categories
  { id: "artifact",           name: "Artifact",            category: "Artifact" },
  { id: "astronomical-body",  name: "Astronomical Body",   category: "Astronomical Body" },
  { id: "event",              name: "Event",               category: "Event" },
  { id: "false-deity",        name: "False Deity",         category: "False Deity" },
  { id: "holy-book",          name: "Holy Book",           category: "Holy Book" },
  { id: "language",           name: "Language",            category: "Language" },
  { id: "living-creation",    name: "Living Creation",     category: "Living Creation" },
  { id: "location",           name: "Location",            category: "Location" },
  { id: "physical-attribute", name: "Physical Attribute",  category: "Physical Attribute" },
  { id: "physical-substance", name: "Physical Substance",  category: "Physical Substance" },
  { id: "religion",           name: "Religion",            category: "Religion" },
  { id: "weather",            name: "Weather Phenomena",   category: "Weather Phenomena" },

  // Special instances
  { id: "allah",        name: "Allah",          category: "Special" },
  { id: "allahs-throne",name: "Allah's Throne", category: "Special", parentId: "artifact" },

  // ── Living Creation sub-tree ──────────────────────────────────────────────
  { id: "human",      name: "Human",      category: "Living Creation", parentId: "living-creation" },
  { id: "prophet",    name: "Prophet",    category: "Living Creation", parentId: "human" },
  { id: "adam",       name: "Adam",       category: "Living Creation", parentId: "prophet" },
  { id: "ibrahim",    name: "Ibrahim",    category: "Living Creation", parentId: "prophet" },
  { id: "musa",       name: "Musa",       category: "Living Creation", parentId: "prophet" },
  { id: "isa",        name: "Isa",        category: "Living Creation", parentId: "prophet" },
  { id: "muhammad",   name: "Muhammad",   category: "Living Creation", parentId: "prophet" },
  { id: "nuh",        name: "Nuh",        category: "Living Creation", parentId: "prophet" },
  { id: "believer",   name: "Believer",   category: "Living Creation", parentId: "human" },
  { id: "disbeliever",name: "Disbeliever",category: "Living Creation", parentId: "human" },
  { id: "angel",      name: "Angel",      category: "Living Creation", parentId: "living-creation" },
  { id: "jibril",     name: "Jibril",     category: "Living Creation", parentId: "angel" },
  { id: "israfil",    name: "Israfil",    category: "Living Creation", parentId: "angel" },
  { id: "jinn",       name: "Jinn",       category: "Living Creation", parentId: "living-creation" },
  { id: "iblis",      name: "Iblis",      category: "Living Creation", parentId: "jinn" },
  { id: "animal",     name: "Animal",     category: "Living Creation", parentId: "living-creation" },

  // ── Location sub-tree ─────────────────────────────────────────────────────
  { id: "paradise",   name: "Paradise",   category: "Location", parentId: "location" },
  { id: "hellfire",   name: "Hellfire",   category: "Location", parentId: "location" },
  { id: "earth",      name: "Earth",      category: "Location", parentId: "location" },
  { id: "heavens",    name: "Heavens",    category: "Location", parentId: "location" },
  { id: "mecca",      name: "Mecca",      category: "Location", parentId: "location" },
  { id: "madinah",    name: "Madinah",    category: "Location", parentId: "location" },
  { id: "al-aqsa",    name: "Al-Aqsa",    category: "Location", parentId: "location" },

  // ── Event sub-tree ────────────────────────────────────────────────────────
  { id: "day-of-judgment", name: "Day of Judgment", category: "Event", parentId: "event" },
  { id: "creation",        name: "Creation",         category: "Event", parentId: "event" },
  { id: "revelation",      name: "Revelation",       category: "Event", parentId: "event" },
  { id: "prayer",          name: "Prayer",           category: "Event", parentId: "event" },
  { id: "fasting",         name: "Fasting",          category: "Event", parentId: "event" },
  { id: "pilgrimage",      name: "Pilgrimage",       category: "Event", parentId: "event" },

  // ── Physical Attribute sub-tree ───────────────────────────────────────────
  { id: "mercy",     name: "Mercy",     category: "Physical Attribute", parentId: "physical-attribute" },
  { id: "knowledge", name: "Knowledge", category: "Physical Attribute", parentId: "physical-attribute" },
  { id: "power",     name: "Power",     category: "Physical Attribute", parentId: "physical-attribute" },
  { id: "guidance",  name: "Guidance",  category: "Physical Attribute", parentId: "physical-attribute" },
  { id: "praise",    name: "Praise",    category: "Physical Attribute", parentId: "physical-attribute" },
  { id: "justice",   name: "Justice",   category: "Physical Attribute", parentId: "physical-attribute" },
  { id: "lordship",  name: "Lordship",  category: "Physical Attribute", parentId: "physical-attribute" },

  // ── Holy Book sub-tree ────────────────────────────────────────────────────
  { id: "quran",   name: "Quran",  category: "Holy Book", parentId: "holy-book" },
  { id: "torah",   name: "Torah",  category: "Holy Book", parentId: "holy-book" },
  { id: "injeel",  name: "Injeel", category: "Holy Book", parentId: "holy-book" },
  { id: "zabur",   name: "Zabur",  category: "Holy Book", parentId: "holy-book" },

  // ── Religion sub-tree ─────────────────────────────────────────────────────
  { id: "islam",       name: "Islam",       category: "Religion", parentId: "religion" },
  { id: "christianity",name: "Christianity",category: "Religion", parentId: "religion" },
  { id: "judaism",     name: "Judaism",     category: "Religion", parentId: "religion" },
  { id: "paganism",    name: "Paganism",    category: "Religion", parentId: "religion" },

  // ── Astronomical Body ─────────────────────────────────────────────────────
  { id: "sun",   name: "Sun",   category: "Astronomical Body", parentId: "astronomical-body" },
  { id: "moon",  name: "Moon",  category: "Astronomical Body", parentId: "astronomical-body" },
  { id: "stars", name: "Stars", category: "Astronomical Body", parentId: "astronomical-body" },

  // ── Physical Substance ────────────────────────────────────────────────────
  { id: "water", name: "Water", category: "Physical Substance", parentId: "physical-substance" },
  { id: "fire",  name: "Fire",  category: "Physical Substance", parentId: "physical-substance" },
  { id: "light", name: "Light", category: "Physical Substance", parentId: "physical-substance" },
  { id: "dust",  name: "Dust",  category: "Physical Substance", parentId: "physical-substance" },

  // ── Artifact sub-tree ─────────────────────────────────────────────────────
  { id: "throne", name: "Throne", category: "Artifact", parentId: "artifact" },
  { id: "scale",  name: "Scale",  category: "Artifact", parentId: "artifact" },
  { id: "pen",    name: "Pen",    category: "Artifact", parentId: "artifact" },

  // ── False Deity ───────────────────────────────────────────────────────────
  { id: "idol",  name: "Idol",  category: "False Deity", parentId: "false-deity" },
  { id: "lat",   name: "Al-Lat",category: "False Deity", parentId: "false-deity" },

  // ── Language ─────────────────────────────────────────────────────────────
  { id: "arabic", name: "Arabic", category: "Language", parentId: "language" },

  // ── Weather ───────────────────────────────────────────────────────────────
  { id: "rain",  name: "Rain",  category: "Weather Phenomena", parentId: "weather" },
  { id: "wind",  name: "Wind",  category: "Weather Phenomena", parentId: "weather" },
  { id: "cloud", name: "Cloud", category: "Weather Phenomena", parentId: "weather" },
];

// ── Semantic relations (beyond the parent→child hierarchy) ─────────────────
const relations: RelationDef[] = [
  // Living creation
  { subjectId: "human",       predicate: "subclass",  objectId: "living-creation" },
  { subjectId: "prophet",     predicate: "subclass",  objectId: "human" },
  { subjectId: "angel",       predicate: "subclass",  objectId: "living-creation" },
  { subjectId: "jinn",        predicate: "subclass",  objectId: "living-creation" },
  { subjectId: "animal",      predicate: "subclass",  objectId: "living-creation" },
  { subjectId: "adam",        predicate: "instance",  objectId: "prophet" },
  { subjectId: "ibrahim",     predicate: "instance",  objectId: "prophet" },
  { subjectId: "musa",        predicate: "instance",  objectId: "prophet" },
  { subjectId: "isa",         predicate: "instance",  objectId: "prophet" },
  { subjectId: "muhammad",    predicate: "instance",  objectId: "prophet" },
  { subjectId: "nuh",         predicate: "instance",  objectId: "prophet" },
  { subjectId: "jibril",      predicate: "instance",  objectId: "angel" },
  { subjectId: "iblis",       predicate: "instance",  objectId: "jinn" },

  // Location
  { subjectId: "paradise",    predicate: "instance",  objectId: "location" },
  { subjectId: "hellfire",    predicate: "instance",  objectId: "location" },
  { subjectId: "earth",       predicate: "instance",  objectId: "location" },
  { subjectId: "heavens",     predicate: "instance",  objectId: "location" },
  { subjectId: "mecca",       predicate: "instance",  objectId: "location" },

  // Events
  { subjectId: "day-of-judgment", predicate: "instance", objectId: "event" },
  { subjectId: "revelation",      predicate: "instance", objectId: "event" },
  { subjectId: "prayer",          predicate: "instance", objectId: "event" },

  // Holy Books
  { subjectId: "quran",  predicate: "instance", objectId: "holy-book" },
  { subjectId: "torah",  predicate: "instance", objectId: "holy-book" },
  { subjectId: "injeel", predicate: "instance", objectId: "holy-book" },

  // Cross-concept
  { subjectId: "allahs-throne", predicate: "instance", objectId: "artifact" },
  { subjectId: "iblis",         predicate: "instance", objectId: "false-deity" },

  // Attributes of Allah
  { subjectId: "mercy",    predicate: "subclass", objectId: "physical-attribute" },
  { subjectId: "guidance", predicate: "subclass", objectId: "physical-attribute" },
  { subjectId: "knowledge",predicate: "subclass", objectId: "physical-attribute" },
];

// ── Verse links (Al-Fatiha, which we know is seeded) ──────────────────────
const verseLinks: VerseLinkDef[] = [
  // Allah: bismi-llahi, lillahi
  { conceptId: "allah",        verseId: "1:1", wordId: "1:1:2" },
  { conceptId: "allah",        verseId: "1:2", wordId: "1:2:2" },

  // Mercy: al-rahmani, al-rahimi (x2 each verse)
  { conceptId: "mercy",        verseId: "1:1", wordId: "1:1:3" },
  { conceptId: "mercy",        verseId: "1:1", wordId: "1:1:4" },
  { conceptId: "mercy",        verseId: "1:3", wordId: "1:3:1" },
  { conceptId: "mercy",        verseId: "1:3", wordId: "1:3:2" },

  // Praise: al-hamdu
  { conceptId: "praise",       verseId: "1:2", wordId: "1:2:1" },

  // Lordship: rabbi
  { conceptId: "lordship",     verseId: "1:2", wordId: "1:2:3" },

  // Day of Judgment: yawmi al-deen
  { conceptId: "day-of-judgment", verseId: "1:4", wordId: "1:4:2" },
  { conceptId: "day-of-judgment", verseId: "1:4", wordId: "1:4:3" },

  // Guidance: ihdina
  { conceptId: "guidance",     verseId: "1:6", wordId: "1:6:1" },
  { conceptId: "guidance",     verseId: "1:7" },

  // Islam: verse-level links
  { conceptId: "islam",        verseId: "1:2" },
  { conceptId: "islam",        verseId: "1:5" },
];

// ─── Seed ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding ontology data …");

  // Idempotent: clear existing ontology data
  await prisma.conceptVerse.deleteMany();
  await prisma.conceptRelation.deleteMany();
  await prisma.concept.deleteMany();

  // Insert concepts
  await prisma.concept.createMany({ data: concepts });
  console.log(`  ✓ Inserted ${concepts.length} concepts`);

  // Insert relations
  await prisma.conceptRelation.createMany({ data: relations });
  console.log(`  ✓ Inserted ${relations.length} relations`);

  // Insert verse links (skip if verseId doesn't exist in DB — graceful)
  let linked = 0;
  for (const vl of verseLinks) {
    const verseExists = await prisma.verse.findUnique({ where: { id: vl.verseId }, select: { id: true } });
    if (!verseExists) continue;
    if (vl.wordId) {
      const wordExists = await prisma.word.findUnique({ where: { id: vl.wordId }, select: { id: true } });
      if (!wordExists) continue;
    }
    await prisma.conceptVerse.create({ data: vl });
    linked++;
  }
  console.log(`  ✓ Linked ${linked} verse references`);

  console.log("✅ Ontology seed complete.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
