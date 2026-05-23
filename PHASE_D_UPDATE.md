# SATPrep — Phase D Update: Modules + Full Mock Test

This update adds standalone **Modules** and the full **adaptive SAT Mock Test**.

## What's new

✅ **Standalone Modules** — Math (22 questions, 35 min) and R&W (27 questions, 32 min). Pick a difficulty, run it like a real SAT module, get a 200–800 module score.
✅ **Full SAT Mock Test** — the complete real-structure exam:
  - R&W Module 1 → R&W Module 2 → 10-min break → Math Module 1 → Math Module 2
  - **Adaptive:** how you do on Module 1 decides whether Module 2 is the harder or easier set
  - **Real scoring:** 400–1600, with the Module-2 difficulty affecting your score ceiling (just like the real SAT)
✅ **Full results screen** — 400–1600 score, R&W + Math section scores, skill breakdown, focus areas
✅ **Paywall** — Modules and the Full Test are premium. Free users see an upgrade screen. The sidebar marks premium items with a small "PRO" badge.

---

## Install (just the app code — no SQL this time)

1. Rename your Desktop `satprep-app` folder to `satprep-app-OLD-4`.
2. Extract `satprep-app-v5.zip` to Desktop → open it → cut the inner `satprep-app` folder → paste on Desktop.
3. Confirm `.env.local` is present with your Supabase keys.
4. PowerShell:
   ```
   cd "C:\Users\safoe\OneDrive\Desktop\satprep-app"
   npm install
   npm run dev
   ```
5. Open http://localhost:3000

---

## ⚠️ You need a BIG question bank to test this fully

This is the honest catch with Phase D:

- A **full R&W module** wants **27 questions**; a **full Math module** wants **22**.
- A **full mock test** wants **2 modules per section** — that's **~54 R&W + ~44 Math = ~98 questions**.

Right now your bank is small. So:
- Modules and the full test **will still run**, but with fewer questions than the real SAT — you'll see an amber warning telling you how many are available vs needed.
- To test properly, add more questions in the admin panel (or just accept short modules for now to check the flow works).

The 24 diagnostic questions you loaded **also count** toward modules/tests (they're published R&W + Math questions), so you already have some to work with.

---

## How to test Phase D

### Test a Module
1. Log in. Make sure your student account has `has_lifetime_access = TRUE` in Supabase (Table Editor → profiles) — otherwise you'll see the paywall.
2. Sidebar → **Math modules** (or R&W modules).
3. Pick a difficulty → **Start module**.
4. It runs in test mode (no feedback until the end), with a timer.
5. Finish → results screen with your score.

### Test the Full Mock
1. Sidebar → **Full mock test**.
2. Read the intro (note the amber warning if your bank is small) → **Begin full test**.
3. Go through: R&W Module 1 → R&W Module 2 → break → Math Module 1 → Math Module 2.
4. Notice Module 2 adapts based on Module 1 performance.
5. Finish → see your 400–1600 score and skill breakdown.

### Test the paywall
1. In Supabase, set your student's `has_lifetime_access` to `FALSE`.
2. Reload the app → click "Math modules" or "Full mock test" → you should see the 🔒 upgrade screen.
3. Set it back to `TRUE` to keep testing.

---

## Known limitations (by design for now)

- **Scoring is an approximation** — modeled on the real adaptive SAT but not College Board's exact equating
- **Modules/full test need a large bank** to feel real — that's a content task, not a code one
- **Review queue, Progress page, profile editing, payments** — still "coming soon" (Phase E)

---

## What's next: Phase E (the final core phase)

- **Review queue** page — all your bookmarked questions in one place
- **Progress** page — accuracy by skill over time, score history, weak-spot trends
- **Profile editing** — change target score, exam date, etc.
- **Payment integration** — Click / Payme / Uzum + Stripe

Install this, test the modules and full test (even if short), and tell me how it feels.
