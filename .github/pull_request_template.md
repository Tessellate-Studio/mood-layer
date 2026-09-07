## Summary
<!-- Brief description of what this PR does -->

## Related Issue
<!-- Link to the issue this PR addresses -->
Closes #

## Changes
- [ ] Change 1
- [ ] Change 2

## Screenshots
<!-- Required for any visual change. A screenshot from the DEVICE, not the
     simulator, if the change touches spacing, typography or colour. -->

## Automated Test Coverage

```bash
npx tsc --noEmit
npx jest --no-coverage
```

**Local hooks** (run automatically — see `.husky/`):
- ✅ pre-commit: no direct commits to `master`, secret scan, no signing material, no files >500KB
- ✅ pre-push: `tsc --noEmit` on code pushes; `FULL_PREPUSH=1` also runs jest
- ⚠️ Warnings (non-blocking): `any` types, WIP markers, quality-pass reminder

> 💡 First checkout (or a new worktree)? Run `sh .husky/install.sh` once.

## Device verification
<!-- Every UI change needs a device-test queue item before this merges —
     forge standards/workflows.md → "Device-test queue" (issue #66).
     Say which item covers this, or why none is needed. -->

- [ ] Queued as a device-test item: #
- [ ] Reachable by OTA (`eas update`), or — needs a native build (label `build-time`)
- [ ] N/A — no user-visible change

## Breaking Changes
<!-- Anything that changes the on-device data shape needs a migration.
     All user data stays on-device: a bad migration is unrecoverable for
     existing users, there is no server-side copy to restore from. -->

None

## Checklist
- [ ] Tests verify expected behavior, not implementation
- [ ] All automated tests passing
- [ ] Documentation updated (CLAUDE.md, PROJECT_DOCS.md, USER_PATHS.md)
- [ ] No secrets, signing material, or user data in the diff
- [ ] Self-reviewed the code
