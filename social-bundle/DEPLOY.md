# SATPeaK — Social Features Release

## Step 1: Run migration in Supabase
Supabase → SQL Editor → New query → paste migration-social.sql → Run

## Step 2: Extract this zip into your project
Extract into C:\Users\safoe\OneDrive\Desktop\satprep-app\
Overwrite all files when prompted.

## Step 3: Push
cd "C:\Users\safoe\OneDrive\Desktop\satprep-app"
git add .
git commit -m "Social features - Messages, DMs, Groups, Friends, Question sharing"
git push

## Step 4: Update ProfileEditor usage
Your profile PAGE (src/app/app/profile/page.tsx) passes props to ProfileEditor.
Add username and friendId props from the profile query:

  const { data: profile } = await supabase
    .from("profiles")
    .select("..., username, friend_id")   ← add these
    .eq("id", user.id).single()

Then pass them:
  <ProfileEditor
    ...existing props...
    username={profile.username}
    friendId={profile.friend_id}
  />

## What's new

### Dashboard bug fix
The sidebar overlap issue is fixed. The StudentShell.tsx now correctly isolates
exam-mode CSS to only hide data-shell="true" elements.

### /app/messages — New messages hub
Tabbed page: Community | Direct Messages | Groups
Friends panel slides out from the left sidebar.

### Friends system
Students set a @username in Profile.
Search friends by @username or #123456 friend ID.
Send/accept/decline friend requests.

### Direct Messages
1-on-1 realtime chat with friends.
Unread badge on sidebar Messages link.

### Group chats
Create groups, add friends, realtime chat.

### Share questions to chat
After answering a question in any drill, a "📤 Share to chat" button appears.
Pick a community channel OR a DM/group conversation.
Add an optional note. Question appears as a card in the chat.
