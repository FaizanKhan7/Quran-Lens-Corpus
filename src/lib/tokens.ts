/**
 * TOKEN REFERENCE — TypeScript mirror of the CSS design token system.
 *
 * Use these constants anywhere you need tokens in JS/TS:
 *   - D3/SVG treebank rendering
 *   - Inline styles
 *   - JS-driven animations
 *   - Storybook / test fixtures
 *
 * The values here must stay in sync with:
 *   src/styles/tokens/_primitive.css
 *   src/styles/tokens/_semantic.css
 *   src/styles/tokens/_component.css
 *
 * For CSS/Tailwind usage, reference CSS custom properties directly.
 */

import type { POSCategory, POSTag } from "@/types/corpus";

// ─── CSS Variable References ──────────────────────────────────────────────────
// For use in inline style={{ color: cssVar("--token-pos-nominal") }}

export function cssVar(name: string): string {
  return `var(${name})`;
}

// ─── Primitive Color Palette ──────────────────────────────────────────────────

export const primitive = {
  color: {
    neutral: {
      0: "#ffffff",
      50: "#f8f9fa",
      100: "#f1f3f5",
      200: "#e9ecef",
      300: "#dee2e6",
      400: "#ced4da",
      500: "#adb5bd",
      600: "#6c757d",
      700: "#495057",
      800: "#343a40",
      900: "#212529",
      950: "#0a0a0a",
    },
    green: {
      50: "#f1f8e9",
      100: "#dcedc8",
      200: "#c5e1a5",
      300: "#a5d6a7",
      400: "#81c784",
      500: "#66bb6a",
      600: "#4caf50",
      700: "#388e3c",
      800: "#2e7d32",
      900: "#1b5e20",
    },
    blue: {
      50: "#e3f2fd",
      100: "#bbdefb",
      200: "#90caf9",
      300: "#64b5f6",
      400: "#42a5f5",
      500: "#2196f3",
      600: "#1e88e5",
      700: "#1976d2",
      800: "#1565c0",
      900: "#0d47a1",
    },
    red: {
      50: "#ffebee",
      100: "#ffcdd2",
      200: "#ef9a9a",
      300: "#e57373",
      400: "#ef5350",
      500: "#f44336",
      600: "#e53935",
      700: "#d32f2f",
      800: "#c62828",
      900: "#b71c1c",
    },
    purple: {
      50: "#f3e5f5",
      100: "#e1bee7",
      200: "#ce93d8",
      300: "#ba68c8",
      400: "#ab47bc",
      500: "#9c27b0",
      600: "#8e24aa",
      700: "#7b1fa2",
      800: "#6a1b9a",
      900: "#4a148c",
    },
    slate: {
      50: "#eceff1",
      100: "#cfd8dc",
      200: "#b0bec5",
      300: "#90a4ae",
      400: "#78909c",
      500: "#607d8b",
      600: "#546e7a",
      700: "#455a64",
      800: "#37474f",
      900: "#263238",
    },
    gray: {
      100: "#f8f9fa",
      200: "#e2e8f0",
      300: "#cbd5e0",
      400: "#a0aec0",
      500: "#718096",
      600: "#4a5568",
      700: "#2d3748",
      800: "#1a202c",
      900: "#141414",
    },
  },
  space: {
    1: "0.0625rem",
    2: "0.125rem",
    4: "0.25rem",
    6: "0.375rem",
    8: "0.5rem",
    12: "0.75rem",
    16: "1rem",
    24: "1.5rem",
    32: "2rem",
    48: "3rem",
    64: "4rem",
    96: "6rem",
  },
  radius: {
    2: "0.125rem",
    4: "0.25rem",
    8: "0.5rem",
    12: "0.75rem",
    16: "1rem",
    full: "9999px",
  },
  duration: {
    fast: 100,
    base: 150,
    slow: 200,
    slower: 300,
  },
} as const;

// ─── Semantic Token Map ───────────────────────────────────────────────────────
// Light mode values. For dark mode, check the CSS layer — JS usually doesn't need it.

