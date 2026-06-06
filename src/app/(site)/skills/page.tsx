import { Suspense } from "react";
import { SkillsClient } from "./SkillsClient";

export const metadata = { title: "Skills — BudgetThuis.Design" };

export default function SkillsPage() {
  return (
    <Suspense>
      <SkillsClient />
    </Suspense>
  );
}
