import Link from "next/link";

export default function UploadPdfPage() {
  return (
    <div className="p-10 max-w-3xl">
      <h1 className="font-display text-3xl font-semibold text-coffee-900 mb-2">
        Upload a PDF
      </h1>
      <p className="text-coffee-600 mb-8">
        Bulk-import an official College Board practice test.
      </p>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8">
        <h2 className="font-display font-semibold text-coffee-900 mb-2">
          🚧 Coming next
        </h2>
        <p className="text-sm text-coffee-700 leading-relaxed">
          AI-powered PDF extraction is the next feature on the roadmap. For now,
          add questions one by one using the form. Once you have the workflow
          down, we'll add bulk import.
        </p>
        <p className="text-sm text-coffee-700 leading-relaxed mt-3">
          When bulk import is ready, you'll upload the College Board test PDF
          and its matching answer-explanations PDF, and the system will
          auto-extract each question for your review.
        </p>
      </div>

      <h2 className="font-display font-semibold text-xl text-coffee-900 mb-4">
        Suggested workflow for now
      </h2>
      <ol className="space-y-3 text-sm text-coffee-700">
        <li className="flex gap-3">
          <span className="font-display font-semibold text-coffee-900">1.</span>
          <span>
            Download the official PDF from{" "}
            <a
              href="https://satsuite.collegeboard.org/practice/practice-tests/paper"
              target="_blank"
              rel="noopener noreferrer"
              className="text-coffee-700 underline hover:text-coffee-900"
            >
              College Board's practice test page
            </a>
            .
          </span>
        </li>
        <li className="flex gap-3">
          <span className="font-display font-semibold text-coffee-900">2.</span>
          <span>
            Open the PDF side-by-side with the answer-explanations PDF.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="font-display font-semibold text-coffee-900">3.</span>
          <span>
            For each question, click <strong>Add Question</strong> and fill in
            the form. Copy-paste from the PDF — selectable text makes this
            quick.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="font-display font-semibold text-coffee-900">4.</span>
          <span>
            Tag with the correct skill and difficulty, paste the
            College Board explanation, and publish.
          </span>
        </li>
      </ol>

      <div className="mt-8 flex gap-3">
        <Link
          href="/admin/questions/new"
          className="bg-coffee-800 hover:bg-coffee-900 text-cream-50 px-6 py-2.5 rounded-full text-sm font-medium transition"
        >
          + Add a question manually
        </Link>
        <Link
          href="/admin"
          className="px-6 py-2.5 rounded-full text-sm font-medium text-coffee-700 hover:bg-cream-100"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
