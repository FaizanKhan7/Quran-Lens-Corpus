/**
 * Corpus Parser — morphology.txt (kaisdukes/quranic-corpus-api format)
 * ─────────────────────────────────────────────────────────────────────────────
 * Parses the word-level morphological annotation file alongside the Uthmani
 * XML text to produce structured segment records for database seeding.
 *
 * Input files:
 *   morphology.txt   — 77,429 lines, one per word, space-separated features:
 *                        [prefix+...] POS:TAG [ROOT:xxx] [LEM:xxx] [features...]
 *   quran-uthmani.xml — Tanzil Uthmani text; provides per-verse Arabic forms
 *                        and the (surah:verse:word) location mapping.
 *   word-by-word.txt  — (optional) 77,429 English glosses, one per line.
 *
 * Output: ParseResult compatible with seed.ts (same interface as before).
 */

import * as fs from "fs";
import * as readline from "readline";
import {
  buckwalterToArabic,
  arabicToBuckwalter,
  rootBuckwalterToArabic,
  lemmaBuckwalterToArabic,
} from "./buckwalter.js";

// ─── Public types ─────────────────────────────────────────────────────────────

export interface CorpusLocation {
  surah:   number;
  verse:   number;
  word:    number;
  segment: number;
}

export interface ParsedFeatures {
  segmentType:    "PREFIX" | "STEM" | "SUFFIX";
  prefixRaw?:     string;
  suffixRaw?:     string;

  root?:          string;
  rootArabic?:    string;
  lemma?:         string;
  lemmaArabic?:   string;
  specialGroup?:  string;

  gramCase?:      "NOM" | "ACC" | "GEN";
  gramState?:     "DEF" | "INDEF";

  person?:        "1" | "2" | "3";
  gender?:        "M" | "F";
  number?:        "S" | "D" | "P";
  pgnCode?:       string;

  verbAspect?:    "PERF" | "IMPF" | "IMPV";
  verbMood?:      "IND" | "SUBJ" | "JUS";
  verbVoice?:     "ACT" | "PASS";
  verbForm?:      string;

  derivation?:    "ACT PCPL" | "PASS PCPL" | "VN";

  suffixPronoun?: string;
  vocative?:      boolean;
  emphatic?:      boolean;
}

export interface CorpusSegment {
  location:        CorpusLocation;
  wordId:          string;
  verseId:         string;
  surahId:         number;
  verseNumber:     number;
  wordPosition:    number;
  segmentPosition: number;
  formBuckwalter:  string;
  formArabic:      string;
  posTag:          string;
  features:        ParsedFeatures;
}

export interface WordGroup {
  wordId:          string;
  surahId:         number;
  verseNumber:     number;
  position:        number;
  textUthmani:     string;
  transliteration: string;
  translation:     string;
  segments:        CorpusSegment[];
}

export interface ParseResult {
  segments:     CorpusSegment[];
  wordGroups:   Map<string, WordGroup>;
  verseIds:     Set<string>;
  surahIds:     Set<number>;
  roots:        Map<string, string>;
  lemmas:       Map<string, { arabic: string; posTag: string }>;
  verseTexts:   Map<string, string>;   // verseId → full Uthmani text
  lineCount:    number;
  skippedLines: number;
}

// ─── XML location index ───────────────────────────────────────────────────────

interface WordEntry {
  surahId:      number;
  verseNumber:  number;
  wordPosition: number;
  arabicForm:   string;
}

