# Security — disposition log

Dependency alerts and security findings are triaged per the shared policy in
`forge/standards/security-triage.md` (forge plugin). Each triaged item gets a row
here: date → alert → disposition (fix / accept / not-applicable) → why.

Privacy posture of this app (context for triage): **local-only**. All user data
(emotion check-ins, journal text) stays on-device in AsyncStorage. No accounts,
no network calls with user data, no analytics or crash-reporting SDKs. Any
dependency or change that would move emotional data off the device is a
security/privacy finding by definition — see the hard rules in `CLAUDE.md`.

| Date | Alert / finding | Disposition | Why |
|---|---|---|---|
| — | — | — | — |
