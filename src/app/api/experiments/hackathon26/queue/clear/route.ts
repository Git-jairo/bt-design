import { NextResponse } from "next/server";
import twilio from "twilio";

// Bulk-cancel: zet alle pending tasks op "canceled" om de wachtrij leeg te maken.
// Handig om verouderde/dubbele testtasks in één keer op te ruimen.
export async function POST() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const workspaceSid = process.env.TWILIO_WORKSPACE_SID;

  if (!accountSid || !authToken || !workspaceSid) {
    return NextResponse.json({ error: "Missing env vars" }, { status: 500 });
  }

  try {
    const client = twilio(accountSid, authToken);

    const tasks = await client.taskrouter.v1
      .workspaces(workspaceSid)
      .tasks.list({ assignmentStatus: ["pending"], limit: 1000 });

    const results = await Promise.allSettled(
      tasks.map((task) =>
        client.taskrouter.v1
          .workspaces(workspaceSid)
          .tasks(task.sid)
          .update({ assignmentStatus: "canceled" })
      )
    );

    const canceled = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.length - canceled;

    return NextResponse.json({ ok: true, total: tasks.length, canceled, failed });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