function buildWordIndex(xmlContent: string): { words: WordEntry[]; verseTexts: Map<string, string> } {
  const words: WordEntry[] = [];
  const verseTexts = new Map<string, string>();

  // Match <sura index="N" ...> blocks
  const suraRegex = /<sura\s+index="(\d+)"[^>]*>([\s\S]*?)<\/sura>/g;
  let suraMatch: RegExpExecArray | null;

  while ((suraMatch = suraRegex.exec(xmlContent)) !== null) {
    const surahId = parseInt(suraMatch[1], 10);
    const suraBody = suraMatch[2];

    // Match <aya index="N" ... text="..." .../>
    const ayaRegex = /<aya\s+index="(\d+)"(?:[^>]*?)\s+text="([^"]*)"[^>]*\/?>/g;
    let ayaMatch: RegExpExecArray | null;

    while ((ayaMatch = ayaRegex.exec(suraBody)) !== null) {
      const verseNumber = parseInt(ayaMatch[1], 10);
      const text = ayaMatch[2].trim();
      const verseId = `${surahId}:${verseNumber}`;

      verseTexts.set(verseId, text);

      const wordForms = text.split(/\s+/).filter((w) => w.length > 0);
      wordForms.forEach((arabicForm, idx) => {
        words.push({ surahId, verseNumber, wordPosition: idx + 1, arabicForm });
      });
    }
  }

  return { words, verseTexts };
}

// ─── PGN code parser ──────────────────────────────────────────────────────────

function parsePGN(code: string): { person?: "1"|"2"|"3"; gender?: "M"|"F"; number?: "S"|"D"|"P" } {
  let rem = code;
  let person: "1"|"2"|"3" | undefined;
  let gender:  "M"|"F"    | undefined;
  let number:  "S"|"D"|"P"| undefined;

  if (rem[0] === "1" || rem[0] === "2" || rem[0] === "3") {
    person = rem[0] as "1"|"2"|"3";
    rem = rem.slice(1);
  }
  if (rem[0] === "M" || rem[0] === "F") {
    gender = rem[0] as "M"|"F";
    rem = rem.slice(1);
  }
  if (rem[0] === "S" || rem[0] === "D" || rem[0] === "P") {
    number = rem[0] as "S"|"D"|"P";
  }

  return { person, gender, number };
}

// ─── Prefix token helpers ─────────────────────────────────────────────────────

// "bi+"      → form="bi",  posTag="P"
// "Al+"      → form="Al",  posTag="DET"
// "w:CONJ+"  → form="w",   posTag="CONJ"
// "l:P+"     → form="l",   posTag="P"
// "A:INTG+"  → form="A",   posTag="INTG"

const PREFIX_KNOWN_POS: Record<string, string> = {
  bi: "P", ka: "P", l: "P", ta: "P",
  Al: "DET",
  sa: "FUT",
  ya: "VOC", ha: "VOC",
  w:  "CONJ", f: "CONJ",
  A:  "INTG",
};

function prefixForm(token: string): string {
  const withoutPlus = token.slice(0, -1);
  const colon = withoutPlus.indexOf(":");
  return colon >= 0 ? withoutPlus.slice(0, colon) : withoutPlus;
}

function prefixPosTag(token: string): string {
  const withoutPlus = token.slice(0, -1);
  const colon = withoutPlus.indexOf(":");
  if (colon >= 0) return withoutPlus.slice(colon + 1);
  const form = withoutPlus;
  return PREFIX_KNOWN_POS[form] ?? "P";
}

// ─── Stem feature parser ──────────────────────────────────────────────────────