export const tokens = {
  surface: {
    base:    primitive.color.neutral[0],
    raised:  primitive.color.neutral[50],
    overlay: primitive.color.neutral[100],
    sunken:  primitive.color.neutral[200],
    inverse: primitive.color.neutral[950],
  },
  text: {
    primary:   primitive.color.neutral[950],
    secondary: primitive.color.gray[600],
    tertiary:  primitive.color.gray[500],
    disabled:  primitive.color.gray[400],
    inverse:   primitive.color.neutral[0],
  },
  border: {
    subtle: primitive.color.neutral[200],
    base:   primitive.color.gray[200],
    strong: primitive.color.gray[300],
  },
  pos: {
    nominal:  { color: primitive.color.green[800],  bg: primitive.color.green[50] },
    verbal:   { color: primitive.color.blue[800],   bg: primitive.color.blue[50] },
    particle: { color: primitive.color.red[800],    bg: primitive.color.red[50] },
    special:  { color: primitive.color.purple[800], bg: primitive.color.purple[50] },
    phrase:   { color: primitive.color.slate[700],  bg: primitive.color.slate[50] },
    hidden:   { color: primitive.color.gray[500],   bg: primitive.color.gray[100] },
  },
  space: {
    verseGap:    primitive.space[24],
    wordGap:     primitive.space[8],
    cardPadding: primitive.space[16],
    sectionGap:  primitive.space[32],
    touchMin:    primitive.space[48],
  },
  layout: {
    maxContent: "60rem",
    maxProse:   "42rem",
    maxNarrow:  "28rem",
  },
} as const;

// ─── POS Category Resolver ────────────────────────────────────────────────────

const NOMINAL_TAGS = new Set<POSTag>([
  "N", "PN", "ADJ", "IMPN", "PRON", "DEM", "REL", "T", "LOC",
]);

const VERBAL_TAGS = new Set<POSTag>(["V"]);

const SPECIAL_TAGS = new Set<POSTag>(["INL"]);

export function getPOSCategory(tag: POSTag): POSCategory {
  if (NOMINAL_TAGS.has(tag)) return "nominal";
  if (VERBAL_TAGS.has(tag)) return "verbal";
  if (SPECIAL_TAGS.has(tag)) return "special";
  return "particle";
}

// ─── POS Display Metadata ─────────────────────────────────────────────────────

export interface POSMeta {
  category: POSCategory;
  label: string;
  description: string;
  descriptionArabic: string;
}

