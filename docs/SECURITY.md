# Security — disposition log

Dependency alerts and security findings are triaged per the shared policy in
`forge/standards/security-triage.md` (forge plugin). Each triaged item gets a row
here: date → alert → disposition (fix / accept / not-applicable) → why.

Privacy posture of this app (context for triage): **local-only, with TWO
sanctioned exceptions** (the circle relay, and opt-in crash reports — both
reviewed below). All user data (emotion check-ins, journal text) stays
on-device in AsyncStorage. No accounts, no analytics. Any dependency or change
that would move emotional data off the device is a security/privacy finding by
definition — see the hard rules in `CLAUDE.md`.

## Crash reports — sanctioned exception #2 (privacy review, 2026-08-13)

User-decided 2026-08-13, invoking the hard rule's own escape hatch ("until the
user explicitly decides otherwise, then tracker + a privacy review"). Full
reasoning and the rejected alternative (a local-only crash journal):
`memory/decisions/adr-001-crash-reporting.md`.

- **Off by default, opt-in only.** `settingsStore.crashReportingEnabled`
  starts `false`; only the Settings toggle flips it. Off = the SDK never
  initializes; turning it off closes the client immediately, not next launch.
- **What leaves the phone (when on):** error type, message, stack trace, the
  navigation trail as bare route names, and diagnostic device/OS/app contexts.
  The shape of a failure.
- **What never leaves, enforced in code:** `user` (no ids), IP
  (`sendDefaultPii: false`), `request` (urls/headers — the relay bearer token
  lives there), `extra`, `contexts.state` (a zustand dump would be the entire
  journal), `server_name`, and every non-navigation breadcrumb — console and
  network crumbs dropped outright, navigation crumbs keep the route name and
  lose their params. Tracing, screenshots, view-hierarchy capture: all off.
- **CORRECTION (2026-08-17), found by testing on a real device.** The
  scrubbing claim above was true only for JS errors. A NATIVE crash is sent
  by the Android/iOS SDK without passing through the JS layer, so
  `beforeSend`/`scrubEvent` never ran on it — and a forced native crash
  reached Sentry (issue MOOD-LAYER-1) carrying `user.id` and `user.geo`
  (city-level, derived from the request IP). Every unit test passed while
  that was shipping. **Fixed** by `enableNativeCrashHandling: false`, so
  every event Sentry can receive is a JS event and therefore scrubbed;
  native-only failures (OOM, ANR, native-module crashes) are consequently
  NOT reported, which is the accepted trade (ADR-001). Regression row 16.
- **ACCEPTED RESIDUAL — city-level geolocation (`user.geo`).** Sentry derives
  it from the request IP inside its own ingest pipeline, and every available
  control was tried and empirically failed to remove it, each verified against
  a real delivered event:
  1. `sendDefaultPii: false` in the SDK — geo still present.
  2. **Prevent Storing of IP Addresses** (org + project) — geo still present;
     the raw IP is dropped but the geography already derived from it is not.
  3. An Advanced Data Scrubbing rule on `$user.geo` — geo still present
     (event `431cb420…`, 2026-08-19). Scrubbing rules run against the event
     **as the SDK submitted it**, and `user.geo` does not exist at that
     point — the ingest pipeline adds it afterwards. A rule cannot remove a
     field that is not there yet.

  **Disposition: accepted.** What ships is country + city, on an opt-in-only
  channel, with no user id, no IP stored, and no device id. City-level
  coarseness is what most crash reporters emit by default. If this ever needs
  to be zero, the remaining routes are a Sentry support request or a
  self-hosted Relay in front of ingest — neither justified at this stage.
  **Do not re-state in any doc that geo is stripped: it is not.**
- **Enforcement is tests, not config claims:**
  `src/__tests__/crashReporting.test.ts` asserts each line above. A regression
  there breaks this review, loudly.
- **Trust boundary:** Sentry (org `bot-h0`, EU region) receives the scrubbed
  events. No DSN configured → the code is inert, so any build without
  `EXPO_PUBLIC_SENTRY_DSN` behaves exactly as before this change.
- **Expo Go:** skipped entirely (native module; importing it there is the
  import-time crash class that red-screened the v1 launch).
- **Residual risk (accepted):** an error message interpolating user text would
  ship that text inside `exception.value`. No code does this today; scrub at
  the throw site if one is added — a scrubber cannot tell which substring is
  a feeling.
- **Play Store:** needs a "Crash logs — optional" data-safety entry when the
  listing is filled in (BACKLOG P2).

