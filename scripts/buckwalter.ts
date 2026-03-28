/**
 * Buckwalter ↔ Arabic Unicode Converter
 * ─────────────────────────────────────────────────────────────────────────────
 * Based on spec Appendix A and the Buckwalter transliteration standard as
 * adapted by Dukes et al. for the Quranic Arabic Corpus.
 *
 * Reference: corpus.quran.com (Appendix A of CLAUDE.md)
 */

// ─── Buckwalter → Arabic mapping ─────────────────────────────────────────────

const BW_TO_AR: Record<string, string> = {
  // Consonants
  "'": "\u0621", // ء hamza
  b: "\u0628",   // ب ba
  t: "\u062A",   // ت ta
  v: "\u062B",   // ث tha
  j: "\u062C",   // ج jim
  H: "\u062D",   // ح ha
  x: "\u062E",   // خ kha
  d: "\u062F",   // د dal
  "*": "\u0630", // ذ dhal
  r: "\u0631",   // ر ra
  z: "\u0632",   // ز zayn
  s: "\u0633",   // س sin
  $: "\u0634",   // ش shin
  S: "\u0635",   // ص sad
  D: "\u0636",   // ض dad
  T: "\u0637",   // ط ta
  Z: "\u0638",   // ظ za
  E: "\u0639",   // ع ayn
  g: "\u063A",   // غ ghayn
  f: "\u0641",   // ف fa
  q: "\u0642",   // ق qaf
  k: "\u0643",   // ك kaf
  l: "\u0644",   // ل lam
  m: "\u0645",   // م mim
  n: "\u0646",   // ن nun
  h: "\u0647",   // ه ha
  w: "\u0648",   // و waw
  y: "\u064A",   // ي ya
  // Special forms
  p: "\u0629",   // ة ta marbuta
  Y: "\u0649",   // ى alef maqsura
  A: "\u0627",   // ا alef
  "<": "\u0625", // إ alef with hamza below
  ">": "\u0623", // أ alef with hamza above
  "|": "\u0622", // آ alef with madda
  "{": "\u0671", // ٱ alef wasla (Uthmani)
  // Diacritics (harakat)
  u: "\u064F",   // ُ damma
  a: "\u064E",   // َ fatha
  i: "\u0650",   // ِ kasra
  "~": "\u0651", // ّ shadda
  o: "\u0652",   // ْ sukun
  // Tanwin
  F: "\u064B",   // ً tanwin fath
  N: "\u064C",   // ٌ tanwin damm
  K: "\u064D",   // ٍ tanwin kasr
};

// ─── Arabic → Buckwalter mapping (inverse) ───────────────────────────────────

const AR_TO_BW: Record<string, string> = Object.fromEntries(
  Object.entries(BW_TO_AR).map(([bw, ar]) => [ar, bw])
);

// ─── Converter functions ──────────────────────────────────────────────────────

/**
 * Convert a Buckwalter-encoded string to Arabic Unicode.
 * Unknown characters are passed through unchanged.
 */
export function buckwalterToArabic(bw: string): string {
  return bw
    .split("")
    .map((ch) => BW_TO_AR[ch] ?? ch)
    .join("");
}

/**
 * Convert an Arabic Unicode string to Buckwalter encoding.
 * Unknown characters are passed through unchanged.
 */
export function arabicToBuckwalter(ar: string): string {
  return ar
    .split("")
    .map((ch) => AR_TO_BW[ch] ?? ch)
    .join("");
}

/**
 * Convert a root written in Buckwalter to Arabic letters (consonants only).
 * Strips diacritics. Adds spaces between letters for display.
 * e.g. "smw" → "س م و"
 */
export function rootBuckwalterToArabic(bw: string): string {
  return bw
    .split("")
    .map((ch) => BW_TO_AR[ch] ?? ch)
    .filter((ch) => {
      const code = ch.codePointAt(0) ?? 0;
      // Keep only base Arabic consonants (U+0621–U+063A, U+0641–U+064A, U+0671)
      return (
        (code >= 0x0621 && code <= 0x063a) ||
        (code >= 0x0641 && code <= 0x064a) ||
        code === 0x0671 ||
        code === 0x0629 || // ta marbuta
        code === 0x0649    // alef maqsura
      );
    })
    .join(" ");
}

/**
 * Convert a lemma from Buckwalter to Arabic Unicode.
 * Preserves all characters including diacritics.
 * e.g. "$isom" → "شِسم" (اسم with kasra)
 */
export function lemmaBuckwalterToArabic(bw: string): string {
  return buckwalterToArabic(bw);
}
