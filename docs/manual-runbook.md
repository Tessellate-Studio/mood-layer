# Manual runbook — external setups only you can do

Durable record of every external-tool setup that has a **decided** path — the
steps no script can take, because they happen in someone else's console behind
someone else's login. Actionable steps only, no history — why a thing was
decided lives in [`BACKLOG.md`](../BACKLOG.md); this file holds *exactly how*.

Legend: ✅ done · 🟡 in progress (action left) · ⏸️ parked (decided, not now) ·
📖 reference · 🔲 not started.

**When a setup is finished, DELETE IT** — its section and its row, both. This
file holds outstanding work only; a finished setup left behind reads as work
and buries the items that actually are. The history is not lost: the decision
lives in [`BACKLOG.md`](../BACKLOG.md), the steps stay in git. If a finished
setup has a residual action, keep only that action, as its own row.

Everything not listed here is local-only by design — no backend, auth,
analytics, or crash-reporting to configure. The one sanctioned off-device path
is the Circle relay (decision in [`BACKLOG.md`](../BACKLOG.md), trust boundary
in [`SECURITY.md`](./SECURITY.md)).

---

## Status at a glance

| Item | Status | What's left |
|---|---|---|
| [Repo back to private](#repo-back-to-private--parked) | ⏸️ | **Parked 2026-08-12 — stays public for now.** Nothing to do; steps kept for when you reopen it |
| [EAS dev build](#eas-dev-build--gates-four-on-device-checks) | 🟡 | One build, then walk four on-device checks Expo Go cannot run |
| [Crash reporting go-live](#crash-reporting-go-live) | 🟡 | Project + local DSN done; the EAS env var waits for the first `eas build` |
| [Ops watchdog](#ops-watchdog) | 🟡 | One dispatch to verify, then set `OPS_WATCHDOG_ENABLED=true` |
| [Publish to Google Play](#publish-to-google-play-indie-route) | 🔲 | Developer account ($25), then four repo secrets — CI already builds + uploads the AAB |
| [Circle pairing — two-phone test](#circle-pairing--the-two-phone-test) | 🟡 | The relay is live and curl-verified; never exercised across two real phones |
| [Device testing on Expo Go](#device-testing-on-expo-go) | 📖 | Reference only — no action outstanding |

---

## Crash reporting go-live

**Status:** 🟡 Code shipped 2026-08-13 and deliberately **inert** — with no DSN
configured, `crashReporting.ts` never initializes, so the app behaves exactly
as it did before. Decision + privacy contract:
`memory/decisions/adr-001-crash-reporting.md` and `docs/SECURITY.md` → "Crash
reports".

**What's left:** the EAS half, and it is **blocked on the first EAS build**,
not on you doing anything today.

1. ✅ **Sentry project** — created by the user 2026-08-13, `bot-h0/mood-layer`.
2. ✅ **Local builds** — `EXPO_PUBLIC_SENTRY_DSN` written to `.env.local` in
   the main checkout (2026-08-13). Deliberately `.env.local`, not `.env`:
   `.gitignore` covers `.env*.local` but **not** plain `.env`, so a key put
   there would be committed. The DSN itself is a write-only ingest key that
   ships inside the binary anyway — the habit is what matters.
3. 🚧 **EAS builds** — `eas env:create` fails with *"EAS project not
   configured"*: this app has never been linked (`eas init` has never run,
   consistent with the EAS dev-build item below). It will be linked the first
   time you run a build, and **that is the moment to add the var**:
   ```bash
   eas env:create --name EXPO_PUBLIC_SENTRY_DSN --value <dsn> --environment production
   ```
   (repeat for `preview` if you test there). Get `<dsn>` from
   `.env.local`, or sentry.io → mood-layer → Settings → Client Keys.

   Until then, **EAS-built APKs have no DSN and report nothing** — the same
   inert behaviour as before this feature. Only local dev builds report.

**Verify:**
- [ ] In a dev/production build — **not** Expo Go, where the SDK is skipped by
      design — turn "Send crash reports" **on** in Settings, force a crash, and
      confirm the event lands in Sentry.
- [ ] Inspect that event: no `user`, no IP, no `extra`, no state dump, only
      navigation breadcrumbs. Anything more is a privacy regression — stop and
      re-read `services/crashReporting.ts`.
- [ ] With the toggle **off** (the default), nothing arrives at all.

**Play listing:** this adds a "Crash logs — optional" entry to the data-safety
form when you fill it in.

---

## Ops watchdog

**Status:** 🟡 Workflow shipped 2026-08-13, inert until you switch it on.

**What it is:** an hourly probe that the **circle relay** is alive — the app's
only server, and one that lives in *alate's* Supabase project (it was put
there so alate's traffic keeps the free tier awake). If that project ever
pauses, circle delivery stops silently for everyone; nothing in this repo
watched for that until now. The probe POSTs an unknown action and expects the
dispatcher's `{"error":"unknown action"}` — it writes nothing and needs no
token. On failure it opens one `ops-alert` issue, which the daily
crash-monitor task already triages.

**Steps:**

1. Verify it before trusting it:
   ```bash
   gh workflow run ops-watchdog.yml --repo Tessellate-Studio/mood-layer
   gh run list --repo Tessellate-Studio/mood-layer --workflow=ops-watchdog.yml --limit 1
   ```
2. Switch the schedule on:
   ```bash
   gh variable set OPS_WATCHDOG_ENABLED --repo Tessellate-Studio/mood-layer --body true
   ```

**Verify:**
- [ ] The dispatched run is green and logs `OK — circle relay alive`.

**If the repo ever goes back to private:** delete this workflow or set the
variable to `false` in the same change — scheduled Actions are free on public
repos only, and this repo has burned the org's minutes once before.

---

## Repo back to private — parked

**Status:** ⏸️ **Deliberately parked 2026-08-12 — the repo stays public for
now (user's call).** Not an oversight and not a to-do: re-open it when the IP
in here starts to matter, or when the org's Actions budget stops being the
thing that makes public attractive. Public since 2026-07-18, with zero forks
and zero stars as of 2026-07-20.

**What's left:** Nothing, until you decide otherwise. The steps below are kept
because the decision is reversible and the ordering is the part that's easy to
get wrong — billing first, because this repo's CI dies the moment it goes
private if the org has no Actions budget.

Standing context for whenever it's reopened: a public GitHub repo can always be
viewed and forked on-platform under GitHub's Terms of Service; no license or
setting prevents that, only private visibility. A proprietary `LICENSE` (all
rights reserved) sits at the repo root meanwhile.

**Steps (when you reopen this):**

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
**The CI half is done** (2026-08-15): pushing a `v*` tag builds a signed
phone-ABI AAB (`armeabi-v7a` + `arm64-v8a`) and uploads it to the
internal-testing track
([`build-android-apk.yml`](../.github/workflows/build-android-apk.yml), ported
from alate). It fails closed on missing secrets, so **do not tag until steps
1–4 below are done** — the run stops at the keystore step.

**What's left:** The account ($25), an upload keystore, a Play service
account, and four repo secrets.

**Steps:**

1. play.google.com/console → **Create developer account** → *Yourself* →
   pay the $25 one-time fee → complete identity verification.
2. Create the app under package `com.tessellate.moodlayer` (Play never lets
   you change a package id later — alate had to make a fresh console app over
   exactly this). Fill **App content → Data safety**; the crash-reporting
   entry it needs is written up in [`SECURITY.md`](./SECURITY.md).
3. Generate the upload keystore **locally** — CI will never do this, by
   design (a leaked-key incident in alate is why). The alias must be
   `mood-layer`; the workflow hardcodes it:
   ```bash
   keytool -genkeypair -v -keystore mood-layer-release.keystore -alias mood-layer -keyalg RSA -keysize 2048 -validity 10000
   ```
   Back the file up somewhere permanent — losing it means losing the ability
   to update the app.
4. Create a Play service account (Play Console → **Users and permissions** →
   invite the Google Cloud service account, grant *Release to testing tracks*),
   download its JSON key, then set the four secrets:
   ```bash
   base64 -w0 mood-layer-release.keystore | gh secret set ANDROID_KEYSTORE -R Tessellate-Studio/mood-layer
   gh secret set KEYSTORE_PASSWORD -R Tessellate-Studio/mood-layer
   gh secret set KEY_PASSWORD -R Tessellate-Studio/mood-layer
   base64 -w0 play-service-account-key.json | gh secret set GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_B64 -R Tessellate-Studio/mood-layer
   ```
   Optional but worth doing before the first release: `EXPO_PUBLIC_SENTRY_DSN`
   — without it the store build ships with crash reporting inert.
5. Release: bump `android.versionCode` in `app.json` (Play rejects a
   versionCode it has already seen — nothing auto-increments it here), then
   tag:
   ```bash
   git tag v0.2.0 && git push origin v0.2.0
   ```
6. Plan for Google's requirement on individual accounts created since 2023: a
   **closed test with 12 testers running 14 continuous days** before production
   access unlocks. Recruit the testers before you need them.
7. Promoting internal → **Production** stays a manual Play Console click, on
   purpose. CI stops at internal.

Until the account exists the distribution channel is sideloading the CI APK —
including for circle members who want the peer-app sharing. A manual dispatch
is unchanged by the above (arm64-only, debug-signed, no secrets needed):
```bash
gh workflow run build-android-apk.yml --ref master -R Tessellate-Studio/mood-layer
```

**Verify:**
- [ ] The account exists and shows *verified* in Play Console
- [ ] A `v*` tag run reaches "Release to Play Console" green
- [ ] The build appears on the internal-testing track with the new versionCode

---

## Circle pairing — the two-phone test

**Status:** 🟡 Live since 2026-07-18, curl-verified end to end, never run across
two real phones. Deployed shape: [`SECURITY.md`](./SECURITY.md) → "Circle relay".

**What's left:** One real pairing between two devices.

**Steps:**

1. Install the APK on a second phone (build → download → `adb install -r`, as
   in [Publish to Google Play](#publish-to-google-play-indie-route)).
2. Phone A: Circle → the person → **pair it**. Phone B: scan the QR.
3. Send a weekly summary from A.

**Verify:**
- [ ] The QR scan pairs both phones
- [ ] The summary sent from A arrives on B

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
