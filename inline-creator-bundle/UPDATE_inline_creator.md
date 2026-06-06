# SATPeaK — Inline Question Creator

You can now type questions directly into a Module Test or Full Mock Test slot,
one after another, with a "Save & Add Next" button. Optionally save each one
to the question bank for reuse, or keep it test-exclusive.

## What's in this bundle

- `src/components/InlineQuestionCreator.tsx` — NEW component (just drop in)
- `src/components/TestBuilder.tsx` — UPDATED (replaces your existing one)

Both files are patched with your actual variable names. Just extract the zip
into your project root.

## Deploy steps (3 lines)

1. Extract zip into `C:\Users\safoe\OneDrive\Desktop\satprep-app\` (overwrite when prompted)
2. `git add . && git commit -m "Inline question creator" && git push`
3. Wait for Vercel **Ready**

That's it. No SQL migration needed — uses existing `questions` and `test_questions` tables.

## How to test after deploy

1. Go to `/admin/tests` → create or edit any test
2. Pick a slot tab (e.g. "R&W Module 1")
3. Click the new green **"+ Type new question"** button (top-right of the picker pane)
4. Modal opens with: passage textarea, 4 choices with "Mark correct" radios,
   skill + difficulty dropdowns, explanation textarea, "Also save to bank" checkbox
5. Fill in the question → click **"Save & Add Next →"**
   - Question saves to DB, appears in the slot's "In this slot — in order" list
   - Form clears for next entry (skill/difficulty/checkbox setting is remembered)
6. Add a second question → click **"Save & Close"**
7. The questions appear in the slot; click "Save changes" at the bottom to persist
   the test↔question links

## Honest note about timing

The InlineQuestionCreator saves the QUESTION row to Supabase immediately when you
hit "Save & Add Next" or "Save & Close". But the QUESTION-IS-IN-THIS-SLOT link
(the `test_questions` row) is only written when you click "Save changes" at the
bottom of TestBuilder. So if you add an inline question then navigate away without
clicking "Save changes", the question itself will exist in the bank (if you ticked
the box) but won't be linked to the test.

This matches how the existing "pick from bank" flow works — picks are batched
until you save the whole test.

## Files NOT modified

- No SQL migrations
- No schema changes
- No other components touched
- Your existing question bank, drills, and other tests are unaffected
