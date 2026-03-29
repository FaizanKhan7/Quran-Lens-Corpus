"use client";

/**
 * TreebankViewer — Interactive SVG dependency-tree diagram (spec §10.3)
 *
 * Features:
 *  - D3 tree layout (root at top, terminals at bottom)
 *  - Click a node → highlight its full dependency chain
 *  - Scroll-wheel / pinch zoom + pan via d3.zoom
 *  - Layer toggles: glosses, transliteration, relation labels
 *  - POS-coded node colours matching the design-system palette
 *  - Accessible: keyboard-navigable toolbar, aria-labels on SVG
 */

import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import type { TreebankNodeData, TreebankEdgeData } from "@/lib/treebank-data";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface HierarchyNode {
  id: string;
  nodeType: "terminal" | "non_terminal" | "hidden";
  phraseTag: string | null;
  label: string;
  posTag: string | null;
  translation: string | null;
  transliteration: string | null;
  children: HierarchyNode[];
}

export interface TreebankViewerProps {
  nodes: TreebankNodeData[];
  edges: TreebankEdgeData[];
  verseKey: string;
}

// ─── Colour helpers ────────────────────────────────────────────────────────────

const NOMINAL_TAGS = new Set(["N", "PN", "ADJ", "IMPN", "PRON", "DEM", "REL", "T", "LOC"]);
const VERBAL_TAGS  = new Set(["V"]);
const SPECIAL_TAGS = new Set(["INL"]);

function posColor(posTag: string | null): string {
  if (!posTag) return "var(--token-pos-particle)";
  if (NOMINAL_TAGS.has(posTag)) return "var(--token-pos-nominal)";
  if (VERBAL_TAGS.has(posTag))  return "var(--token-pos-verbal)";
  if (SPECIAL_TAGS.has(posTag)) return "var(--token-pos-special)";
  return "var(--token-pos-particle)";
}

function phraseColor(phraseTag: string | null): string {
  switch (phraseTag) {
    case "VS": return "var(--token-pos-verbal)";
    case "NS": return "var(--token-pos-nominal)";
    case "PP": return "var(--token-pos-particle)";
    case "SC": case "CS": return "var(--token-pos-special)";
    default:   return "var(--token-text-tertiary)";
  }
}

// ─── Build hierarchy from flat nodes + edges ───────────────────────────────────

function buildHierarchy(
  nodes: TreebankNodeData[],
  edges: TreebankEdgeData[],
): HierarchyNode | null {
  if (nodes.length === 0) return null;

  const nodeMap = new Map<string, HierarchyNode>(
    nodes.map((n) => [
      n.id,
      {
        id:             n.id,
        nodeType:       n.nodeType,
        phraseTag:      n.phraseTag,
        label:          n.wordData?.textUthmani ?? n.label,
        posTag:         n.wordData?.posTag ?? null,
        translation:    n.wordData?.translation ?? null,
        transliteration: n.wordData?.transliteration ?? null,
        children:       [],
      },
    ]),
  );

  // Build children from head→dependent edges
  const hasParent = new Set<string>();
  for (const edge of edges) {
    const parent = nodeMap.get(edge.headNodeId);
    const child  = nodeMap.get(edge.dependentNodeId);
    if (parent && child) {
      parent.children.push(child);
      hasParent.add(edge.dependentNodeId);
    }
  }

  // Root = the node with no incoming edges
  const roots = nodes.filter((n) => !hasParent.has(n.id));
  if (roots.length === 0) return nodeMap.get(nodes[0].id) ?? null;
  if (roots.length === 1) return nodeMap.get(roots[0].id) ?? null;

  // Multiple roots: wrap in synthetic root
  const synth: HierarchyNode = {
    id: "__root__", nodeType: "non_terminal", phraseTag: "S",
    label: "S", posTag: null, translation: null, transliteration: null,
    children: roots.map((r) => nodeMap.get(r.id)!).filter(Boolean),
  };
  return synth;
}

// ─── Collect all ancestor + descendant IDs for highlight chain ────────────────

