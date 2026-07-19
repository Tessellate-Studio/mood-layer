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
