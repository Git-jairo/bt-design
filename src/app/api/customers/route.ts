import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";

interface CustomerRecord {
  customerId: string;
  customerNumber: string | null;
  phone: string;
  name: string;
  firstName: string;
  lastName: string;
  segment: string;
  tag: string | null;
  customerValueScore: number;
  priority: number;
  products: { energy: boolean; mobile: boolean; internet: boolean } | null;
  actions: { type: string; label: string }[];
}

function getDb() {
  const p = join(process.cwd(), "data", "customers.json");
  return JSON.parse(readFileSync(p, "utf8")) as { byPhone: Record<string, CustomerRecord> };
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.toLowerCase().trim() ?? "";

  try {
    const db = getDb();
    const all = Object.values(db.byPhone) as CustomerRecord[];

    const results = q.length < 2
      ? []
      : all
          .filter((c) =>
            c.name.toLowerCase().includes(q) ||
            c.firstName?.toLowerCase().includes(q) ||
            c.lastName?.toLowerCase().includes(q) ||
            c.phone.includes(q)
          )
          .slice(0, 20)
          .map((c) => ({
            phone: c.phone,
            name: c.name,
            firstName: c.firstName,
            lastName: c.lastName,
            segment: c.segment,
            tag: c.tag,
            customerValueScore: c.customerValueScore,
            products: c.products,
            actions: c.actions,
          }));

    return NextResponse.json(results);
  } catch {
    return NextResponse.json({ error: "customers.json niet gevonden" }, { status: 500 });
  }
}
