// ─── POS Tag Types ────────────────────────────────────────────────────────────

export type NominalTag =
  | "N"
  | "PN"
  | "ADJ"
  | "IMPN"
  | "PRON"
  | "DEM"
  | "REL"
  | "T"
  | "LOC";

export type VerbalTag = "V";

export type ParticleTag =
  | "P"
  | "EMPH"
  | "IMPV"
  | "PRP"
  | "CONJ"
  | "SUB"
  | "ACC"
  | "AMD"
  | "ANS"
  | "AVR"
  | "CAUS"
  | "CERT"
  | "CIRC"
  | "COM"
  | "COND"
  | "EQ"
  | "EXH"
  | "EXL"
  | "EXP"
  | "FUT"
  | "INC"
  | "INT"
  | "INTG"
  | "NEG"
  | "PREV"
  | "PRO"
  | "REM"
  | "RES"
  | "RET"
  | "RSLT"
  | "SUP"
  | "SUR"
  | "VOC";

export type SpecialTag = "INL";

export type POSTag = NominalTag | VerbalTag | ParticleTag | SpecialTag;

export type POSCategory = "nominal" | "verbal" | "particle" | "special";

// ─── Morphological Feature Types ─────────────────────────────────────────────

export type VerbAspect = "PERF" | "IMPF" | "IMPV";
export type VerbMood = "IND" | "SUBJ" | "JUS";
export type VerbVoice = "ACT" | "PASS";
export type VerbForm = "I" | "II" | "III" | "IV" | "V" | "VI" | "VII" | "VIII" | "IX" | "X" | "XI" | "XII";
export type DerivationType = "ACT PCPL" | "PASS PCPL" | "VN";

export type NominalCase = "NOM" | "ACC" | "GEN";
export type NominalState = "DEF" | "INDEF";

export type Person = "1" | "2" | "3";
export type Gender = "M" | "F";
export type GrammaticalNumber = "S" | "D" | "P";

export type SegmentType = "PREFIX" | "STEM" | "SUFFIX";

// ─── Corpus Location ──────────────────────────────────────────────────────────

export interface CorpusLocation {
  surah: number;
  verse: number;
  word: number;
  segment: number;
}

// ─── Morphological Segment ────────────────────────────────────────────────────

export interface MorphologicalFeatures {
  // Root & lemma
  root?: string;
  rootArabic?: string;
  lemma?: string;
  lemmaArabic?: string;
  // Nominal
  gramCase?: NominalCase;   // NOM | ACC | GEN
  gramState?: NominalState; // DEF | INDEF
  // Person / Gender / Number (shared nominals + verbs)
  person?: Person;
  gender?: Gender;
  number?: GrammaticalNumber;
  // Verbal
  verbAspect?: VerbAspect; // PERF | IMPF | IMPV
  verbMood?: VerbMood;     // IND | SUBJ | JUS
  verbVoice?: VerbVoice;   // ACT | PASS
  verbForm?: VerbForm;     // I–XII
  derivation?: DerivationType;
  // Prefix / suffix
  prefix?: string;
  suffixPronoun?: string;
  specialGroup?: string;
  segmentType?: string;
}

export interface Segment {
  position: number;
  formBuckwalter: string;
  formArabic: string;
  posTag: POSTag;
  posDescription: string;
  posArabic: string;
  type: SegmentType;
  features: MorphologicalFeatures;
}

// ─── Word ─────────────────────────────────────────────────────────────────────

export interface Root {
  lettersBuckwalter: string;
  lettersArabic: string;
  frequency: number;
}

export interface Word {
  location: string; // "surah:verse:word"
  surah: number;
  verse: number;
  position: number;
  textUthmani: string;
  transliteration: string;
  translation: string;
  audioUrl: string;
  segments: Segment[];
  root?: Root;
  syntacticRole?: string;
  syntacticDescription?: string;
  ontologyConcepts: string[];
}

// ─── Verse ────────────────────────────────────────────────────────────────────

export interface Verse {
  id: string; // "surah:verse"
  surah: number;
  verseNumber: number;
  textUthmani: string;
  textSimple: string;
  words: Word[];
}

// ─── Surah ────────────────────────────────────────────────────────────────────

export interface Surah {
  id: number;
  nameArabic: string;
  nameSimple: string;
  nameComplex: string;
  revelationPlace: "makkah" | "madinah";
  versesCount: number;
  bismillahPre: boolean;
  translatedName: string;
}

// ─── Treebank ────────────────────────────────────────────────────────────────

export type PhraseTag = "S" | "NS" | "VS" | "CS" | "PP" | "SC";

export type DependencyRelation =
  | "adj" | "poss" | "pred" | "app" | "spec" | "cpnd"
  | "subj" | "pass" | "obj" | "subjx" | "predx" | "impv" | "imrs" | "pro"
  | "gen" | "link" | "conj" | "sub" | "cond" | "rslt"
  | "circ" | "cog" | "prp" | "com"
  | "emph" | "intg" | "neg" | "fut" | "voc" | "exp" | "res" | "avr"
  | "cert" | "ret" | "prev" | "ans" | "inc" | "sur" | "sup" | "exh"
  | "exl" | "eq" | "caus" | "amd" | "int";

export interface TreebankNode {
  id: string;
  nodeType: "terminal" | "non-terminal" | "hidden";
  wordId?: string;
  phraseTag?: PhraseTag;
  label: string;
  posTag?: POSTag;
}

export interface TreebankEdge {
  id: string;
  headNodeId: string;
  dependentNodeId: string;
  relation: DependencyRelation;
}

export interface Treebank {
  verseId: string;
  isComplete: boolean;
  nodes: TreebankNode[];
  edges: TreebankEdge[];
}

// ─── Ontology ─────────────────────────────────────────────────────────────────

export interface OntologyConcept {
  id: string;
  name: string;
  parentId?: string;
  category: string;
}

// ─── Search ───────────────────────────────────────────────────────────────────

export type SearchType = "text" | "root" | "morphological";

export interface SearchResult {
  verseId: string;
  surah: number;
  verse: number;
  wordPosition?: number;
  textUthmani: string;
  matchContext: string;
}
