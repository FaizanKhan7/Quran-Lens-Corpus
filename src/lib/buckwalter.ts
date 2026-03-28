/**
 * Buckwalter ↔ Arabic Unicode — source-side copy for use in src/ (API routes, components).
 * Original lives in scripts/buckwalter.ts for the corpus pipeline.
 * Both must be kept in sync if changes are made.
 */

const BW_TO_AR: Record<string, string> = {
  "'": "\u0621", b: "\u0628", t: "\u062A", v: "\u062B", j: "\u062C",
  H: "\u062D", x: "\u062E", d: "\u062F", "*": "\u0630", r: "\u0631",
  z: "\u0632", s: "\u0633", $: "\u0634", S: "\u0635", D: "\u0636",
  T: "\u0637", Z: "\u0638", E: "\u0639", g: "\u063A", f: "\u0641",
  q: "\u0642", k: "\u0643", l: "\u0644", m: "\u0645", n: "\u0646",
  h: "\u0647", w: "\u0648", y: "\u064A",
  p: "\u0629", Y: "\u0649", A: "\u0627",
  "<": "\u0625", ">": "\u0623", "|": "\u0622", "{": "\u0671",
  u: "\u064F", a: "\u064E", i: "\u0650", "~": "\u0651",
  o: "\u0652", F: "\u064B", N: "\u064C", K: "\u064D",
};

const AR_TO_BW: Record<string, string> = Object.fromEntries(
  Object.entries(BW_TO_AR).map(([bw, ar]) => [ar, bw]),
);

export function buckwalterToArabic(bw: string): string {
  return bw.split("").map((c) => BW_TO_AR[c] ?? c).join("");
}

export function arabicToBuckwalter(ar: string): string {
  return ar.split("").map((c) => AR_TO_BW[c] ?? c).join("");
}
