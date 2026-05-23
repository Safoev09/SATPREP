import { requireStudent } from "@/lib/auth-helpers";
import { getPublishedTests } from "@/lib/test-loader";
import TestList from "@/components/TestList";

export default async function FullTestPage() {
  const { profile } = await requireStudent();
  const tests = await getPublishedTests({ testType: "full" });

  return (
    <TestList
      tests={tests}
      hasLifetimeAccess={profile.has_lifetime_access}
      heading="Full SAT mock tests"
      intro="Complete, real-structure SAT mock tests. Pick one to begin — set aside about 2 hours 14 minutes."
    />
  );
}