export const POS_META: Record<POSTag, POSMeta> = {
  // Nominals
  N:    { category: "nominal",  label: "N",    description: "Noun",                      descriptionArabic: "اسم" },
  PN:   { category: "nominal",  label: "PN",   description: "Proper Noun",               descriptionArabic: "اسم علم" },
  ADJ:  { category: "nominal",  label: "ADJ",  description: "Adjective",                 descriptionArabic: "صفة" },
  IMPN: { category: "nominal",  label: "IMPN", description: "Imperative Verbal Noun",    descriptionArabic: "اسم فعل أمر" },
  PRON: { category: "nominal",  label: "PRN",  description: "Personal Pronoun",          descriptionArabic: "ضمير" },
  DEM:  { category: "nominal",  label: "DEM",  description: "Demonstrative Pronoun",     descriptionArabic: "اسم إشارة" },
  REL:  { category: "nominal",  label: "REL",  description: "Relative Pronoun",          descriptionArabic: "اسم موصول" },
  T:    { category: "nominal",  label: "T",    description: "Time Adverb",               descriptionArabic: "ظرف زمان" },
  LOC:  { category: "nominal",  label: "LOC",  description: "Location Adverb",           descriptionArabic: "ظرف مكان" },
  // Verbal
  V:    { category: "verbal",   label: "V",    description: "Verb",                      descriptionArabic: "فعل" },
  // Particles
  P:    { category: "particle", label: "P",    description: "Preposition",               descriptionArabic: "حرف جر" },
  EMPH: { category: "particle", label: "EMPH", description: "Emphatic lām",              descriptionArabic: "لام التوكيد" },
  IMPV: { category: "particle", label: "IMPV", description: "Imperative lām",            descriptionArabic: "لام الأمر" },
  PRP:  { category: "particle", label: "PRP",  description: "Purpose lām",               descriptionArabic: "لام التعليل" },
  CONJ: { category: "particle", label: "CONJ", description: "Coordinating Conjunction",  descriptionArabic: "حرف عطف" },
  SUB:  { category: "particle", label: "SUB",  description: "Subordinating Conjunction", descriptionArabic: "حرف مصدري" },
  ACC:  { category: "particle", label: "ACC",  description: "Accusative Particle",       descriptionArabic: "حرف نصب" },
  AMD:  { category: "particle", label: "AMD",  description: "Amendment",                 descriptionArabic: "استدراك" },
  ANS:  { category: "particle", label: "ANS",  description: "Answer",                    descriptionArabic: "جواب" },
  AVR:  { category: "particle", label: "AVR",  description: "Aversion",                  descriptionArabic: "ردع" },
  CAUS: { category: "particle", label: "CAUS", description: "Cause",                     descriptionArabic: "تعليل" },
  CERT: { category: "particle", label: "CERT", description: "Certainty",                 descriptionArabic: "توكيد" },
  CIRC: { category: "particle", label: "CIRC", description: "Circumstantial",            descriptionArabic: "حال" },
  COM:  { category: "particle", label: "COM",  description: "Comitative",                descriptionArabic: "معية" },
  COND: { category: "particle", label: "COND", description: "Conditional",               descriptionArabic: "شرط" },
  EQ:   { category: "particle", label: "EQ",   description: "Equalization",              descriptionArabic: "تسوية" },
  EXH:  { category: "particle", label: "EXH",  description: "Exhortation",               descriptionArabic: "تحضيض" },
  EXL:  { category: "particle", label: "EXL",  description: "Explanation",               descriptionArabic: "تفسير" },
  EXP:  { category: "particle", label: "EXP",  description: "Exceptive",                 descriptionArabic: "استثناء" },
  FUT:  { category: "particle", label: "FUT",  description: "Future",                    descriptionArabic: "استقبال" },
  INC:  { category: "particle", label: "INC",  description: "Inceptive",                 descriptionArabic: "ابتداء" },
  INT:  { category: "particle", label: "INT",  description: "Interpretation",            descriptionArabic: "تفسير" },
  INTG: { category: "particle", label: "INTG", description: "Interrogative",             descriptionArabic: "استفهام" },
  NEG:  { category: "particle", label: "NEG",  description: "Negative",                  descriptionArabic: "نفي" },
  PREV: { category: "particle", label: "PREV", description: "Preventive",                descriptionArabic: "كاف" },
  PRO:  { category: "particle", label: "PRO",  description: "Prohibition",               descriptionArabic: "نهي" },
  REM:  { category: "particle", label: "REM",  description: "Resumption",                descriptionArabic: "استئناف" },
  RES:  { category: "particle", label: "RES",  description: "Restriction",               descriptionArabic: "حصر" },
  RET:  { category: "particle", label: "RET",  description: "Retraction",                descriptionArabic: "إضراب" },
  RSLT: { category: "particle", label: "RSLT", description: "Result",                    descriptionArabic: "نتيجة" },
  SUP:  { category: "particle", label: "SUP",  description: "Supplemental",              descriptionArabic: "زيادة" },
  SUR:  { category: "particle", label: "SUR",  description: "Surprise",                  descriptionArabic: "تعجب" },
  VOC:  { category: "particle", label: "VOC",  description: "Vocative",                  descriptionArabic: "نداء" },
  // Special
  INL:  { category: "special",  label: "INL",  description: "Quranic Initial",           descriptionArabic: "حروف مقطعة" },
} as const;

// ─── Component Tokens (for D3 / canvas rendering) ─────────────────────────────

export const componentTokens = {
  wordCard: {
    padding:    primitive.space[16],
    radius:     primitive.radius[8],
  },
  treebank: {
    nodeSize:   primitive.space[48],
    edgeWidth:  1.5,
  },
  search: {
    height:     primitive.space[48],
  },
  bottomNav: {
    height:     "3.5rem",
  },
} as const;
