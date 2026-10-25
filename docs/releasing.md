# Release small changes

Keep a short `Unreleased` changelog entry for each user-visible change. The first NostraDavid release is 1.0.0; later bug fixes normally use a patch release.

1. Run `just version patch` for the next version.
2. Move the corresponding changelog notes into a dated version heading.
3. Run `just format`, `just check`, `just package`, and `just pre-commit`.
4. Commit the version and changelog with a scoped message.
5. Push the commit and its matching `vX.Y.Z` tag when publication is authorized. The Release workflow builds the GitHub VSIX asset.
6. Upload the exact GitHub VSIX through [the NostraDavid publisher page](https://marketplace.visualstudio.com/manage/publishers/nostradavid). Wait for verification before announcing availability.

The Marketplace job uses a repository secret named `VSCE_PAT` when that credential path is available. Without that secret, the workflow reports a notice and leaves Marketplace upload to the publisher portal. Never put the token in source files or chat. New Azure DevOps organizations currently require an active Azure subscription. Native GitHub trusted publishing is not yet available on the Marketplace backend. Recheck current Microsoft requirements before enabling automation; global PAT retirement is announced for 2026-12-01.

For an existing release, dispatch the Release workflow with its tag to retry publication without replacing the release asset. Do not rewrite a published tag or VSIX.
