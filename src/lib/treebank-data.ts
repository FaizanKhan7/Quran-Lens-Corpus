/**
 * treebank-data.ts — Server-side helper for fetching treebank data.
 *
 * Returns all nodes + edges for a verse, with word data joined for
 * terminal nodes so the viewer can display Arabic text, gloss, POS, etc.
 */

import { prisma } from "@/lib/prisma";

export interface TreebankWordData {
  textUthmani: string;
  transliteration: string | null;
  translation: string | null;
  posTag: string | null;     // primary POS from STEM segment
}

export interface TreebankNodeData {
  id: string;
  nodeType: "terminal" | "non_terminal" | "hidden";
  phraseTag: string | null;
  label: string;
  wordId: string | null;
  wordData: TreebankWordData | null;
}

export interface TreebankEdgeData {
  id: number;
  headNodeId: string;
  dependentNodeId: string;
  relation: string;
}

export interface TreebankData {
  verseKey: string;
  isComplete: boolean;
  nodes: TreebankNodeData[];
  edges: TreebankEdgeData[];
}

export async function getTreebankData(
  surahId: number,
  verseNumber: number,
): Promise<TreebankData | null> {
  const verseId = `${surahId}:${verseNumber}`;

  const [dbNodes, dbEdges] = await Promise.all([
    prisma.treebankNode.findMany({
      where: { verseId },
      include: {
        word: {
          include: {
            segments: { where: { segmentType: "STEM" }, take: 1 },
          },
        },
      },
      orderBy: { id: "asc" },
    }),
    prisma.treebankEdge.findMany({
      where: {
        OR: [
          { headNode: { verseId } },
          { dependentNode: { verseId } },
        ],
      },
    }),
  ]);

  if (dbNodes.length === 0) return null;

  const nodes: TreebankNodeData[] = dbNodes.map((n) => {
    const stem = n.word?.segments[0] ?? null;
    const wordData: TreebankWordData | null = n.word
      ? {
          textUthmani:    n.word.textUthmani,
          transliteration: n.word.transliteration,
          translation:    n.word.translation,
          posTag:         stem?.posTag ?? null,
        }
      : null;

    return {
      id:        n.id,
      nodeType:  n.nodeType as "terminal" | "non_terminal" | "hidden",
      phraseTag: n.phraseTag,
      label:     n.label,
      wordId:    n.wordId,
      wordData,
    };
  });

  const edges: TreebankEdgeData[] = dbEdges.map((e) => ({
    id:              e.id,
    headNodeId:      e.headNodeId,
    dependentNodeId: e.dependentNodeId,
    relation:        e.relation,
  }));

  // isComplete = all terminal nodes have real word data
  const isComplete = nodes
    .filter((n) => n.nodeType === "terminal")
    .every((n) => n.wordData !== null);

  return { verseKey: verseId, isComplete, nodes, edges };
}