function parseStemFeatures(tokens: string[]): ParsedFeatures {
  const f: ParsedFeatures = { segmentType: "STEM" };

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (!tok) continue;

    // Two-token derivations  (must come before standalone ACT/PASS cases)
    if (tok === "ACT" && tokens[i + 1] === "PCPL") {
      f.derivation = "ACT PCPL";
      f.verbVoice = "ACT";
      i++;
      continue;
    }
    if (tok === "PASS" && tokens[i + 1] === "PCPL") {
      f.derivation = "PASS PCPL";
      f.verbVoice = "PASS";
      i++;
      continue;
    }

    // Verb form "(I)" – "(XII)"
    if (/^\([IVX]+\)$/.test(tok)) {
      f.verbForm = tok.slice(1, -1);
      continue;
    }

    // Key:value tokens
    const colon = tok.indexOf(":");
    if (colon >= 0) {
      const key = tok.slice(0, colon);
      const val = tok.slice(colon + 1);

      switch (key) {
        case "ROOT":
          f.root = val;
          f.rootArabic = rootBuckwalterToArabic(val);
          break;
        case "LEM":
          f.lemma = val;
          f.lemmaArabic = lemmaBuckwalterToArabic(val);
          break;
        case "SP":
          f.specialGroup = val;
          break;
        case "PRON":
          // Attached suffix pronoun e.g. "PRON:3MP"
          f.suffixPronoun = val;
          break;
      }
      continue;
    }

    // Named standalone tokens
    switch (tok) {
      case "NOM":   f.gramCase = "NOM"; break;
      case "ACC":   f.gramCase = "ACC"; break;
      case "GEN":   f.gramCase = "GEN"; break;
      case "DEF":   f.gramState = "DEF"; break;
      case "INDEF": f.gramState = "INDEF"; break;
      case "PERF":  f.verbAspect = "PERF"; break;
      case "IMPF":  f.verbAspect = "IMPF"; break;
      case "IMPV":  f.verbAspect = "IMPV"; break;
      case "IND":   f.verbMood = "IND"; break;
      case "SUBJ":  f.verbMood = "SUBJ"; break;
      case "JUS":   f.verbMood = "JUS"; break;
      case "ACT":   f.verbVoice = "ACT"; break;
      case "PASS":  f.verbVoice = "PASS"; break;
      case "VN":    f.derivation = "VN"; break;
      // Single-letter PGN
      case "M": f.gender = "M"; break;
      case "F": f.gender = "F"; break;
      case "S": f.number = "S"; break;
      case "D": f.number = "D"; break;
      case "P": f.number = "P"; break;
      default: {
        // Combined PGN codes: "MS", "3MP", "2FS", "1P", "MD", etc.
        if (tok.length >= 2 && tok.length <= 3 && /^[123]?[MF]?[SDP]$/.test(tok)) {
          const pgn = parsePGN(tok);
          f.pgnCode = tok;
          if (pgn.person) f.person = pgn.person;
          if (pgn.gender) f.gender = pgn.gender;
          if (pgn.number) f.number = pgn.number;
        }
        break;
      }
    }
  }

  return f;
}

// ─── Morphology line parser ───────────────────────────────────────────────────

function parseMorphologyLine(line: string): {
  prefixTokens: string[];
  stemPosTag:   string;
  stemTokens:   string[];
  stemFeatures: ParsedFeatures;
} {
  const tokens = line.split(" ").filter((t) => t.length > 0);

  // Collect prefix tokens (end with "+") up to first POS: token
  const prefixTokens: string[] = [];
  let posIdx = -1;

  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].startsWith("POS:")) {
      posIdx = i;
      break;
    }
    if (tokens[i].endsWith("+")) {
      prefixTokens.push(tokens[i]);
    }
  }

  if (posIdx === -1) {
    return { prefixTokens, stemPosTag: "STEM", stemTokens: tokens, stemFeatures: { segmentType: "STEM" } };
  }

  const stemPosTag = tokens[posIdx].slice(4);  // "POS:N" → "N"
  const stemTokens = tokens.slice(posIdx + 1);
  const stemFeatures = parseStemFeatures(stemTokens);

  return { prefixTokens, stemPosTag, stemTokens, stemFeatures };
}

// ─── Main parse function ──────────────────────────────────────────────────────

