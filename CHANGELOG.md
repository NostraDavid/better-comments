# Changelog

## [Unreleased]

## [1.0.1] - 2026-10-25

- Keep assigned Python triple-quoted strings unstyled across every comment detector.
- Reset language-specific detection when switching editors, preventing JavaScript JSDoc highlighting from leaking into Python.
- Exercise all comment detectors with Python block-marker configuration in regression tests.

## [1.0.0] - 2026-10-25

- Start the maintained NostraDavid fork while preserving `better-comments.*` settings.
- Keep Python `#!` text inside strings from receiving comment decorations.
- Add focused regression tests, reproducible tools, beginner documentation, and release packaging.

Earlier releases are archived in [the upstream changelog](docs/upstream-CHANGELOG.md).
