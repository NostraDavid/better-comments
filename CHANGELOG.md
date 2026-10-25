# Changelog

## [Unreleased]

## [1.0.7] - 2026-10-25

- Limit JavaScript, TypeScript, JSX and TSX decorations to real line/block comments using a small Lezer grammar shared with the existing Python parser runtime.
- Protect URLs, strings, templates, regular expressions and JSX text without losing real trailing comments.
- Parse once per editor update and preserve comment detection while code is incomplete.

## [1.0.6] - 2026-10-25

- Highlight compact and single-line block comments without coloring code after the closing delimiter.
- Handle opening-line tags, decorative asterisks and CRLF consistently in ordinary and JSDoc blocks.
- Apply the multiline setting to JSDoc comments as well. The boundary work follows upstream PR #457 by aarondill, adapted to preserve Python string filtering.

## [1.0.5] - 2026-10-25

- Use the first longest matching tag consistently in single-line, block and JSDoc comments.
- Preserve the first configured style for case-insensitive duplicate tags. The repeated-capture correction follows upstream PR #460 by aarondill.

## [1.0.4] - 2026-10-25

- Apply tag, color and comment-setting changes immediately in every visible editor.
- Keep parser state per editor and discard stale asynchronous updates.
- Dispose obsolete decoration types and pending updates when editors or the extension close.
- Refresh language definitions without retaining removed extension configurations.

## [1.0.3] - 2026-10-25

- Highlight genuine comments on the first line of Python, Elixir and Tcl files.
- Skip only a file-leading shebang, including shell scripts; retain later comment markers and CRLF support.

## [1.0.2] - 2026-10-25

- Validate tag settings without crashing activation; keep valid tags active when other entries are malformed.
- Keep empty tags supported and use the first configured style for case-insensitive duplicates.
- Describe tag fields in the settings schema, following upstream PR #400 by Take-Me1010.

## [1.0.1] - 2026-10-25

- Keep assigned Python triple-quoted strings unstyled across every comment detector.
- Reset language-specific detection when switching editors, preventing JavaScript JSDoc highlighting from leaking into Python.
- Exercise all comment detectors with Python block-marker configuration in regression tests.

## [1.0.0] - 2026-10-25

- Start the maintained NostraDavid fork while preserving `better-comments.*` settings.
- Keep Python `#!` text inside strings from receiving comment decorations.
- Add focused regression tests, reproducible tools, beginner documentation, and release packaging.

Earlier releases are archived in [the upstream changelog](docs/upstream-CHANGELOG.md).
