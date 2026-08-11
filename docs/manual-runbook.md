# Manual runbook — external setups only you can do

Durable record of every external-tool setup that has a **decided** path — the
steps no script can take, because they happen in someone else's console behind
someone else's login. Actionable steps only, no history — why a thing was
decided lives in [`BACKLOG.md`](../BACKLOG.md); this file holds *exactly how*.

Legend: ✅ done · 🟡 in progress (action left) · 📖 reference · 🔲 not started.

**When a setup is finished, MOVE IT.** Delete its section, add a one-liner to
[Done](#done), and repoint its row in the table below at `#done`. A finished
setup left as a full section is the main way this file rots — it reads as
outstanding work and buries the items that actually are. A small residual action
is fine in Done; a whole section is not.

Everything not listed here is local-only by design — no backend, auth,
analytics, or crash-reporting to configure. The one sanctioned off-device path
is the Circle relay ([Done](#done)).

---

## Status at a glance

| Item | Status | What's left |
|---|---|---|
| [Repo back to private](#repo-back-to-private) | 🔲 | Sort org Actions billing, then flip visibility — repo is still **public** (checked 2026-08-11) |
| [EAS dev build](#eas-dev-build--gates-four-on-device-checks) | 🟡 | One build, then walk four on-device checks Expo Go cannot run |
| [Publish to Google Play](#publish-to-google-play-indie-route) | 🔲 | Create the personal developer account ($25); steps land here once it exists |
| [Device testing on Expo Go](#device-testing-on-expo-go) | 📖 | Reference only — no action outstanding |
| [Circle relay](#done) | ✅ | — |
| [Pulse scoring dependency](#done) | ✅ | — |

---

## Repo back to private

**Status:** 🔲 Still public — `gh repo view Tessellate-Studio/mood-layer` reads
`PUBLIC` (checked 2026-08-11). Public since 2026-07-18, with zero forks and zero
stars as of 2026-07-20.

**What's left:** Two dashboard actions, in this order — billing first, because
this repo's CI dies the moment it goes private if the org has no Actions budget.
A public GitHub repo can always be viewed and forked on-platform under GitHub's
Terms of Service; no license or setting prevents that, only private visibility.
A proprietary `LICENSE` (all rights reserved) sits at the repo root meanwhile.

**Steps:**

1. **Sort org Actions billing.** github.com → **Tessellate-Studio → Settings →
   Billing and plans → Spending limits** → set a monthly Actions limit (e.g.
   $10–25). Linux minutes are $0.008/min, so one ~11-min APK build ≈ $0.09.
   Alternatives: upgrade the org to Team ($4/user/month, 3,000 included
   minutes), or point these workflows at the org's self-hosted `ci-light`
   runners and spend nothing — all five workflows here are on `ubuntu-latest`
   today, so that one is a code change, not a dashboard one.
2. **Flip visibility.** Repo **Settings → General → Danger Zone → Change
   visibility → Private.** Actions minutes start billing to the org pool;
   stars/watchers are wiped; any public forks detach and keep their copy.
3. **Check the org fork lock.** Org **Settings → Member privileges** → *"Allow
   forking of private repositories"* must be **unchecked** (GitHub's default).

**Verify:**
```bash
gh repo view Tessellate-Studio/mood-layer --json visibility
gh run list -R Tessellate-Studio/mood-layer --limit 3
```
- [ ] `visibility` reads `PRIVATE`
- [ ] A workflow run after the flip still completes (not blocked on billing)

**Related, not a step:** registering "The Mood Layer" as a word mark (software
classes, typically 9 and 42) protects the *name* in commerce, not the code —
that is copyright plus private visibility. Worth an attorney consult on
jurisdiction and classes if it ever becomes a priority.

---

## EAS dev build — gates four on-device checks

**Status:** 🟡 `eas.json` is scaffolded (dev/preview/production) and EAS login is
done. The build itself has never been run.

**What's left:** One development build, installed on the phone, then walk the
four checks Expo Go cannot run — `expo-notifications` was removed from Expo Go in
SDK 53+ (regression-log #4), so anything notification-shaped no-ops there.

**Steps:**

1. Build and install:
   ```bash
   eas build --profile development --platform android
   ```
   Then install the resulting dev client on the phone.
2. Walk the four checks:
   - "Name it" reminders fire, and the notification deep-links into check-in.
   - Circle scheduled-share reminders fire (circle service fns no-op under Expo
     Go).
   - The Phase-2 background relay wakes and the "a week arrived" notification
     lands.
   - The app icons look right on the launcher.

**Verify:**
- [ ] A reminder arrives with the app closed, and tapping it opens check-in
- [ ] A scheduled circle share sends without the app being opened first
- [ ] The launcher icon and splash match the intended art

---

## Publish to Google Play (indie route)

**Status:** 🔲 No developer account yet. Not going the DUNS/org route — DUNS is
for registered organisations and this ships as an individual.

**What's left:** Create the personal Google Play developer account ($25
one-time). Concrete steps land in this section once it exists — the console
flow depends on what the account offers on the day.

**Steps:**

1. play.google.com/console → **Create developer account** → *Yourself* →
   pay the $25 one-time fee → complete identity verification.
2. Plan for Google's requirement on individual accounts created since 2023: a
   **closed test with 12 testers running 14 continuous days** before production
   access unlocks. Recruit the testers before you need them.
3. Until then the distribution channel is sideloading the CI APK — including for
   circle members who want the peer-app sharing:
   ```bash
   gh workflow run build-android-apk.yml --ref master -R Tessellate-Studio/mood-layer
   gh run download <run-id> && adb install -r <apk>
   ```

**Verify:**
- [ ] The account exists and shows *verified* in Play Console
- [ ] An internal-testing release accepts an upload

---

## Device testing on Expo Go

**Status:** 📖 Reference. **Nothing here is outstanding** — kept because the same
two things trip up every session.

The PC's LAN IP changes between sessions (DHCP), and this Wi-Fi ("ElectricSheep")
sits on the **Public** firewall profile.

**Steps:**

1. Start Metro (`npx expo start`), then read the **current** PC IP — never reuse
   a prior day's `exp://…:8081` URL (regression-log #6).
2. Phone and PC on the same Wi-Fi; open `exp://<current-ip>:8081` in Expo Go.
3. If it cannot connect (*"Failed to download remote update"*), the Public-profile
   firewall is blocking 8081: allow inbound TCP 8081, mark the network Private,
   or run `expo start --tunnel`. Firewall changes and tunnels are
   security-sensitive — the user runs those, not the agent.

---

## Done

Kept as one-liners; expand only if one breaks.

- **Circle relay (Supabase, alate project)** — ✅ (2026-07-18) schema `moodlayer`
  (`invites`, `pairings`, `outbox`; RLS deny-all, not exposed via PostgREST) +
  edge function `moodlayer-relay` v2 (`verify_jwt` OFF — per-pairing bearer
  tokens are the auth). Endpoint, baked into the app as `RELAY_URL`, not a
  secret: `https://ancuwmmivgdvommzigwv.supabase.co/functions/v1/moodlayer-relay`.
  It rides on the **alate** Supabase project deliberately — a free-tier project
  pauses after ~1 week idle and a two-user relay would pause constantly; alate's
  traffic keeps it awake. Verified by curl round-trip: invite → claim →
  invite-status → send → fetch (delete-on-read) → wrong-token 403 → unpair.
  Privacy review: `docs/SECURITY.md` → "Circle relay". 🟡 Residual: the real
  two-phone test (install the APK on a second phone, Circle → person → "pair
  it", scan the QR across phones, send). Instant push pokes via FCM are
  deliberately deferred — not needed for a daily/weekly rhythm.
- **Pulse scoring dependency** — ✅ superseded 2026-07-17: rubric-sdk was merged
  into `@tessellate-studio/forge` (PR #21, `07e84af`), which is the dependency in
  `package.json` today. Scoring stays numeric via forge's `evaluateFromContext`.
