#!/usr/bin/env -S just --justfile

set shell := ["bash", "-euo", "pipefail", "-c"]
set positional-arguments

[group('repository')]
default:
    @just --list --unsorted

[group('development')]
sync:
    npm ci

[group('development')]
setup: sync
    prek validate-config .pre-commit-config.yaml
    @hooks_path="$(git config --path --get core.hooksPath || true)"; \
        if [[ -z "$hooks_path" ]]; then \
            prek install; \
        elif [[ "$hooks_path" == "$HOME/.config/git/hooks" && "$PWD" == "$HOME/dev/"* ]] && grep -Fq 'exec prek run --stage pre-commit' "$hooks_path/pre-commit"; then \
            echo "Using the shared prek dispatcher."; \
        else \
            echo "Existing Git hooks need a reviewed prek integration: $hooks_path" >&2; \
            exit 1; \
        fi

[group('quality')]
check: format-check lint type-check test build release-check flake-check audit-all

[group('quality')]
format:
    dprint fmt --config dprint.json --config-discovery=false
    just --fmt --unstable
    nixfmt flake.nix

[group('quality')]
format-check:
    dprint check --config dprint.json --config-discovery=false
    just --fmt --check --unstable
    nixfmt --check flake.nix

[group('quality')]
lint:
    oxlint --deny-warnings scripts test src webpack.config.mts
    statix check flake.nix
    deadnix --fail flake.nix
    actionlint

[group('quality')]
type-check:
    npm run type-check

[group('quality')]
test:
    npm test

[group('build')]
build:
    npm run build

[group('quality')]
flake-check:
    nix flake check --all-systems --no-build --no-write-lock-file

[group('quality')]
audit-all:
    npm audit --audit-level=moderate

[group('quality')]
pre-commit:
    prek run --config .pre-commit-config.yaml --all-files

[group('release')]
release-check:
    node scripts/release-notes.mts

[group('release')]
package: release-check
    npm run package

[group('release')]
version increment="patch":
    npm version --no-git-tag-version "$1"

[group('dependencies')]
lock-upgrade:
    npm update

[group('dependencies')]
update-nix:
    nix flake update

[group('repository')]
changelog baseline="HEAD^" target="HEAD":
    git log --no-merges --format='- %s' "$1..$2"
