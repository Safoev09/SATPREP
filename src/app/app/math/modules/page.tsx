import { requireStudent } from "@/lib/auth-helpers";
import { getPublishedTests } from "@/lib/test-loader";
import TestList from "@/components/TestList";

export default async function MathModulesPage() {
  const { profile } = await requireStudent();
  const tests = await getPublishedTests({ testType: "module", section: "math" });

  return (
    <TestList
      tests={tests}
      hasLifetimeAccess={profile.has_lifetime_access}
      heading="Math modules"
      intro="Standalone Math modules built by your prep team. Pick one to practise."
    />
  );
}
