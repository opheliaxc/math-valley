# Git workflow (local only)

Math Valley uses Git on this computer only. There is no GitHub remote required.

## Branches

- `main` is always the working line you trust.
- One branch per change:
  - `feature/<what>` — new work (example: `feature/landing-page`)
  - `fix/<what>` — bug fixes (example: `fix/session-submit`)
  - `chore/<what>` — tooling / cleanup (example: `chore/gitignore`)

## Commit messages

Format: `<area>(optional-step): <short what>`

Examples:

- `landing(S3): navigation bar`
- `db(S5): attempts repository`
- `fix: unlock fractions after mastery`
- `chore: tighten gitignore`

One commit per finished and tested step from your plans. Commit only after you say the test passed.

## Merging

When a feature branch is finished and tested, merge it into `main` with a plain merge:

```bash
git switch main
git merge feature/my-thing
```

## Handy commands

```bash
# What changed?
git status
git diff

# Undo uncommitted edits to one file
git restore path/to/file

# Look around at an earlier commit (read-only visit)
git switch --detach baseline   # or any commit SHA
git switch main                # come back

# New branch from main
git switch main
git switch -c feature/my-thing
```

## Pre-commit safety hook

A plain shell hook blocks commits that stage:

- `*.db`, `*.db-wal`, `*.db-shm`
- anything under `server/data/` except `.gitkeep`
- `.env` / `.env.*` except `.env.example`
- anything under `node_modules/`

Git does **not** copy hooks when you clone. The tracked source lives at `scripts/git-hooks/pre-commit`. Re-enable it from the repo root with:

```bash
cp scripts/git-hooks/pre-commit .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit
```
