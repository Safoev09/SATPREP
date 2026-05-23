# SATPrep — Phase B Update

This update adds the **core practice experience**: drill setup, the Bluebook-style question screen, and the results/review screen. This is the most important phase — it's the actual studying.

## What's new

✅ **Drill setup** — for both Math and R&W. Pick a skill, choose count / difficulty / practice-vs-test mode / time limit / skip-correct.
✅ **The practice screen** — Bluebook-inspired:
  - Question, choices, passage (R&W), LaTeX math, images
  - Always-visible **timer** (can be hidden)
  - **Question navigator** — jump between questions, see which are answered/marked
  - **Strikethrough** — eliminate answer choices
  - **Mark for review** flag
  - **Save for later** bookmark
  - **Desmos calculator** (Math) — the real one, embedded
  - **Formula reference sheet** (Math)
  - **Passage highlighter** (R&W) — drag to highlight
  - **Practice mode**: instant feedback + explanation after each question
  - **Test mode**: no feedback until the end
✅ **Results screen** — score, accuracy, time + a full question-by-question review with explanations, bookmark, and share buttons.

---

## ⚠️ IMPORTANT: You need questions in the database

The practice screen pulls real questions from your question bank. Right now you only have **1 question** (the Tom Sawyer one).

**Before testing drills properly, add several questions** in the admin panel — ideally 5+ in the same skill (e.g. 5 "Words in Context" questions), so a drill has enough to run.

If a skill has 0 questions, the drill setup shows "0 questions available" and won't start — that's expected.

---

## How to install (same as before)

### Step 1: Backup
In File Explorer → Desktop, rename your current `satprep-app` folder to `satprep-app-OLD-2`.

### Step 2: Extract the new zip
1. Find `satprep-app-v3.zip` in Downloads.
2. Right-click → **Extract All** → extract to Desktop.
3. Open the extracted `satprep-app-v3` folder, and inside, **cut** the `satprep-app` folder and **paste** it directly onto your Desktop.

### Step 3: Check .env.local
Open the new `satprep-app` folder. Confirm `.env.local` exists with your Supabase URL and key. (Turn on "Hidden items" in File Explorer's View menu if you can't see it.)

### Step 4: Install + run
In PowerShell:
```
cd "C:\Users\safoe\OneDrive\Desktop\satprep-app"
npm install
npm run dev
```
Wait for "Ready", then open http://localhost:3000.

---

## How to test Phase B

1. **First, add questions.** Log in as admin → Add Question. Add at least 5 questions in one R&W skill (e.g. "Transitions") and 5 in one Math skill (e.g. "Linear equations in 1 variable"). Make sure to check **Publish** on each.

2. **Log out**, log back in as your **student** account.

3. On the dashboard, click **"Reading & Writing drills"** (or use the sidebar).

4. **Drill setup:**
   - Pick a skill that has questions
   - Choose 5 questions, Mixed difficulty, Practice mode, Untimed
   - Click **Start drill**

5. **The practice screen:**
   - Answer a question, click **Check answer** — see if you're right + the explanation
   - Try **eliminating** a choice with the ✕ button
   - Try **Mark for review** and **Save for later**
   - Click the **Question navigator** at the bottom
   - For Math drills: open the **Calculator** and **Reference** sheet
   - For R&W drills: turn on the **Highlighter** and drag across the passage
   - Click **Next** through all questions, then **Finish drill**

6. **Results screen:**
   - See your score and accuracy
   - Expand each question to review the explanation
   - Try the **Save for later** and **Share to community** buttons

---

## Known limitations (by design, for now)

- **Adaptive difficulty** in drills currently just pulls mixed difficulty — true adaptive logic comes later
- **Share to community** shows a "Phase 2" message — the community feature isn't built yet
- **Calculator** loads from Desmos's servers, so it needs internet (you have it — just so you know)
- The **diagnostic, modules, full test, review queue, progress** pages are still "Coming soon" — those are Phases C, D, E

---

## What's next

**Phase C:** Diagnostic test + standalone Modules
**Phase D:** Full adaptive SAT mock test
**Phase E:** Review queue page, Progress analytics, profile editing, payments

But first — install this, add some questions, run a drill, and tell me how it feels.
