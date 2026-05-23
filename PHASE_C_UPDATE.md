# SATPrep — Phase C (Diagnostic) Update

This update adds the **diagnostic test** with full feedback, plus the movable/resizable Desmos calculator.

## What's new

✅ **24 original diagnostic questions** (12 R&W + 12 Math) — written for SATPrep, in a SQL file
✅ **Diagnostic test** — intro screen → 15-min R&W part → break → 15-min Math part → results
✅ **Diagnostic results & full feedback** — estimated SAT score (400–1600), R&W + Math section scores, skill-by-skill breakdown (Strong / Okay / Needs work), focus-areas list, strengths, and a personalized next step
✅ **Dashboard** now shows your diagnostic result and links to the breakdown
✅ **Desmos calculator** — now draggable (grab the title bar) and resizable (Size S/M/L button)
✅ **Reference sheet** — also draggable now

---

## ⚠️ TWO STEPS to install (don't skip step 2!)

### Step 1: Install the new app code (same as always)

1. Rename your current Desktop `satprep-app` folder to `satprep-app-OLD-3`.
2. Extract `satprep-app-v4.zip` to Desktop.
3. Open the extracted `satprep-app-v4` folder → cut the inner `satprep-app` folder → paste it onto the Desktop.
4. Confirm `.env.local` is present with your Supabase keys.
5. In PowerShell:
   ```
   cd "C:\Users\safoe\OneDrive\Desktop\satprep-app"
   npm install
   npm run dev
   ```

### Step 2: Load the diagnostic questions into your database

The diagnostic needs its 24 questions in Supabase. There's a file called **`diagnostic-questions.sql`** inside the project folder.

1. Open the `satprep-app` folder. Find **`diagnostic-questions.sql`**.
2. Open it (right-click → Open with → Notepad). Select all (Ctrl+A), copy (Ctrl+C).
3. Go to Supabase → **SQL Editor** → **New query**.
4. Paste, click **Run**.
5. You should see "Success" — 24 questions and 3 passages are now added.

You can confirm it worked: in the admin panel → Question Bank, filter and you'll see questions with source "Diagnostic".

---

## How to test the diagnostic

1. Log in as your **student** account.
2. On the dashboard, click the **"Take diagnostic"** link (or the "Start with a quick diagnostic" banner).
3. Read the intro → click **Start the diagnostic**.
4. **Part 1 (R&W):** 12 questions, 15-minute timer. Answer them, click **Finish Part 1**.
5. **Break screen** → click **Start Part 2: Math**.
6. **Part 2 (Math):** 12 questions, 15-minute timer. Some are type-in (student-produced response). Finish.
7. **Results screen:** estimated score, section scores, skill breakdown, focus areas, strengths, next step.
8. Go back to the dashboard — the "Diagnostic result" card now shows your score with a link to the breakdown.

---

## ⚠️ Important honesty note

The 24 diagnostic questions are **original, AI-written SAT-style questions**. They're legally yours to use. But before real students rely on them:

- **Review every question and explanation for accuracy.** AI-written questions occasionally have subtle errors.
- Ideally have an SAT tutor check them.
- You can edit any of them in the admin panel (Question Bank → filter for "Diagnostic" source → Edit).

The estimated score is a **rough approximation** from a short 24-question test — it is not an official SAT prediction. The skill breakdown is the genuinely useful part.

---

## About the official Bluebook tests

As discussed: I can't auto-import College Board's 8 official tests — that requires their PDFs and would be a copyright issue to repackage. When you're ready, the path is:
- Download the official PDFs yourself (legally, from College Board)
- Digitize them via the admin panel
- (Later) we can build an AI bulk-import tool to make that fast

---

## What's next

**Phase D:** Standalone Modules + the full adaptive SAT mock test
**Phase E:** Review queue page, Progress analytics, profile editing, payment integration

Install this, run the SQL, take the diagnostic, and tell me how the feedback feels.
