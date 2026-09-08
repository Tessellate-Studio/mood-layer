#!/bin/sh

# One-time hook setup. Run from the repo root:  sh .husky/install.sh
#
# Also run it in a NEW WORKTREE — worktrees share repo config, so hooksPath is
# usually inherited, but the chmod is per-checkout on some setups and the
# reset below is cheap insurance.

echo "🔧 Setting up git hooks…"

if [ ! -e .git ]; then
  echo "❌ Not a git repository (or worktree) — run this from the repo root."
  exit 1
fi

# MUST stay relative. Git worktrees share repo config: a relative hooksPath
# resolves against each worktree's own root, so every worktree runs its own
# checked-out hook. An absolute path makes every worktree run the main
# checkout's possibly-stale copy.
git config core.hooksPath .husky

chmod +x .husky/pre-commit .husky/pre-push 2>/dev/null || true

echo "✅ hooks installed (core.hooksPath = .husky)"
echo "   pre-commit runs: branch guard, secret scan, signing-material + large-file guard"
echo "   pre-push runs:   tsc --noEmit (FULL_PREPUSH=1 adds jest)"
echo "   skip once:       git commit/push --no-verify"
