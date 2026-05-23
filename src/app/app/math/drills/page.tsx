import { requireStudent } from "@/lib/auth-helpers";
import { countBySkill } from "@/lib/drill-engine";
import DrillSetup from "@/components/DrillSetup";

export default async function MathDrillsPage() {
  await requireStudent();
  const skillCounts = await countBySkill("math");
  return <DrillSetup section="math" skillCounts={skillCounts} />;
}
