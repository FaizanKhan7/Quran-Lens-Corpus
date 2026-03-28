-- DropIndex
DROP INDEX "concept_relations_subjId_idx";

-- DropIndex
DROP INDEX "segments_features_gin_idx";

-- RenameIndex
ALTER INDEX "treebank_edges_depNodeId_idx" RENAME TO "treebank_edges_dependentNodeId_idx";
