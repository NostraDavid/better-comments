# Contributing

1. Clone this repository and enter its directory.
2. Run `nix develop`, then `just setup`. This installs the locked npm dependencies and verifies the shared prek dispatcher, or installs a local hook when no hook path is configured.
3. Run `just` to see grouped developer commands.
4. Make a focused change and add a regression test for a demonstrated bug.
5. Run `just format`, `just check`, `just package`, and `just pre-commit`.
6. Add a user-facing entry under `Unreleased` in `CHANGELOG.md`.

The root `.gitignore` is an allowlist. Add new source directories explicitly and keep credentials, `.env` files, VSIX bundles, and dependency/build directories ignored. Use an explicit baseline for `just changelog` when the repository has no parent commit.

VS Code owns extension activation. Press F5 to launch an isolated Extension Development Host; do not add a service manager or production credentials.
