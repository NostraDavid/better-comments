import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const manifest = JSON.parse(fs.readFileSync(new URL('package.json', root), 'utf8')) as typeof import('../package.json');
const lock = JSON.parse(fs.readFileSync(new URL('package-lock.json', root), 'utf8')) as {
  version: string;
  packages: Record<string, { version: string }>;
};
const version = process.argv[2] ?? manifest.version;
assert.match(version, /^\d+\.\d+\.\d+$/, 'Use a stable version such as 1.0.1.');
assert.equal(manifest.version, version, 'The tag must match package.json.');
assert.equal(lock.version, version, 'Update package-lock.json with npm version.');
assert.equal(lock.packages[''].version, version, 'The lockfile root version must match.');
assert.equal(manifest.publisher, 'nostradavid');
assert.equal(manifest.name, 'nostradavid-better-comments');
assert.ok(!('__metadata' in manifest), 'Do not reuse the upstream Marketplace identity.');

const changelog = fs.readFileSync(new URL('CHANGELOG.md', root), 'utf8');
const heading = new RegExp(`^## \\[${version.replaceAll('.', '\\.')}\\] - \\d{4}-\\d{2}-\\d{2}$`, 'm');
const entry = heading.exec(changelog);
assert.ok(entry, `Add a dated changelog entry for ${version}.`);
const notes = changelog.slice(entry.index + entry[0].length).split(/^## |^\[Unreleased\]:/m)[0].trim();
assert.ok(notes, 'Describe what users gain from this release.');
console.log(notes);
