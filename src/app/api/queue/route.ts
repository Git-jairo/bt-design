import { NextResponse } from "next/server";
import twilio from "twilio";

export async function GET() {
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  const tasks = await client.taskrouter.v1
    .workspaces(process.env.TWILIO_WORKSPACE_SID!)
    .tasks.list({
      assignmentStatus: "pending",
      limit: 20,
    });

  const queue = tasks.map((task) => {
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
}