/**
 * seed-treebank.ts — Seeds Al-Fatiha (1:1–1:7) treebank data.
 *
 * Creates representative dependency-tree annotations for all 7 verses of
 * Al-Fatiha so the TreebankViewer has data to visualise.
 *
 * Node ID conventions:
 *   terminal nodes   → same as word ID   e.g. "1:2:1"
 *   non-terminal     → "{surah}:{verse}:P{n}" e.g. "1:2:P1"
 *   hidden (pro-drop)→ "{surah}:{verse}:H{n}" e.g. "1:5:H1"
 *
 * Usage:  npm run db:seed:treebank
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL not set");
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter, log: ["warn", "error"] });

// ─── Treebank data ─────────────────────────────────────────────────────────────

interface NodeDef {
  id: string;
  verseId: string;
  wordId?: string;
  nodeType: "terminal" | "non_terminal" | "hidden";
  phraseTag?: string;
  label: string;
}

interface EdgeDef {
  headNodeId: string;
  dependentNodeId: string;
  relation: string;
}

const nodes: NodeDef[] = [
  // ── 1:1 Bismillah ────────────────────────────────────────────────────────
  { id: "1:1:P1", verseId: "1:1", nodeType: "non_terminal", phraseTag: "PP", label: "PP" },
  { id: "1:1:1", verseId: "1:1", wordId: "1:1:1", nodeType: "terminal", label: "بِسْمِ" },
  { id: "1:1:2", verseId: "1:1", wordId: "1:1:2", nodeType: "terminal", label: "ٱللَّهِ" },
  { id: "1:1:3", verseId: "1:1", wordId: "1:1:3", nodeType: "terminal", label: "ٱلرَّحْمَٰنِ" },
  { id: "1:1:4", verseId: "1:1", wordId: "1:1:4", nodeType: "terminal", label: "ٱلرَّحِيمِ" },

  // ── 1:2 Al-Hamdu lillahi rabbi al-aalameen ──────────────────────────────
  { id: "1:2:P1", verseId: "1:2", nodeType: "non_terminal", phraseTag: "NS", label: "NS" },
  { id: "1:2:P2", verseId: "1:2", nodeType: "non_terminal", phraseTag: "PP", label: "PP" },
  { id: "1:2:1",  verseId: "1:2", wordId: "1:2:1", nodeType: "terminal", label: "ٱلْحَمْدُ" },
  { id: "1:2:2",  verseId: "1:2", wordId: "1:2:2", nodeType: "terminal", label: "لِلَّهِ" },
  { id: "1:2:3",  verseId: "1:2", wordId: "1:2:3", nodeType: "terminal", label: "رَبِّ" },
  { id: "1:2:4",  verseId: "1:2", wordId: "1:2:4", nodeType: "terminal", label: "ٱلْعَٰلَمِينَ" },

  // ── 1:3 Al-Rahmani al-Raheem ────────────────────────────────────────────
  { id: "1:3:P1", verseId: "1:3", nodeType: "non_terminal", phraseTag: "NS", label: "NS" },
  { id: "1:3:1",  verseId: "1:3", wordId: "1:3:1", nodeType: "terminal", label: "ٱلرَّحْمَٰنِ" },
  { id: "1:3:2",  verseId: "1:3", wordId: "1:3:2", nodeType: "terminal", label: "ٱلرَّحِيمِ" },

  // ── 1:4 Maliki yawmi al-deen ────────────────────────────────────────────
  { id: "1:4:P1", verseId: "1:4", nodeType: "non_terminal", phraseTag: "NS", label: "NS" },
  { id: "1:4:P2", verseId: "1:4", nodeType: "non_terminal", phraseTag: "PP", label: "PP" },
  { id: "1:4:1",  verseId: "1:4", wordId: "1:4:1", nodeType: "terminal", label: "مَٰلِكِ" },
  { id: "1:4:2",  verseId: "1:4", wordId: "1:4:2", nodeType: "terminal", label: "يَوْمِ" },
  { id: "1:4:3",  verseId: "1:4", wordId: "1:4:3", nodeType: "terminal", label: "ٱلدِّينِ" },

  // ── 1:5 Iyyaka nabudu wa iyyaka nastaeenu ──────────────────────────────
  { id: "1:5:P1", verseId: "1:5", nodeType: "non_terminal", phraseTag: "VS", label: "VS" },
  { id: "1:5:P2", verseId: "1:5", nodeType: "non_terminal", phraseTag: "VS", label: "VS" },
  { id: "1:5:P3", verseId: "1:5", nodeType: "non_terminal", phraseTag: "VS", label: "VS" },
  { id: "1:5:1",  verseId: "1:5", wordId: "1:5:1", nodeType: "terminal", label: "إِيَّاكَ" },
  { id: "1:5:2",  verseId: "1:5", wordId: "1:5:2", nodeType: "terminal", label: "نَعْبُدُ" },
  { id: "1:5:3",  verseId: "1:5", wordId: "1:5:3", nodeType: "terminal", label: "وَإِيَّاكَ" },
  { id: "1:5:4",  verseId: "1:5", wordId: "1:5:4", nodeType: "terminal", label: "نَسْتَعِينُ" },

  // ── 1:6 Ihdina al-sirata al-mustaqima ──────────────────────────────────
  { id: "1:6:P1", verseId: "1:6", nodeType: "non_terminal", phraseTag: "VS", label: "VS" },
  { id: "1:6:1",  verseId: "1:6", wordId: "1:6:1", nodeType: "terminal", label: "ٱهْدِنَا" },
  { id: "1:6:2",  verseId: "1:6", wordId: "1:6:2", nodeType: "terminal", label: "ٱلصِّرَٰطَ" },
  { id: "1:6:3",  verseId: "1:6", wordId: "1:6:3", nodeType: "terminal", label: "ٱلْمُسْتَقِيمَ" },

  // ── 1:7 Sirata alladhina … ─────────────────────────────────────────────
  { id: "1:7:P1", verseId: "1:7", nodeType: "non_terminal", phraseTag: "SC", label: "SC" },
  { id: "1:7:P2", verseId: "1:7", nodeType: "non_terminal", phraseTag: "VS", label: "VS" },
  { id: "1:7:P3", verseId: "1:7", nodeType: "non_terminal", phraseTag: "PP", label: "PP" },
  { id: "1:7:P4", verseId: "1:7", nodeType: "non_terminal", phraseTag: "PP", label: "PP" },
  { id: "1:7:P5", verseId: "1:7", nodeType: "non_terminal", phraseTag: "NS", label: "NS" },
  { id: "1:7:1",  verseId: "1:7", wordId: "1:7:1", nodeType: "terminal", label: "صِرَٰطَ" },
  { id: "1:7:2",  verseId: "1:7", wordId: "1:7:2", nodeType: "terminal", label: "ٱلَّذِينَ" },
  { id: "1:7:3",  verseId: "1:7", wordId: "1:7:3", nodeType: "terminal", label: "أَنْعَمْتَ" },
  { id: "1:7:4",  verseId: "1:7", wordId: "1:7:4", nodeType: "terminal", label: "عَلَيْهِمْ" },
  { id: "1:7:5",  verseId: "1:7", wordId: "1:7:5", nodeType: "terminal", label: "غَيْرَ" },
  { id: "1:7:6",  verseId: "1:7", wordId: "1:7:6", nodeType: "terminal", label: "ٱلْمَغْضُوبِ" },
  { id: "1:7:7",  verseId: "1:7", wordId: "1:7:7", nodeType: "terminal", label: "عَلَيْهِمْ" },
  { id: "1:7:8",  verseId: "1:7", wordId: "1:7:8", nodeType: "terminal", label: "وَلَا" },
  { id: "1:7:9",  verseId: "1:7", wordId: "1:7:9", nodeType: "terminal", label: "ٱلضَّآلِّينَ" },
];

const edges: EdgeDef[] = [
  // ── 1:1 ──────────────────────────────────────────────────────────────────
  { headNodeId: "1:1:P1", dependentNodeId: "1:1:1",  relation: "gen" },
  { headNodeId: "1:1:1",  dependentNodeId: "1:1:2",  relation: "poss" },
  { headNodeId: "1:1:2",  dependentNodeId: "1:1:3",  relation: "adj" },
  { headNodeId: "1:1:2",  dependentNodeId: "1:1:4",  relation: "adj" },

  // ── 1:2 ──────────────────────────────────────────────────────────────────
  { headNodeId: "1:2:P1", dependentNodeId: "1:2:1",  relation: "subj" },
  { headNodeId: "1:2:P1", dependentNodeId: "1:2:P2", relation: "pred" },
  { headNodeId: "1:2:P2", dependentNodeId: "1:2:2",  relation: "gen" },
  { headNodeId: "1:2:2",  dependentNodeId: "1:2:3",  relation: "poss" },
  { headNodeId: "1:2:3",  dependentNodeId: "1:2:4",  relation: "poss" },

  // ── 1:3 ──────────────────────────────────────────────────────────────────
  { headNodeId: "1:3:P1", dependentNodeId: "1:3:1",  relation: "adj" },
  { headNodeId: "1:3:1",  dependentNodeId: "1:3:2",  relation: "adj" },

  // ── 1:4 ──────────────────────────────────────────────────────────────────
  { headNodeId: "1:4:P1", dependentNodeId: "1:4:1",  relation: "adj" },
  { headNodeId: "1:4:1",  dependentNodeId: "1:4:P2", relation: "link" },
  { headNodeId: "1:4:P2", dependentNodeId: "1:4:2",  relation: "poss" },
  { headNodeId: "1:4:2",  dependentNodeId: "1:4:3",  relation: "poss" },

  // ── 1:5 ──────────────────────────────────────────────────────────────────
  { headNodeId: "1:5:P1", dependentNodeId: "1:5:P2", relation: "sub" },
  { headNodeId: "1:5:P1", dependentNodeId: "1:5:P3", relation: "conj" },
  { headNodeId: "1:5:P2", dependentNodeId: "1:5:1",  relation: "obj" },
  { headNodeId: "1:5:P2", dependentNodeId: "1:5:2",  relation: "subj" },
  { headNodeId: "1:5:P3", dependentNodeId: "1:5:3",  relation: "obj" },
  { headNodeId: "1:5:P3", dependentNodeId: "1:5:4",  relation: "subj" },

  // ── 1:6 ──────────────────────────────────────────────────────────────────
  { headNodeId: "1:6:P1", dependentNodeId: "1:6:1",  relation: "subj" },
  { headNodeId: "1:6:P1", dependentNodeId: "1:6:2",  relation: "obj" },
  { headNodeId: "1:6:2",  dependentNodeId: "1:6:3",  relation: "adj" },

  // ── 1:7 ──────────────────────────────────────────────────────────────────
  { headNodeId: "1:7:P1", dependentNodeId: "1:7:1",  relation: "spec" },
  { headNodeId: "1:7:P1", dependentNodeId: "1:7:P2", relation: "sub" },
  { headNodeId: "1:7:P2", dependentNodeId: "1:7:2",  relation: "subj" },
  { headNodeId: "1:7:P2", dependentNodeId: "1:7:3",  relation: "subj" },
  { headNodeId: "1:7:P2", dependentNodeId: "1:7:P3", relation: "link" },
  { headNodeId: "1:7:P3", dependentNodeId: "1:7:4",  relation: "gen" },
  { headNodeId: "1:7:P2", dependentNodeId: "1:7:5",  relation: "circ" },
  { headNodeId: "1:7:5",  dependentNodeId: "1:7:P4", relation: "link" },
  { headNodeId: "1:7:P4", dependentNodeId: "1:7:6",  relation: "poss" },
  { headNodeId: "1:7:P4", dependentNodeId: "1:7:7",  relation: "gen" },
  { headNodeId: "1:7:P2", dependentNodeId: "1:7:P5", relation: "conj" },
  { headNodeId: "1:7:P5", dependentNodeId: "1:7:8",  relation: "neg" },
  { headNodeId: "1:7:P5", dependentNodeId: "1:7:9",  relation: "conj" },
];

// ─── Seed ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding Al-Fatiha treebank data …");

  // Remove existing Al-Fatiha treebank data (idempotent)
  const verseIds = ["1:1", "1:2", "1:3", "1:4", "1:5", "1:6", "1:7"];
  await prisma.treebankEdge.deleteMany({
    where: {
      OR: [
        { headNode:      { verseId: { in: verseIds } } },
        { dependentNode: { verseId: { in: verseIds } } },
      ],
    },
  });
  await prisma.treebankNode.deleteMany({ where: { verseId: { in: verseIds } } });

  // Insert nodes
  await prisma.treebankNode.createMany({ data: nodes });
  console.log(`  ✓ Inserted ${nodes.length} nodes`);

  // Insert edges
  await prisma.treebankEdge.createMany({ data: edges });
  console.log(`  ✓ Inserted ${edges.length} edges`);

  console.log("✅ Treebank seed complete.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
