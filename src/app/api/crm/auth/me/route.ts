import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth-telegram";

/** GET /api/crm/auth/me — Return current agent info */
export async function GET(req: NextRequest) {
  const agent = await authenticateRequest(req);
  if (!agent) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    id: agent.id,
    name: agent.name,
    role: agent.role,
  });
}