export async function parseCorpusFile(
  morphologyPath: string,
  xmlPath:        string,
  wbwPath?:       string,
): Promise<ParseResult> {
  // ── 1. Build location index from XML ──────────────────────────────────────
  const xmlContent = fs.readFileSync(xmlPath, "utf-8");
  const { words: wordIndex, verseTexts } = buildWordIndex(xmlContent);

  // ── 2. Load word-by-word translation (optional) ───────────────────────────
  let wbwLines: string[] = [];
  if (wbwPath && fs.existsSync(wbwPath)) {
    wbwLines = fs.readFileSync(wbwPath, "utf-8").split("\n");
  }

  // ── 3. Parse morphology.txt line by line ──────────────────────────────────
  const result: ParseResult = {
    segments:     [],
    wordGroups:   new Map(),
    verseIds:     new Set(),
    surahIds:     new Set(),
    roots:        new Map(),
    lemmas:       new Map(),
    verseTexts,
    lineCount:    0,
    skippedLines: 0,
  };

  const fileStream = fs.createReadStream(morphologyPath, { encoding: "utf-8" });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let wordLineIndex = 0;  // index into wordIndex array (XML word order)

  for await (const rawLine of rl) {
    result.lineCount++;

    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    // Map to location via XML word index
    if (wordLineIndex >= wordIndex.length) {
      result.skippedLines++;
      continue;
    }

    const entry    = wordIndex[wordLineIndex];
    const wordId   = `${entry.surahId}:${entry.verseNumber}:${entry.wordPosition}`;
    const verseId  = `${entry.surahId}:${entry.verseNumber}`;
    const translation = wbwLines[wordLineIndex]?.trim() ?? "";
    wordLineIndex++;

    // Parse morphology line
    const { prefixTokens, stemPosTag, stemFeatures } = parseMorphologyLine(line);

    const arabicForm = entry.arabicForm;
    const bwForm     = arabicToBuckwalter(arabicForm);

    // Record word group
    if (!result.wordGroups.has(wordId)) {
      result.wordGroups.set(wordId, {
        wordId,
        surahId:         entry.surahId,
        verseNumber:     entry.verseNumber,
        position:        entry.wordPosition,
        textUthmani:     arabicForm,
        transliteration: "",  // not available in this format
        translation,
        segments:        [],
      });
    }
    const wg = result.wordGroups.get(wordId)!;

    result.verseIds.add(verseId);
    result.surahIds.add(entry.surahId);

    // ── Create segment records ─────────────────────────────────────────────

    let segPos = 1;

    // PREFIX segments — one per prefix token
    for (const prefixTok of prefixTokens) {
      const form    = prefixForm(prefixTok);
      const formAr  = buckwalterToArabic(form);
      const prefixFeatures: ParsedFeatures = {
        segmentType: "PREFIX",
        prefixRaw:   prefixTok,
      };
      const seg: CorpusSegment = {
        location:        { surah: entry.surahId, verse: entry.verseNumber, word: entry.wordPosition, segment: segPos },
        wordId,
        verseId,
        surahId:         entry.surahId,
        verseNumber:     entry.verseNumber,
        wordPosition:    entry.wordPosition,
        segmentPosition: segPos,
        formBuckwalter:  form,
        formArabic:      formAr,
        posTag:          prefixPosTag(prefixTok),
        features:        prefixFeatures,
      };
      result.segments.push(seg);
      wg.segments.push(seg);
      segPos++;
    }

    // STEM segment
    const stemSeg: CorpusSegment = {
      location:        { surah: entry.surahId, verse: entry.verseNumber, word: entry.wordPosition, segment: segPos },
      wordId,
      verseId,
      surahId:         entry.surahId,
      verseNumber:     entry.verseNumber,
      wordPosition:    entry.wordPosition,
      segmentPosition: segPos,
      formBuckwalter:  bwForm,
      formArabic:      arabicForm,
      posTag:          stemPosTag,
      features:        stemFeatures,
    };
    result.segments.push(stemSeg);
    wg.segments.push(stemSeg);

    // Collect roots and lemmas from stem
    if (stemFeatures.root && !result.roots.has(stemFeatures.root)) {
      result.roots.set(stemFeatures.root, stemFeatures.rootArabic ?? "");
    }
    if (stemFeatures.lemma && !result.lemmas.has(stemFeatures.lemma)) {
      result.lemmas.set(stemFeatures.lemma, {
        arabic: stemFeatures.lemmaArabic ?? "",
        posTag: stemPosTag,
      });
    }
  }

  return result;
}
