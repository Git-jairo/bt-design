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

    // Filter system/agent-leg tasks (prio 0, zonder klant-attributes) uit de wachtrij
    const queue = tasks
      .filter((task) => task.priority > 0)
      .map((task) => {
      const attrs = JSON.parse(task.attributes);
      return {
        id: task.sid,
        name: attrs.customerName ?? "Onbekend",
        phone: attrs.from ?? "",
        segment: attrs.segment ?? "Onbekend",
        customerValueScore: attrs.customerValueScore ?? 30,
        waitSeconds: task.age,
        reason: attrs.reason ?? "Onbekend",
        priority: task.priority,
      };
    });

    return NextResponse.json(queue);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}