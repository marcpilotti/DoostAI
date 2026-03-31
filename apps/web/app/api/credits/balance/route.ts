import { NextResponse } from "next/server";
import { getBalance } from "@/lib/credits/check";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orgId = searchParams.get("orgId") ?? "demo";

  const balance = await getBalance(orgId);
  return NextResponse.json({ balance });
}
