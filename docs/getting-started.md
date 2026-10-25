# Getting started

## Use the extension

1. Download the VSIX from [the releases page](https://github.com/NostraDavid/better-comments/releases).
2. Open VS Code and select the Extensions view.
3. Open the three-dot menu, select **Install from VSIX**, and select the downloaded file.
4. Disable the original Better Comments extension. In a Python file, a real `# !` comment is colored while `"#! inside a string"` is left as a string.

## Make your first change

Install Nix, clone the repository, run `nix develop`, and run `just setup`. Use `just` to list commands. Edit a small file, run `just format` and `just check`, then use F5 to try the extension. `just package` creates a local VSIX; it does not upload it.
