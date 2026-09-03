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
| [EAS build + on-device checks](#eas-build--on-device-checks) | 🟢 | Both notification defects fixed and device-verified 2026-08-24 ([#73](https://github.com/Tessellate-Studio/mood-layer/issues/73), [#74](https://github.com/Tessellate-Studio/mood-layer/issues/74)) |
| [Publish to Google Play](#publish-to-google-play-indie-route--parked) | ⏸️ | **Parked — not the focus right now.** Account exists, CI already builds + uploads the AAB; steps kept for when you resume |
| [Circle pairing — two-phone test](#circle-pairing--the-two-phone-test) | 🟢 | Walked 2026-08-20 against the live relay with a scripted stand-in peer — invite, claim, seal, send, receive, decrypt. Two real handsets remain untried, but nothing now depends on that |
| [Device testing on Expo Go](#device-testing-on-expo-go) | 📖 | Reference only — no action outstanding |
| [iOS TestFlight submission](#ios-testflight-submission--blocked-in-app-store-connect) | 🟡 | Repo-side config is correct; a submission blocker on Apple's side needs a console check |

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

## EAS build + on-device checks

**Status:** 🟢 **Builds work and install; both notification checks pass.**
EAS is linked (`@newbietrawler/mood-layer`) and `preview` builds have been
produced and installed on the Pixel 2 XL repeatedly (2026-08-17..19).

Use `preview`, not `development`: the `development` profile sets
`developmentClient: true` and refuses to build until `expo-dev-client` is
installed, and it needs Metro attached to be useful. `preview` produces a
standalone sideloadable APK — which is the distribution route anyway.

```bash
eas build --profile preview --platform android
```

**Walked and passing (2026-08-19):**
- [x] The binary launches with the native Sentry module linked — the class
      that red-screened v1 (regression #4)
- [x] Crash reporting end to end: consent gate off by default, starts on the
      toggle, persists across restart, JS crash reaches Sentry, payload
      inspected against the privacy contract
- [x] Launcher icon and splash look right

**Walked 2026-08-20 — both, on the CI-signed APK:**
- [x] A "Name it" reminder fires with the app closed — verified twice (17:00
      and 18:00). The app was killed with `am kill`, not force-stop, which
      matters: force-stop cancels the alarm and the test would pass vacuously
- [x] …and tapping it deep-links into check-in — **fixed and device-verified
      2026-08-24** ([#73](https://github.com/Tessellate-Studio/mood-layer/issues/73),
      regression row 21). App process killed with `am kill` (alarm survives),
      a real 20:00 `AlarmManager` RTC_WAKEUP fired the reminder, and the cold
      tap opened check-in — not Layers
- [x] A scheduled circle share sends without the app being opened first —
      the background job sealed and posted a summary, and the peer decrypted it
- [x] The relay's "a week arrived" notification lands — **was on the wrong
      channel, at the wrong importance, fixed and device-verified 2026-08-24**
      ([#74](https://github.com/Tessellate-Studio/mood-layer/issues/74), landed
      as regression row 22). A from-scratch peer script spoke the real relay
      protocol (invite/claim/seal/send) against the live edge function; the
      app's background delivery task fetched and decrypted it, and
      `dumpsys notification --noredact` confirmed `channel=circle` at
      `importance=3` (DEFAULT) — not the fallback

**The two-phone dependency is gone.** `scratchpad/peer` in the 2026-08-20
session held a ~90-line script that speaks the relay's wire protocol: it
decodes the invite QR straight out of an `adb` screenshot, claims the pairing,
and does real `nacl.box` sealing against the device's public key. Nothing
mocked — the deployed edge function, real crypto, and the relay confirmed the
device's key matched the QR. Rebuild it from
[`circleRelay.ts`](../src/services/circleRelay.ts) if it is needed again; the
four actions are `invite`, `claim`, `send`, `fetch`.

Expo Go cannot test either (`expo-notifications` was removed from Expo Go in
SDK 53+, regression #4).

**Nothing needs granting on this phone.** An earlier version of this section
said `POST_NOTIFICATIONS` had to be allowed first; that was wrong, and wrong in
a way worth remembering — the permission is in the manifest, so it reads as
outstanding, but it is an Android 13+ (API 33) runtime permission and the
Pixel 2 XL runs Android 11 (SDK 30). On this device it is inert:

```bash
adb shell dumpsys package com.tessellate.moodlayer | sed -n '/runtime permissions:/,/^$/p'
```

`POST_NOTIFICATIONS` appears under *requested permissions* but not under
*runtime permissions*, and `adb shell cmd appops get com.tessellate.moodlayer
POST_NOTIFICATION` reports `Default mode: allow` — so notifications are on
unless they were switched off in App info → Notifications, which is where
Android ≤12 keeps them; they are not on the App permissions screen at all.
Both checks can be walked as they stand. On an Android 13+ device the in-app
prompt ([`notifications.ts:83`](../src/services/notifications.ts#L83)) has to
be accepted first.

## Publish to Google Play (indie route) — parked

**Status:** ⏸️ **Deliberately parked (user's call) — not the focus right
now.** Not an oversight and not a to-do: resume when Google Play distribution
actually matters. Developer account exists (confirmed 2026-08-20) and the CI
half is done (2026-08-15) — pushing a `v*` tag builds a signed phone-ABI AAB
(`armeabi-v7a` + `arm64-v8a`) and uploads it to the internal-testing track
([`build-android-apk.yml`](../.github/workflows/build-android-apk.yml), ported
from alate). It fails closed on missing secrets, so **do not tag until steps
2–4 below are done** — the run stops at the keystore step.

**What's left:** Nothing, until you decide to resume. The steps below are
kept for when you do: an upload keystore, a Play service account, and four
repo secrets — step 1 (the account) is already done.

**Steps (when you resume):**

1. ~~play.google.com/console → **Create developer account** → *Yourself* →
   pay the $25 one-time fee → complete identity verification.~~ **Done.**
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

While parked, the distribution channel is sideloading the CI APK — including
for circle members who want the peer-app sharing. A manual dispatch is
unchanged by the above (arm64-only, debug-signed, no secrets needed):
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

1. Install the APK on a second phone:
   ```bash
   gh workflow run build-android-apk.yml --ref master -R Tessellate-Studio/mood-layer
   gh run download <run-id> --name mood-layer-apk && adb install -r <apk>
   ```
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

---

## iOS TestFlight submission — blocked in App Store Connect

**Status:** 🟡 The repo-side pipeline is correctly configured; every
submission attempt still fails with a generic Apple-side error, which points
at something in the App Store Connect / Apple Developer account itself — not
in this repo.

**What's left:** Log into App Store Connect and check for a pending
agreement, membership, or payment issue (steps below); once cleared, a free
re-run confirms the fix before any build credit is spent.

**What's verified correct (2026-09-03), so don't re-check these first:**
- `app.json` → `ios.bundleIdentifier` = `com.tessellate.moodlayer`, matches
  the ASC app; `ios.infoPlist.ITSAppUsesNonExemptEncryption: false` is set
  (a missing encryption-compliance answer is the #1 cause of this class of
  failure, and it's not the cause here).
- `eas.json` → `submit.production.ios.ascAppId: "6804997227"` is correct and
  resolves (`eas submit` finds the app and the existing build every time).
- `EXPO_TOKEN` repo secret is present and valid — the workflow gets past
  auth, credential lookup, and build lookup every time; it fails only once
  Apple's own submission pipeline picks the job up.
- The one existing build (`92546281`, App Version 0.2.0, Build 1, from
  2026-08-25) is a valid finished build — `eas submit --latest` finds and
  schedules it successfully both times below.

**The failure pattern:** two independent `submit-latest` runs (2026-08-26 run
`32937953263`, and 2026-09-03 run `33737733777`) both scheduled the
submission, then spent **~3 real minutes** with Apple actually processing it
before failing with the identical opaque message: *"Something went wrong
when submitting your app to Apple App Store Connect."* `eas submit` does not
surface anything more specific than that — the real reason is on the
[Submission details] page each run printed (an expo.dev URL, login-gated —
only visible to whoever's logged into the `newbietrawler` Expo account) or
in App Store Connect itself. A near-instant failure would suggest a config
typo; a ~3-minute failure after Apple has clearly started working on it
suggests an **account-level** blocker, most commonly one of:

1. **An unsigned Program License Agreement.** Apple periodically updates the
   Developer Program agreement; ANY pending one silently blocks all
   submissions with exactly this generic error. Check
   [appstoreconnect.apple.com](https://appstoreconnect.apple.com) for a
   banner under your account/agreements — usually **Business** (top-right
   account menu) → **Agreements, Tax, and Banking**.
2. **Apple Developer Program membership not current** (expired, or a
   renewal payment that didn't go through) — check
   [developer.apple.com/account](https://developer.apple.com/account) →
   Membership.
3. Less likely, since the app + bundle ID already exist and accepted the
   build: a missing required field under **App Store Connect → My Apps →
   The Mood Layer → App Information**.

**Verify the fix, free, before spending a build credit:**
```bash
gh workflow run ios-release.yml --repo Tessellate-Studio/mood-layer -f mode=submit-latest
```
This resubmits the SAME existing build (`92546281`) — no new EAS build
credit spent. Watch it with `gh run watch <run-id> --repo
Tessellate-Studio/mood-layer --exit-status`; green here confirms the account
blocker is cleared. Only after that succeeds does it make sense to spend a
credit on a build carrying this session's actual changes:
```bash
gh workflow run ios-release.yml --repo Tessellate-Studio/mood-layer -f mode=build-and-submit
```

**Verify:**
- [ ] No pending agreement/membership/payment banner in App Store Connect or
      developer.apple.com/account
- [ ] A `submit-latest` dispatch reaches "Submit the latest existing build"
      green (confirms the account is unblocked)
- [ ] A `build-and-submit` dispatch lands a current build in TestFlight and
      it installs on a registered internal-tester device
