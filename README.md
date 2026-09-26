# Padel Thursday League

A small static PWA for an 8-player Thursday padel championship.

GitHub repository: `https://github.com/dfence/padel-thursday-league`.

The competition is configured to start on Thursday `2026-10-01`.

## Current storage

This version stores data in the admin browser with `localStorage`. It works well for a first GitHub Pages prototype:

- edit the 8 regular players
- generate pairings from the current leaderboard
- balance `19:00` starts during split weeks
- enter match scores
- mark substitutes with a `-2` games penalty for the regular player
- export and import JSON backups

Because GitHub Pages is static, there is no shared live database yet. Friends opening the page on their own phones will not automatically see the admin's local data.

The public app opens in read-only mode. Use the `Admin` button and code `geert` to reveal score editing and schedule tools. This hides controls for normal use, but it is not real security because static frontend code can be inspected in the browser.

## Recommended next database step

For a shared app, keep the frontend on GitHub Pages and add a hosted database:

- Supabase: best fit for a small private league, with login, tables, and a free tier.
- Firebase: also good, especially if realtime updates become important.
- Google Sheets plus Apps Script: simple and familiar, but less app-like and harder to secure cleanly.

The app logic is written so the local save/load functions can later be swapped for a backend without changing the league rules.

The first database script is in `database/supabase.sql`. It creates one shared JSON state row in Supabase, which is the simplest useful shape for this league while the rules are still evolving.

## Testing with fake scores

Use the `Load Demo` button in the app. It replaces the current rounds with six fake scored Thursdays, including one substitute penalty.

## Publishing on GitHub Pages

1. In GitHub, create a public repository named `padel-thursday-league`.
2. Do not add a README, license, or `.gitignore` in GitHub.
3. From this folder, run:

```powershell
git branch -M main
git add .
git commit -m "Initial padel league app"
git remote add origin https://github.com/dfence/padel-thursday-league.git
git push -u origin main
```

4. In GitHub, open `Settings > Pages`.
5. Under `Build and deployment`, choose `Deploy from a branch`.
6. Select branch `main` and folder `/ (root)`.
7. Save, then share the Pages URL with the group.

For now, use `Export` after updating scores so you have a backup file.
