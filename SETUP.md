# SATPrep Admin Panel — Setup Guide

This is the admin panel for your SAT prep app. After setup, you'll open it in your browser at `http://localhost:3000` and use it to add questions to your Supabase database.

---

## 1. Install Node.js (one time only)

If you don't have Node.js yet:

1. Go to **https://nodejs.org/**
2. Click the green button labeled **"LTS"** (e.g. `20.x.x LTS — Recommended For Most Users`)
3. Run the installer with all default options
4. After install, close and reopen any terminal/PowerShell window

To verify it's installed, open **PowerShell** (or Command Prompt) and run:

```
node -v
npm -v
```

You should see version numbers like `v20.18.0` and `10.8.2`. If you do, you're good.

---

## 2. Open this folder in PowerShell

1. **Unzip the project** somewhere easy to find — e.g. `C:\Users\YourName\Desktop\satprep-app`
2. Right-click the unzipped folder → **"Open in Terminal"** (or open PowerShell and `cd` into it):
   ```
   cd C:\Users\YourName\Desktop\satprep-app
   ```

---

## 3. Install dependencies (one time only)

In the same PowerShell window, run:

```
npm install
```

This downloads everything the app needs. Takes 1–3 minutes. You may see warnings — that's normal.

---

## 4. Start the app

```
npm run dev
```

After a few seconds you'll see:

```
   ▲ Next.js 14.2.15
   - Local:        http://localhost:3000
   ✓ Ready in 2.1s
```

Open **http://localhost:3000** in your browser.

---

## 5. Log in

1. You'll see the **Login** screen
2. Enter the **admin email + password** you created in Supabase (Authentication → Users)
3. After login, you'll land on the **Admin Dashboard**

---

## Using the admin panel

### Adding a question manually

1. Click **"+ Add Question"** in the sidebar
2. Fill out the form:
   - **Source**: which test/module/question number
   - **Classification**: section (R&W or Math), skill, difficulty
   - **Passage**: paste the reading passage (R&W only, optional)
   - **Prompt**: the question text
   - **LaTeX**: optional math equation, with live preview
   - **Image**: optional chart/figure (uploads to Supabase storage)
   - **Choices**: A/B/C/D + which is correct (or student-produced response for Math)
   - **Explanation**: required — paste the College Board explanation
   - **Publish**: check this to make it visible to students
3. Click **Save question**

### Editing/deleting

- Go to **Question Bank** in the sidebar
- Click **Edit →** on any question
- Make changes and **Save**, or click **Delete** at the bottom

### Filtering

- Use the dropdowns on the Question Bank page to filter by section, difficulty, or published/draft status

---

## Troubleshooting

**"npm install" gives errors**
- Make sure Node.js is installed (run `node -v` — should print a version)
- Try running PowerShell as Administrator
- If it still fails, send me the error message

**Login says "Your account is not an admin"**
- Go to Supabase → Table Editor → `profiles`
- Find your user's row, set `is_admin` to `TRUE`

**Form errors say something about RLS or "permission denied"**
- This means the database security policies don't think you're an admin
- Same fix: set `is_admin = TRUE` in your profiles row

**To stop the app**
- In the terminal, press **Ctrl+C**

**To start again later**
- Open PowerShell in the project folder
- Run `npm run dev`

---

## What's next

Once you've added a handful of questions and confirmed everything works, we'll build the student-facing app: signup → onboarding → diagnostic → dashboard → drills → modules → full test.
