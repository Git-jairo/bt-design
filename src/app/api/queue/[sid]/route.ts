import { NextResponse } from "next/server";
import twilio from "twilio";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ sid: string }> }
) {
  const { sid } = await params;
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const workspaceSid = process.env.TWILIO_WORKSPACE_SID;

  if (!accountSid || !authToken || !workspaceSid) {
    return NextResponse.json({ error: "Missing env vars" }, { status: 500 });
  }

  try {
    const client = twilio(accountSid, authToken);
    await client.taskrouter.v1
      .workspaces(workspaceSid)
      .tasks(sid)
      .update({ assignmentStatus: "canceled" });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}