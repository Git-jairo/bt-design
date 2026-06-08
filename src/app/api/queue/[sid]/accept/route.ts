import { NextResponse } from "next/server";
import twilio from "twilio";

// POST /api/queue/[sid]/accept
// Haalt de call_sid uit de task-attributes en redirect de live call naar stille
// TwiML (connected-Function), zodat de wachtmuziek stopt en het lijkt alsof de
// beller is doorverbonden met de agent.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ sid: string }> }
) {
  const { sid } = await params;
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const workspaceSid = process.env.TWILIO_WORKSPACE_SID;
  const connectedUrl = process.env.TWILIO_CONNECTED_URL;

  if (!accountSid || !authToken || !workspaceSid) {
    return NextResponse.json({ error: "Missing env vars" }, { status: 500 });
  }
  if (!connectedUrl) {
    return NextResponse.json(
      { error: "TWILIO_CONNECTED_URL niet ingesteld" },
      { status: 500 }
    );
  }

  try {
    const client = twilio(accountSid, authToken);

    // call_sid zit in de task-attributes
    const task = await client.taskrouter.v1
      .workspaces(workspaceSid)
      .tasks(sid)
      .fetch();
    const attrs = JSON.parse(task.attributes);
    const callSid: string | undefined = attrs.call_sid;

    if (!callSid) {
      return NextResponse.json({ error: "Geen call_sid in task" }, { status: 404 });
    }

    // Redirect de live call naar de connected-TwiML → muziek stopt
    await client.calls(callSid).update({ url: connectedUrl, method: "POST" });

    // Markeer de task als geaccepteerd (verdwijnt uit pending-wachtrij)
    await client.taskrouter.v1
      .workspaces(workspaceSid)
      .tasks(sid)
      .update({ assignmentStatus: "wrapping" });

    return NextResponse.json({ ok: true, callSid });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
