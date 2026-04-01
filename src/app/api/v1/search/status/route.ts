// GET /api/v1/search/status
// Reports which search engine is active and ES cluster health.

import { NextResponse } from "next/server";
import { isEsHealthy } from "@/lib/elasticsearch";
import { CORS } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  const esConfigured = Boolean(process.env.ELASTICSEARCH_URL);
  const esHealthy    = esConfigured ? await isEsHealthy() : false;

  return NextResponse.json(
    {
      data: {
        engine:       esHealthy ? "elasticsearch" : "postgres",
        elasticsearch: {
          configured: esConfigured,
          healthy:    esHealthy,
          url:        esConfigured ? process.env.ELASTICSEARCH_URL : null,
        },
      },
    },
    { status: 200, headers: CORS },
  );
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
