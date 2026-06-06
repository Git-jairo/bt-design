import { NextResponse } from "next/server";
import twilio from "twilio";

export async function GET() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const workspaceSid = process.env.TWILIO_WORKSPACE_SID;

  if (!accountSid || !authToken || !workspaceSid) {
    return NextResponse.json(
      { error: "Missing env vars", accountSid: !!accountSid, authToken: !!authToken, workspaceSid: !!workspaceSid },
      { status: 500 }
    );
  }

  try {
    const client = twilio(accountSid, authToken);

    const tasks = await client.taskrouter.v1
      .workspaces(workspaceSid)
      .tasks.list({
        assignmentStatus: ["pending"],
        limit: 20,
      });

    // Call-statussen waarbij de beller nog daadwerkelijk in de lijn zit.
    const ACTIVE_CALL = new Set(["queued", "ringing", "in-progress"]);

    // Koppel elke task aan z'n originele call (call_sid in attributes) en bepaal of
    // de beller nog live is. Calls die niet meer actief zijn = opgehangen.
    const enriched = await Promise.all(
      tasks.map(async (task) => {
        const attrs = JSON.parse(task.attributes);
        const callSid: string | undefined = attrs.call_sid;
        let live = true;
        if (callSid) {
          try {
            const call = await client.calls(callSid).fetch();
            live = ACTIVE_CALL.has(call.status);
          } catch {
            // Call niet op te halen → task laten staan, niet onterecht cancelen.
            live = true;
          }
        }
        return { task, attrs, live };
      })
    );

    // Opgehangen calls automatisch uit de wachtrij cancelen.
    await Promise.allSettled(
      enriched
        .filter((e) => !e.live)
        .map((e) =>
          client.taskrouter.v1
            .workspaces(workspaceSid)
            .tasks(e.task.sid)
            .update({ assignmentStatus: "canceled" })
        )
    );

    const queue = enriched
      .filter((e) => e.live)
      .map(({ task, attrs }) => ({
        id: task.sid,
        name: attrs.customerName ?? "Onbekend",
        phone: attrs.from ?? "",
        segment: attrs.segment ?? "Onbekend",
        customerValueScore: attrs.customerValueScore ?? 30,
        waitSeconds: task.age,
        reason: attrs.reason ?? "Onbekend",
        priority: task.priority,
        tag: attrs.tag ?? null,
        firstName: attrs.firstName ?? null,
        lastName: attrs.lastName ?? null,
        // Verrijkte velden uit customers.json (via Function attributes)
        customerId: attrs.customerId ?? null,
        customerNumber: attrs.customerNumber ?? null,
        email: attrs.email ?? null,
        churnRiskScore: attrs.churnRiskScore ?? 0,
        churnSegment: attrs.churnSegment ?? null,
        propensityScore: attrs.propensityScore ?? 0,
        propensitySegment: attrs.propensitySegment ?? null,
        products: attrs.products ?? null,
        numProducts: attrs.numProducts ?? 1,
        isMultiUtility: attrs.isMultiUtility ?? false,
        tariffType: attrs.tariffType ?? null,
        tenureMonths: attrs.tenureMonths ?? 0,
        contractEnding90d: attrs.contractEnding90d ?? false,
        actions: attrs.actions ?? [],
      }));

    return NextResponse.json(queue);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}