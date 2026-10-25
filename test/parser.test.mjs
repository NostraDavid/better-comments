import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import vm from 'node:vm';

const moduleUrl = new URL('../out/parser.js', import.meta.url);
const require = createRequire(moduleUrl);
const source = fs.readFileSync(moduleUrl, 'utf8');

async function decorations(text, languageId = 'python', previousLanguages = [], settings = {}) {
  const rendered = [];
  const vscode = {
    workspace: {
      getConfiguration: () => ({
        multilineComments: true,
        highlightPlainText: false,
        tags: [{ tag: '!', color: '#ff0000' }],
        ...settings,
      }),
    },
    window: { createTextEditorDecorationType: () => ({}), showWarningMessage: () => {} },
    Range: class {
      constructor(start, end) {
        this.start = start;
        this.end = end;
      }
    },
  };
  const exports = {};
  vm.runInNewContext(source, {
    exports,
    require: (name) => name === 'vscode' ? vscode : require(name),
  }, { filename: moduleUrl.pathname });
  const editor = {
    document: {
      languageId,
      getText: () => text,
      positionAt: (offset) => {
        const lines = text.slice(0, offset).split('\n');
        return { line: lines.length - 1, character: lines.at(-1).length };
      },
    },
    setDecorations: (_style, ranges) => {
      for (const { range } of ranges) {
        rendered.push([range.start.line, range.start.character, range.end.character]);
      }
    },
  };
  const configuration = {
    GetCommentConfiguration: async (language) =>
      language === 'python'
        ? { lineComment: '#', blockComment: ['"""', '"""'] }
        : { lineComment: '//', blockComment: ['/*', '*/'] },
  };
  const parser = new exports.Parser(configuration);
  for (const language of previousLanguages) await parser.SetRegex(language);
  await parser.SetRegex(languageId);
  parser.FindSingleLineComments(editor);
  parser.FindBlockComments(editor);
  parser.FindJSDocComments(editor);
  parser.ApplyDecorations(editor);
  return rendered;
}

test('Python #! inside a string does not receive a comment decoration', async () => {
  const text = 'message = "#! this is a string"\n# ! this is a comment';
  assert.deepEqual(await decorations(text), [[1, 0, 21]]);
});

test('real Python inline comments still receive decorations', async () => {
  const text = 'message = "text"  # ! actual comment';
  assert.deepEqual(await decorations(text), [[0, 18, text.length]]);
});

test('a string marker does not hide a real comment on the same line', async () => {
  const text = 'message = "#! string"  # ! actual comment';
  assert.deepEqual(await decorations(text), [[0, text.lastIndexOf('#'), text.length]]);
});

for (
  const [name, value] of [
    ['single quotes', "value = '#! string'"],
    ['triple double quotes', 'value = """first\n#! string\nlast"""'],
    ['triple single quotes', "value = '''first\n#! string\nlast'''"],
    ['raw strings', 'value = r"\\path\\#! string"'],
    ['escaped quotes', 'value = "escaped \\" #! string"'],
    ['f-strings', 'value = f"{42} #! string"'],
    ['nested f-string quotes', 'value = f"{len("#! string")}"'],
  ]
) {
  test(`Python ${name} keep comment-looking text unstyled`, async () => {
    const text = `${value}\n# ! real`;
    assert.deepEqual(await decorations(text), [[value.split('\n').length, 0, 8]]);
  });
}

test('Python shebang remains unstyled', async () => {
  assert.deepEqual(await decorations('#!/usr/bin/env python\n# ! real'), [[1, 0, 8]]);
});

test('JavaScript comment decoration remains available', async () => {
  const text = 'const answer = 42; // ! actual comment';
  assert.deepEqual(await decorations(text, 'javascript'), [[0, 19, text.length]]);
});

test('assigned Python triple-quoted text is not a block comment', async () => {
  assert.deepEqual(await decorations('value = """\n! not a comment\n"""'), []);
});

test('JSDoc state does not leak from JavaScript into a Python string', async () => {
  const text = 'value = """\n/**\n * ! not a comment\n */\n"""';
  assert.deepEqual(await decorations(text, 'python', ['javascript']), []);
});

test('invalid tag entries do not hide valid comment tags', async () => {
  for (const invalid of [null, 42, {}, { tag: 42 }, { tag: 'bad', color: 42 }, { tag: 'bad', bold: 'yes' }]) {
    const text = 'value = 1  # ! real';
    assert.deepEqual(await decorations(text, 'python', [], { tags: [invalid, { tag: '!' }] }), [[0, 11, text.length]]);
  }
});

test('missing or empty tag settings safely produce no decorations', async () => {
  for (const tags of [null, 42, [], undefined]) {
    assert.deepEqual(await decorations('# ! real', 'python', [], { tags }), []);
  }
});

test('empty tags remain supported and duplicate tags keep the first style', async () => {
  const text = 'value = 1  # real';
  assert.deepEqual(await decorations(text, 'python', [], { tags: [{ tag: '' }, { tag: '' }] }), [[0, 11, text.length]]);
});
