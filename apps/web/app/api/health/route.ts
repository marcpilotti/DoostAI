import { db, sql } from "@doost/db";

export async function GET() {
  const checks: Record<string, "ok" | "error"> = {
    db: "error",
    redis: "error",
  };

  // Check database
  try {
    await db.execute(sql`SELECT 1`);
    checks.db = "ok";
  } catch {
    // db unreachable
  }

  // Check Redis (Upstash)
  try {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (url && token) {
      const res = await fetch(`${url}/ping`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) checks.redis = "ok";
    }
  } catch {
    // redis unreachable
  }

  const allOk = Object.values(checks).every((v) => v === "ok");

  return Response.json(
    {
      status: allOk ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev",
      checks,
    },
    { status: allOk ? 200 : 503 },
  );
}
