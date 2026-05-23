import { requireStudent } from "@/lib/auth-helpers";
import { getPublishedTests } from "@/lib/test-loader";
import TestList from "@/components/TestList";

export default async function RWModulesPage() {
  const { profile } = await requireStudent();
  const tests = await getPublishedTests({ testType: "module", section: "reading_writing" });

  return (
    <TestList
      tests={tests}
      hasLifetimeAccess={profile.has_lifetime_access}
      heading="Reading & Writing modules"
      intro="Standalone R&W modules built by your prep team. Pick one to practise."
    />
  );
}