## Circle relay — the sanctioned exception (privacy review, 2026-07-18)

User-decided 2026-07-18: circle sharing may deliver app-to-app through a relay.
The trust boundary, reviewed before code (BACKLOG P0 entry):

- **What leaves the phone:** ONLY the gated weekly summary string — the same
  text "Share this week" hands to the OS share sheet (`shareSummary`, gated by
  the person's `sees` level). Never check-ins, notes, reflections, or the
  vocabulary of a specific day.
- **Encrypted before transit:** sealed on-device with `nacl.box` (tweetnacl)
  to the recipient's public key. The relay stores an opaque `{nonce, box}`.
- **Send-and-forget server:** Supabase edge function `moodlayer-relay`
  (alate project, dedicated `moodlayer` schema — NOT exposed via PostgREST;
  the function talks to Postgres directly). Deployed with `verify_jwt` **OFF**
  — the per-pairing bearer tokens below are the auth, so a redeploy that turns
  it back on locks every paired device out. Rows delete on fetch; unclaimed
  invites expire at 48 h, unfetched messages at 14 days (inline sweeps).
- **Identity:** device keypair in the OS secure store (`expo-secure-store`);
  pairing = QR/link invite handshake; auth = relay-minted per-pairing bearer
  tokens. No emails, phone numbers, or accounts anywhere.
- **Revocation:** unpair (either side) deletes the pairing server-side and
  cascades pending messages; removing a person locally also drops their
  pairing and received statuses.
- **Automation (phase 2, 2026-07-18):** scheduled sends do NOT move where
  anything happens — a periodic on-device background task (WorkManager)
  builds and seals the same gated summary on the phone at the cadence the
  user set per person (evening / weekly), and the same wake pulls the inbox,
  raising a local notification that names WHO arrived, never what. No push
  infrastructure; no new server knowledge.
- **Residual risks accepted:** relay metadata (pairing ids, message timing,
  blob sizes) is visible to the server operator (the user themselves);
  tokens live in AsyncStorage alongside other app state.

| Date | Alert / finding | Disposition | Why |
|---|---|---|---|
| 2026-07-18 | Circle relay moves a summary off-device | accepted (scoped) | User-decided exception; E2E-encrypted, send-and-forget, gated summary only — see review above |
| 2026-07-28 | `brace-expansion` high (GHSA-mh99-v99m-4gvg) | accepted | Patched in 5.0.8, but `glob`/`minimatch` pin `^1`/`^2` — unreachable without a major bump. Build-time only (jest, eslint, Metro); no app-input path |
| 2026-07-28 | `postcss` high (`<=8.5.17`) | **deferred** — safe pass breaks the test suite | See sweep note below |
| 2026-07-28 | `uuid` moderate (GHSA-w5hq-g745-h8pq, `<11.1.1`) | accepted | Build-time only, via `xcode` ← `@expo/config-plugins`; only fix is an Expo major |
| 2026-08-03 | `brace-expansion` high ×2 (GHSA-mh99-v99m-4gvg, GHSA-3jxr-9vmj-r5cp) | **fixed** | → 5.0.9. Supersedes the 2026-07-28 "accepted" row above — the safe pass now resolves it without breaking the suite |
| 2026-08-03 | `postcss` high (`<=8.5.17`, GHSA-r28c-9q8g-f849) | **fixed** | → 8.5.25. Supersedes the 2026-07-28 "deferred" row above; closes issue #48 |
| 2026-08-03 | `uuid` moderate (GHSA-w5hq-g745-h8pq) | accepted | Unchanged from 2026-07-28 — build-time only, via `xcode` ← `@expo/config-plugins` and `@expo/ngrok` (dev) |

## Security sweep — 2026-08-03

**The 2026-07-28 deferral is resolved.** That sweep discarded the safe pass
because it broke the React Native jest environment; issue #48 tracked it for a
human to land deliberately. Re-tested this sweep: **the breakage is gone.**
`npm audit fix` now moves the lockfile and the suite stays green at 331/331
across two consecutive runs, with `tsc --noEmit` clean and `npm ci` clean.

Nothing about this repo changed to fix it — upstream did. `brace-expansion`
backported its fix to the 1.x/2.x lines, so the resolution no longer has to
drag `@react-native/babel-preset` and `@react-native/babel-plugin-codegen`
along with it. The 2026-07-28 decision was correct on the evidence available
then; it simply expired.

### Fixed — safe pass (`npm audit fix`, no `--force`, lockfile-only)

`package.json` untouched.

| Package | Sev | Was → now | Advisory |
|---|---|---|---|
| `brace-expansion` | high | → 5.0.9 | GHSA-mh99-v99m-4gvg **and** GHSA-3jxr-9vmj-r5cp — **both fully resolved** |
| `postcss` | high | → 8.5.25 | GHSA-r28c-9q8g-f849 — **fully resolved** |

Distinct advisories: **4 → 1.** Distinct vulnerable packages: **3 → 1.**
Raw `npm audit` headline: **14 → 12**, and — unusually for this ecosystem — the
number moved the honest way for once: **both high-severity findings are gone**,
leaving 12 moderate entries that are all chain-flagged parents of the single
remaining `uuid` advisory.

### Accepted residual — 1

| Package | Sev | Advisory | Reason |
|---|---|---|---|
| `uuid` 7.0.3 / 3.4.0 | moderate | GHSA-w5hq-g745-h8pq | Unchanged from 2026-07-28. Build-time only: `xcode@3.0.1` (`^7.0.3`) ← `@expo/config-plugins`, and `@expo/ngrok@4.1.3` (`^3.3.2`, a devDependency). The advisory covers v3/v5/v6 **called with a `buf` argument**; `xcode` calls only `uuid.v4()` with no args. Only fix is an Expo major. |

### Privacy posture — unchanged

No dependency moved in this sweep touches the network, storage, or crypto path.
`tweetnacl`, `expo-secure-store`, and the circle-relay code are untouched; the
local-only posture and the single sanctioned relay exception above still hold.

### Verification

`npm ci` clean on a fresh tree, `npx jest --no-coverage` **331/331 twice**,
`npx tsc --noEmit` clean. Baseline before the fix was identical (331/331).

> **Windows note for the next sweep.** `npm audit fix` left the lockfile
> internally inconsistent (`@emnapi/wasi-threads@1.2.2` vs `1.2.3`) and `npm ci`
> refused with `EUSAGE`. `npm install` reconciled it, `package.json` still
> untouched. Separately, `npm ci`/`npm install` hit `ENOTEMPTY` and
> `Permission denied` deleting `node_modules` — a Windows file-locking
> artifact, **not** a lockfile defect. `cmd /c rmdir /s /q node_modules`
> followed by `npm ci` cleared it. Don't read those two failures as the same
> problem; only the first one is about the lockfile.

## Security sweep — 2026-07-28

`npm audit` on `master`: **53 vulnerabilities (44 high, 9 moderate)** — but only
**3 packages carry a real advisory**. The other 50 are parents flagged solely
for depending on them.

### Nothing was shipped this cycle — and why

The safe pass (`npm audit fix`, no `--force`) does fix real things here:
`postcss` resolves outright and two of `brace-expansion`'s three advisories
clear, taking distinct vulnerable packages from **3 → 2**.

It also **breaks the test suite**. The fix moves 140 packages (68 added, 36
removed, 36 changed), including `@react-native/babel-preset` and
`@react-native/babel-plugin-codegen`, and the React Native jest environment
stops initialising:

```
Invariant Violation: __fbBatchedBridgeConfig is not set, cannot invoke native modules
```

6+ suites fail (`settings`, `reflections`, `practiceFlowScreen`, `screenSmoke`,
`quiltRender`, `fieldGuideScreen`) — every suite that renders a component.
Baseline before the fix is green at **331/331**, so this is caused by the bump,
not pre-existing.

Per `forge/standards/security-triage.md` (rule 4: the unit suite must stay
green after every fix) the lockfile change was **discarded, not merged**. Both
remaining findings are build-time-only with no app-runtime path, so shipping a
broken RN jest environment to patch them is the wrong trade. Tracked as an
issue for a human to land deliberately, most likely alongside the next Expo
SDK upgrade.

### Flaky-first-run note

The very first `jest` run after a cold `npm install` failed 3 tests across 2
suites (`fieldGuideScreen`, plus one other); the next two runs passed 331/331
with no changes. Worth knowing before reading a single red CI run as a real
regression.

### Correction to a claim worth not repeating

An advisory range written `<=X` does **not** mean "no patch exists" — it
usually means X was the newest release when the advisory was published. Checked
against the registry on 2026-07-28: `postcss` is at 8.5.24 (range `<=8.5.17`)
and `brace-expansion` at 5.0.8 (range `<=5.0.7`). Both are patched upstream;
they are unreachable here only because the pinning parents cap the major. The
one genuine no-patch-exists case in this ecosystem is `ip` (advisory `<=2.0.1`,
latest release 2.0.1) — which this app does not depend on.
