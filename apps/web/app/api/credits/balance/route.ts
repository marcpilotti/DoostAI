import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getBalance } from "@/lib/credits/check";

export async function GET(req: Request) {
  const { userId, orgId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const requestedOrgId = searchParams.get("orgId") ?? orgId ?? "demo";

  // Verify the user belongs to the organization they're querying
  if (orgId && requestedOrgId !== orgId && requestedOrgId !== "demo") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const balance = await getBalance(requestedOrgId);
  return NextResponse.json({ success: true, data: { balance } });
}
