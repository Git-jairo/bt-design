import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import twilio from "twilio";

function getDb() {
  const p = join(process.cwd(), "data", "customers.json");
  return JSON.parse(readFileSync(p, "utf8")) as { byPhone: Record<string, Record<string, unknown>> };
}

export async function POST(req: NextRequest) {
  const { phone } = await req.json();

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const workspaceSid = process.env.TWILIO_WORKSPACE_SID;
  const workflowSid = process.env.TWILIO_WORKFLOW_SID;

  if (!accountSid || !authToken || !workspaceSid || !workflowSid) {
    return NextResponse.json({ error: "Missing env vars" }, { status: 500 });
  }

  try {
    const db = getDb();
    const c = db.byPhone[phone];
    if (!c) return NextResponse.json({ error: "Klant niet gevonden" }, { status: 404 });

    const client = twilio(accountSid, authToken);

    const task = await client.taskrouter.v1
      .workspaces(workspaceSid)
      .tasks.create({
        attributes: JSON.stringify({
          from: phone,
          call_sid: `SIM_${Date.now()}`,
          customerName: c.name,
          firstName: c.firstName,
          lastName: c.lastName,
          segment: c.segment,
          tag: c.tag,
          customerValueScore: c.customerValueScore,
          reason: "Gesimuleerde inkomende call",
          customerId: c.customerId,
          customerNumber: c.customerNumber,
          email: c.email,
          churnRiskScore: c.churnRiskScore,
          churnSegment: c.churnSegment,
          propensityScore: c.propensityScore,
          propensitySegment: c.propensitySegment,
          products: c.products,
          numProducts: c.numProducts,
          isMultiUtility: c.isMultiUtility,
          tariffType: c.tariffType,
          tenureMonths: c.tenureMonths,
          contractEnding90d: c.contractEnding90d,
          actions: c.actions,
        }),
        workflowSid,
        priority: c.priority as number,
        taskChannel: "voice",
      });

    return NextResponse.json({ ok: true, taskSid: task.sid });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
