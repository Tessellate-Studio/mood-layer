# Security — disposition log

Dependency alerts and security findings are triaged per the shared policy in
`forge/standards/security-triage.md` (forge plugin). Each triaged item gets a row
here: date → alert → disposition (fix / accept / not-applicable) → why.

Privacy posture of this app (context for triage): **local-only, with ONE
sanctioned exception**. All user data (emotion check-ins, journal text) stays
on-device in AsyncStorage. No accounts, no analytics, no crash-reporting SDKs.
Any dependency or change that would move emotional data off the device is a
security/privacy finding by definition — see the hard rules in `CLAUDE.md`.

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
  the function talks to Postgres directly). Rows delete on fetch; unclaimed
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
