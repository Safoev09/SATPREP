import { requireStudent } from "@/lib/auth-helpers";
import { countBySkill } from "@/lib/drill-engine";
import DrillSetup from "@/components/DrillSetup";

export default async function RWDrillsPage() {
  await requireStudent();
  const skillCounts = await countBySkill("reading_writing");
  return <DrillSetup section="reading_writing" skillCounts={skillCounts} />;
}
