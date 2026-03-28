/**
 * Download Corpus Script
 * ─────────────────────────────────────────────────────────────────────────────
 * Downloads the three corpus data files from kaisdukes/quranic-corpus-api:
 *   morphology.txt      — word-level morphological annotation (77,429 words)
 *   quran-uthmani.xml   — Tanzil Uthmani text (word locations + Arabic forms)
 *   word-by-word.txt    — English word-by-word translation (77,429 glosses)
 *
 * Files are saved to: data/corpus/
 *
 * Usage:  npm run corpus:download
 */

import * as https from "https";
import * as fs from "fs";
import * as path from "path";
import { pipeline } from "stream/promises";
import { createWriteStream } from "fs";

const CORPUS_DIR = path.join(process.cwd(), "data", "corpus");

const BASE_URL =
  "https://raw.githubusercontent.com/kaisdukes/quranic-corpus-api/main/src/main/resources/data";

const FILES = [
  { url: `${BASE_URL}/morphology.txt`,               dest: "morphology.txt" },
  { url: `${BASE_URL}/quran-uthmani.xml`,             dest: "quran-uthmani.xml" },
  { url: `${BASE_URL}/translation/word-by-word.txt`,  dest: "word-by-word.txt" },
];

function downloadFile(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(destPath);

    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        file.close();
        fs.unlinkSync(destPath);
        reject(new Error(`HTTP ${res.statusCode} from ${url}`));
        return;
      }

      const total = parseInt(res.headers["content-length"] ?? "0", 10);
      let downloaded = 0;
      let lastPct = -1;

      res.on("data", (chunk: Buffer) => {
        downloaded += chunk.length;
        if (total > 0) {
          const pct = Math.floor((downloaded / total) * 100);
          if (pct !== lastPct && pct % 20 === 0) {
            process.stdout.write(`\r    ${pct}%`);
            lastPct = pct;
          }
        }
      });

      pipeline(res, file)
        .then(() => { process.stdout.write("\r    100%\n"); resolve(); })
        .catch(reject);
    }).on("error", reject);
  });
}

async function main() {
  console.log("\n=== Quran Corpus — Download ===\n");
  fs.mkdirSync(CORPUS_DIR, { recursive: true });

  for (const { url, dest } of FILES) {
    const destPath = path.join(CORPUS_DIR, dest);

    if (fs.existsSync(destPath)) {
      const { size } = fs.statSync(destPath);
      console.log(`✓ ${dest} already present (${(size / 1024).toFixed(0)} KB) — skipping.`);
      continue;
    }

    console.log(`Downloading ${dest}...`);
    try {
      await downloadFile(url, destPath);
      const { size } = fs.statSync(destPath);
      console.log(`✓ ${dest} saved (${(size / 1024).toFixed(0)} KB)`);
    } catch (err) {
      console.error(`✗ Failed to download ${dest}: ${(err as Error).message}`);
      process.exit(1);
    }
  }

  console.log("\n✓ All corpus files ready in data/corpus/\n");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
