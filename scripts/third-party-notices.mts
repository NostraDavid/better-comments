import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8')) as {
  packages: Record<string, { dev?: boolean; devOptional?: boolean; link?: boolean }>;
};
const notices = [];
for (const [directory, dependency] of Object.entries(lock.packages)) {
  if (!directory || dependency.dev || dependency.devOptional || dependency.link) continue;
  const manifest = JSON.parse(fs.readFileSync(path.join(directory, 'package.json'), 'utf8')) as {
    name: string;
    version: string;
  };
  const license = fs.readdirSync(directory).find((name) => /^licen[cs]e(?:\.|$)/i.test(name));
  assert.ok(license, `Include the license for bundled dependency ${manifest.name}.`);
  const text = fs.readFileSync(path.join(directory, license), 'utf8').trim();
  assert.ok(text, `The license for ${manifest.name} must not be empty.`);
  notices.push(`${manifest.name} ${manifest.version}\n${'='.repeat(60)}\n${text}`);
}
assert.ok(notices.length > 0, 'Bundled runtime dependencies need license notices.');
fs.mkdirSync('dist', { recursive: true });
fs.writeFileSync('dist/THIRD_PARTY_NOTICES.txt', `${notices.join('\n\n')}\n`);
console.log(`Included ${notices.length} runtime dependency licenses.`);
