# Better Comments by NostraDavid

Comment highlighting that distinguishes Python comments from strings. Existing better-comments.* settings remain supported.

A maintained fork of [aaron-bond/better-comments](https://github.com/aaron-bond/better-comments). Original authorship and license notices are preserved. This fork starts at **1.0.0**.

## Install

Download `nostradavid-better-comments-1.0.0.vsix` from [GitHub Releases](https://github.com/NostraDavid/better-comments/releases). In VS Code, open Extensions, choose **Install from VSIX**, and select that file.

Disable `aaron-bond.better-comments` before enabling this fork to avoid duplicate decorations. Existing `better-comments.*` settings keep their names.

See [the beginner guide](docs/getting-started.md), [contribution guide](CONTRIBUTING.md), [changelog](CHANGELOG.md), and [release guide](docs/releasing.md).

## Development

Install Nix, enter `nix develop`, then run `just setup` and `just check`. Run `just package` to build a VSIX. The flake supports x86_64/aarch64 Linux and macOS, including Intel macOS through the pinned Nixpkgs revision.

Dependency upgrades are explicit: `just lock-upgrade` and `just update-nix`. Normal setup uses the committed locks.

Tag and color changes apply immediately to all visible editors. Closing an editor or disabling the extension clears its decorations and pending updates.
