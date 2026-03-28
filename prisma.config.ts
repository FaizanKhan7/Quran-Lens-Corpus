import { defineConfig } from "prisma/config";

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL ?? "postgresql://quran:quran_dev@localhost:5432/quran_lens",
  },
});
