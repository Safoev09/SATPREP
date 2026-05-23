# SATPrep — Phase A Update

This update adds the **student-facing app**: landing page, signup, onboarding, and student dashboard. The admin panel from before still works exactly as it did.

## What's new

✅ **Landing page** at `/` — warm earthy hero, click-burst, pricing, testimonials
✅ **Signup** at `/signup` — students create accounts
✅ **Onboarding** at `/onboarding` — 4-step wizard (welcome → previous/target score → region → exam date)
✅ **Student dashboard** at `/app` — OnePrep-style sidebar, exam countdown, target score, quick start cards
✅ **Profile page** at `/app/profile`
✅ **Smart login** — admins go to `/admin`, students to `/app` (or onboarding if incomplete)
✅ **Sidebar nav** with all future routes ready (drills, modules, full test, review, etc. — they say "Coming soon")
✅ **Free vs Paid lock** — paid features are locked for free users (🔒 in sidebar)

---

## How to install over your existing project

### Step 1: Backup just in case

In File Explorer, navigate to `OneDrive\Desktop`. Right-click your current `satprep-app` folder and rename it to `satprep-app-OLD` (just in case).

### Step 2: Extract the new zip

1. Find `satprep-app-v2.zip` in your Downloads.
2. Right-click → **Extract All** → choose `Desktop` as the destination.
3. After extraction, you should have a fresh `satprep-app` folder on your Desktop.

### Step 3: Copy your old .env.local over

The new zip doesn't include your specific Supabase keys. Open the new `satprep-app` folder — you should see a file called `.env.local` already there with the right values. Verify by opening it; it should have:

```
NEXT_PUBLIC_SUPABASE_URL=https://zyohkqfgysihwevucdet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_4DZV5hhwcykDX7vRftOpeQ_TXvaX8cx
```

If those values are missing or wrong, copy them from your old folder's `.env.local`.

### Step 4: Stop the old app and reinstall

1. Go to PowerShell. If your old `npm run dev` is still running, press **Ctrl+C** to stop it.
2. Navigate to the new folder:
   ```
   cd "C:\Users\safoe\OneDrive\Desktop\satprep-app"
   ```
3. Install dependencies again:
   ```
   npm install
   ```
4. Once that finishes, start it:
   ```
   npm run dev
   ```

### Step 5: Open the browser

Go to **http://localhost:3000**.

---

## What you should see

### Visiting as a guest (not logged in)
- **`/`** → the warm cream/brown **landing page** with floating shapes, click-burst, hero, features, testimonials, pricing
- **"Get started"** → goes to **/signup**
- **"Log in"** → goes to **/login**

### Signing up as a new student
1. Click **Get started** on the landing
2. Enter name, email, password → click **Create account**
3. If Supabase has email confirmation **off** (default for new projects): you land on **/onboarding** immediately
4. If Supabase has email confirmation **on**: you'll see a message to check your email — then log in manually
5. **Onboarding**: 4 steps — welcome → previous/target score → region → exam date → finish
6. After finishing onboarding, you land on the **student dashboard** at /app

### Signing in as you (the admin)
1. Click **Log in** on the landing
2. Use your admin email/password
3. You're sent to **/admin** (your admin panel from before — unchanged)

### Signing in as a student (the one you just made via signup)
1. Log out from admin (profile → Sign out)
2. Log in with the student email/password
3. You're sent to **/app** — the student dashboard

---

## ⚠️ One Supabase setting to check

If you find the **email confirmation flow is required** (signup says "check your email") but you don't want that during testing, you can turn it off:

1. Go to Supabase → **Authentication → Providers → Email**
2. Find **"Confirm email"** toggle — turn it **OFF** for now
3. Save

This way every signup is immediate. You can turn it back on later before launching to real users.

---

## To use the app any time later

1. Open PowerShell
2. `cd "C:\Users\safoe\OneDrive\Desktop\satprep-app"`
3. `npm run dev`
4. Open http://localhost:3000

---

## What's next: Phase B

After you confirm Phase A works, we'll build **Phase B**:

- The **question/practice screen** (Bluebook-inspired, with timer, navigator, strikethrough, calculator, etc.)
- The **Drills mode** — pick skill → configure → run → see results
- Hooks it up to your question bank

This is the biggest, most important piece of the entire app — what students will spend 90% of their time on.

But first: log in, try the new flow, and let me know it all works.