function collectChain(
  nodeId: string,
  edges: TreebankEdgeData[],
): Set<string> {
  const ids = new Set<string>([nodeId]);

  function walkDown(id: string) {
    for (const e of edges) {
      if (e.headNodeId === id && !ids.has(e.dependentNodeId)) {
        ids.add(e.dependentNodeId);
        walkDown(e.dependentNodeId);
      }
    }
  }
  function walkUp(id: string) {
    for (const e of edges) {
      if (e.dependentNodeId === id && !ids.has(e.headNodeId)) {
        ids.add(e.headNodeId);
        walkUp(e.headNodeId);
      }
    }
  }

  walkDown(nodeId);
  walkUp(nodeId);
  return ids;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function TreebankViewer({ nodes, edges, verseKey }: TreebankViewerProps) {
  const svgRef        = useRef<SVGSVGElement>(null);
  const containerRef  = useRef<HTMLDivElement>(null);
  const [showGlosses, setShowGlosses]    = useState(true);
  const [showTranslit, setShowTranslit]  = useState(false);
  const [showRelations, setShowRelations] = useState(true);
  const [selectedId, setSelectedId]      = useState<string | null>(null);
  const [zoomTransform, setZoomTransform] = useState<d3.ZoomTransform | null>(null);

  const chainIds = selectedId ? collectChain(selectedId, edges) : null;

  const renderTree = useCallback(() => {
    const svg = svgRef.current;
    const container = containerRef.current;
    if (!svg || !container) return;

    const root = buildHierarchy(nodes, edges);
    if (!root) return;

    // Clear previous render
    d3.select(svg).selectAll("*").remove();

    const width  = container.clientWidth  || 800;
    const height = container.clientHeight || 500;

    // Dimensions per node
    const NODE_W = 110;
    const NODE_H = 70;
    const H_GAP  = 20;
    const V_GAP  = 80;

    const hierarchy = d3.hierarchy(root);
    const treeLayout = d3.tree<HierarchyNode>()
      .nodeSize([NODE_W + H_GAP, NODE_H + V_GAP])
      .separation((a, b) => (a.parent === b.parent ? 1 : 1.2));

    treeLayout(hierarchy);

    // Centre the tree
    const allNodes = hierarchy.descendants();
    const xExtent = d3.extent(allNodes, (d) => d.x) as [number, number];
    const yExtent = d3.extent(allNodes, (d) => d.y) as [number, number];
    const treeWidth  = xExtent[1] - xExtent[0] + NODE_W + H_GAP * 2;
    const treeHeight = yExtent[1] - yExtent[0] + NODE_H + V_GAP * 2;

    const svgEl = d3.select(svg)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("aria-label", `Dependency tree for verse ${verseKey}`);

    // Zoom group
    const g = svgEl.append("g").attr("class", "treebank__g");

    // Zoom behaviour
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform.toString());
        setZoomTransform(event.transform);
      });

    svgEl.call(zoom);

    // Initial transform — centre + fit
    const initScale = Math.min(
      (width - 40)  / treeWidth,
      (height - 40) / treeHeight,
      1,
    );
    const initX = (width  - treeWidth  * initScale) / 2 - xExtent[0] * initScale + (NODE_W / 2) * initScale;
    const initY = 30;
    const initTransform = d3.zoomIdentity.translate(initX, initY).scale(initScale);
    svgEl.call(zoom.transform, initTransform);

    // ── Links ──────────────────────────────────────────────────────────────
    const link = d3.linkVertical<
      d3.HierarchyPointLink<HierarchyNode>,
      d3.HierarchyPointNode<HierarchyNode>
    >()
      .x((d) => d.x)
      .y((d) => d.y + NODE_H / 2);

    const linkGroup = g.append("g").attr("class", "treebank__links");

    linkGroup.selectAll("path")
      .data(hierarchy.links())
      .join("path")
      .attr("class", "treebank__link")
      .attr("d", (d) => {
        const sy = (d.source.y ?? 0) + NODE_H / 2;
        const ty = (d.target.y ?? 0) - NODE_H / 2;
        return link({
          source: { ...d.source, y: sy },
          target: { ...d.target, y: ty },
        } as d3.HierarchyPointLink<HierarchyNode>);
      })
      .attr("fill", "none")
      .attr("stroke", (d) => {
        if (!chainIds) return "var(--token-border-subtle)";
        const sourceId = d.source.data.id;
        const targetId = d.target.data.id;
        return chainIds.has(sourceId) && chainIds.has(targetId)
          ? "var(--token-pos-verbal)"
          : "var(--token-border-subtle)";
      })
      .attr("stroke-width", (d) => {
        if (!chainIds) return 1.5;
        const sourceId = d.source.data.id;
        const targetId = d.target.data.id;
        return chainIds.has(sourceId) && chainIds.has(targetId) ? 2.5 : 1;
      })
      .attr("opacity", (d) => {
        if (!chainIds) return 0.6;
        const sourceId = d.source.data.id;
        const targetId = d.target.data.id;
        return chainIds.has(sourceId) && chainIds.has(targetId) ? 1 : 0.25;
      });

    // Relation labels on edges
    if (showRelations) {
      // Find edge relation for each link by matching head/dep IDs
      const edgeMap = new Map<string, string>();
      for (const e of edges) edgeMap.set(`${e.headNodeId}→${e.dependentNodeId}`, e.relation);

      linkGroup.selectAll("text.treebank__rel-label")
        .data(hierarchy.links())
        .join("text")
        .attr("class", "treebank__rel-label latin")
        .attr("x", (d) => ((d.source.x ?? 0) + (d.target.x ?? 0)) / 2)
        .attr("y", (d) => ((d.source.y ?? 0) + NODE_H / 2 + (d.target.y ?? 0) - NODE_H / 2) / 2)
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .text((d) => edgeMap.get(`${d.source.data.id}→${d.target.data.id}`) ?? "")
        .attr("fill", "var(--token-text-tertiary)")
        .attr("font-size", "10px")
        .attr("opacity", (d) => {
          if (!chainIds) return 0.8;
          return chainIds.has(d.source.data.id) && chainIds.has(d.target.data.id) ? 1 : 0.2;
        });
    }

    // ── Nodes ──────────────────────────────────────────────────────────────
    const nodeGroup = g.append("g").attr("class", "treebank__nodes");

    const nodeGs = nodeGroup.selectAll("g.treebank__node")
      .data(allNodes)
      .join("g")
      .attr("class", "treebank__node")
      .attr("transform", (d) => `translate(${(d.x ?? 0) - NODE_W / 2}, ${d.y ?? 0})`)
      .attr("cursor", "pointer")
      .on("click", (_event, d) => {
        setSelectedId((prev) => (prev === d.data.id ? null : d.data.id));
      });

    // Node rect
    nodeGs.each(function (d) {
      const g2 = d3.select(this);
      const data = d.data;
      const isSelected = chainIds?.has(data.id) ?? false;

      const isTerminal  = data.nodeType === "terminal";
      const isHidden    = data.nodeType === "hidden";
      const isPhraseRoot = data.id === "__root__";

      let fill: string;
      let strokeColor: string;
      let strokeDash = "none";
      let rx = 4;

      if (isHidden) {
        fill = "transparent";
        strokeColor = "var(--token-text-tertiary)";
        strokeDash = "4 3";
        rx = 30;
      } else if (isTerminal) {
        fill = isSelected ? "color-mix(in srgb, " + posColor(data.posTag) + " 20%, transparent)" : "var(--token-surface-card)";
        strokeColor = posColor(data.posTag);
        rx = 4;
      } else {
        fill = isPhraseRoot
          ? "var(--token-surface-card)"
          : isSelected
            ? "color-mix(in srgb, " + phraseColor(data.phraseTag) + " 15%, transparent)"
            : "var(--token-surface-raised)";
        strokeColor = phraseColor(data.phraseTag);
        rx = 12;
      }

      g2.append("rect")
        .attr("width", NODE_W)
        .attr("height", NODE_H)
        .attr("rx", rx)
        .attr("ry", rx)
        .attr("fill", fill)
        .attr("stroke", strokeColor)
        .attr("stroke-width", isSelected ? 2.5 : 1.5)
        .attr("stroke-dasharray", strokeDash)
        .attr("opacity", chainIds && !chainIds.has(data.id) ? 0.35 : 1);

      // Primary label (Arabic for terminals, phrase tag for non-terminals)
      const labelY = isTerminal ? NODE_H * 0.42 : NODE_H * 0.52;
      g2.append("text")
        .attr("x", NODE_W / 2)
        .attr("y", labelY)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("class", isTerminal ? "arabic" : "latin")
        .attr("font-size", isTerminal ? "14px" : "12px")
        .attr("font-weight", isTerminal ? "normal" : "600")
        .attr("fill", isTerminal ? posColor(data.posTag) : phraseColor(data.phraseTag))
        .attr("dir", isTerminal ? "rtl" : "ltr")
        .attr("opacity", chainIds && !chainIds.has(data.id) ? 0.35 : 1)
        .text(data.label);

      // Gloss (English translation under Arabic)
      if (showGlosses && isTerminal && data.translation) {
        g2.append("text")
          .attr("x", NODE_W / 2)
          .attr("y", NODE_H * 0.72)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .attr("class", "latin")
          .attr("font-size", "9px")
          .attr("fill", "var(--token-text-secondary)")
          .attr("opacity", chainIds && !chainIds.has(data.id) ? 0.25 : 0.85)
          .text(data.translation.length > 14 ? data.translation.slice(0, 13) + "…" : data.translation);
      }

      // Transliteration
      if (showTranslit && isTerminal && data.transliteration) {
        g2.append("text")
          .attr("x", NODE_W / 2)
          .attr("y", NODE_H * 0.88)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .attr("class", "latin")
          .attr("font-size", "8px")
          .attr("fill", "var(--token-text-tertiary)")
          .attr("opacity", chainIds && !chainIds.has(data.id) ? 0.2 : 0.7)
          .text(data.transliteration.length > 16 ? data.transliteration.slice(0, 15) + "…" : data.transliteration);
      }

      // POS badge (small pill at top-right of terminal)
      if (isTerminal && data.posTag) {
        g2.append("rect")
          .attr("x", NODE_W - 28)
          .attr("y", 4)
          .attr("width", 24)
          .attr("height", 14)
          .attr("rx", 7)
          .attr("fill", posColor(data.posTag))
          .attr("opacity", chainIds && !chainIds.has(data.id) ? 0.25 : 0.15);
        g2.append("text")
          .attr("x", NODE_W - 16)
          .attr("y", 11)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .attr("class", "latin")
          .attr("font-size", "8px")
          .attr("fill", posColor(data.posTag))
          .attr("opacity", chainIds && !chainIds.has(data.id) ? 0.3 : 0.9)
          .text(data.posTag);
      }
    });
  }, [nodes, edges, showGlosses, showTranslit, showRelations, chainIds, verseKey]);

  // Re-render on data or layer toggle changes
  useEffect(() => {
    renderTree();
  }, [renderTree]);

  // Re-render on container resize
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => renderTree());
    ro.observe(el);
    return () => ro.disconnect();
  }, [renderTree]);

  return (
    <div className="treebank-viewer">
      {/* Toolbar */}
      <div className="treebank-viewer__toolbar" role="group" aria-label="Display options">
        <span className="treebank-viewer__toolbar-label latin">Show:</span>

        <button
          type="button"
          className={`treebank-toggle-btn latin${showRelations ? " treebank-toggle-btn--on" : ""}`}
          onClick={() => setShowRelations((v) => !v)}
          aria-pressed={showRelations}
        >
          Relations
        </button>

        <button
          type="button"
          className={`treebank-toggle-btn latin${showGlosses ? " treebank-toggle-btn--on" : ""}`}
          onClick={() => setShowGlosses((v) => !v)}
          aria-pressed={showGlosses}
        >
          Glosses
        </button>

        <button
          type="button"
          className={`treebank-toggle-btn latin${showTranslit ? " treebank-toggle-btn--on" : ""}`}
          onClick={() => setShowTranslit((v) => !v)}
          aria-pressed={showTranslit}
        >
          Translit.
        </button>

        {selectedId && (
          <button
            type="button"
            className="treebank-toggle-btn treebank-toggle-btn--clear latin"
            onClick={() => setSelectedId(null)}
          >
            Clear selection
          </button>
        )}

        <span className="treebank-viewer__toolbar-hint latin">
          Scroll to zoom · Drag to pan · Tap node to highlight chain
        </span>
      </div>

      {/* SVG canvas */}
      <div
        ref={containerRef}
        className="treebank-viewer__canvas"
        aria-label="Dependency tree diagram"
      >
        <svg ref={svgRef} className="treebank-viewer__svg" />
      </div>

      {/* Legend */}
      <div className="treebank-viewer__legend" aria-label="Legend">
        {[
          { color: "var(--token-pos-nominal)",  label: "Nominal" },
          { color: "var(--token-pos-verbal)",   label: "Verbal" },
          { color: "var(--token-pos-particle)", label: "Particle" },
          { color: "var(--token-text-tertiary)", label: "Phrase node" },
        ].map(({ color, label }) => (
          <span key={label} className="treebank-legend-item latin">
            <span
              className="treebank-legend-dot"
              style={{ background: color }}
              aria-hidden="true"
            />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
