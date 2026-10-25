import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import vm from 'node:vm';

const moduleUrl = new URL('../out/parser.js', import.meta.url);
const require = createRequire(moduleUrl);
const source = fs.readFileSync(moduleUrl, 'utf8');

async function decorations(text, languageId = 'python', previousLanguages = [], settings = {}, captureColors = false) {
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
    window: { createTextEditorDecorationType: (options) => ({ options, dispose() {} }), showWarningMessage: () => {} },
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
        rendered.push(
          captureColors
            ? [_style.options.color, range.start.line, range.start.character, range.end.character]
            : [range.start.line, range.start.character, range.end.character],
        );
      }
    },
  };
  const configuration = {
    GetCommentConfiguration: async (language) =>
      language === 'python'
        ? { lineComment: '#', blockComment: ['"""', '"""'] }
        : ['shellscript', 'elixir', 'tcl'].includes(language)
        ? { lineComment: '#' }
        : language === 'html'
        ? { blockComment: ['<!--', '-->'] }
        : { lineComment: '//', blockComment: ['/*', '*/'] },
  };
  const parser = new exports.Parser(configuration);
  for (const language of previousLanguages) await parser.SetRegex(language);
  await parser.SetRegex(languageId);
  const scan = parser.ScanComments(editor.document);
  parser.FindSingleLineComments(editor, scan);
  parser.FindBlockComments(editor, scan);
  parser.FindJSDocComments(editor, scan);
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

for (const language of ['python', 'shellscript', 'elixir', 'tcl']) {
  test(`${language}: the first ordinary comment remains highlighted`, async () => {
    assert.deepEqual(await decorations('# ! task', language), [[0, 0, 8]]);
  });
  test(`${language}: only a file-leading shebang is ignored`, async () => {
    const text = '#!/usr/bin/env tool\r\n#! actual comment';
    assert.deepEqual(await decorations(text, language), [[1, 0, 17]]);
  });
}

test('single-line and block comments select the first longest matching tag', async () => {
  const tags = [{ tag: 'TODO', color: '#111111' }, { tag: '?', color: '#222222' }, { tag: 'TODO!', color: '#333333' }];
  for (
    const [text, color] of [
      ['//TODO? work', '#111111'],
      ['/*\nTODO? work\n*/', '#111111'],
      ['//TODO! work', '#333333'],
      ['/**\n * TODO! work\n */', '#333333'],
    ]
  ) {
    const ranges = await decorations(text, 'javascript', [], { tags }, true);
    assert.equal(ranges.length, 1, text);
    assert.equal(ranges[0][0], color, text);
  }
});

for (
  const [language, text, expected] of [
    ['javascript', '/* ! work */ const next = 1;', [[0, 3, 10]]],
    ['javascript', '/*! work\n! second\n*/', [[0, 2, 8], [1, 0, 8]]],
    ['javascript', '/** ! work */ const next = 1;', [[0, 4, 11]]],
    ['html', '<!-- ! work --> <div>code</div>', [[0, 5, 12]]],
    ['javascript', '/*\r\n * ! work\r\n */', [[1, 3, 9]]],
  ]
) {
  test(`${language}: block markers bound decorations in ${text}`, async () => {
    assert.deepEqual(await decorations(text, language), expected);
  });
}

test('disabling multiline comments also disables JSDoc decorations', async () => {
  assert.deepEqual(await decorations('/**\n * ! work\n */', 'javascript', [], { multilineComments: false }), []);
});

for (
  const [language, text] of [
    ['javascript', "const url = 'https://!example.org';"],
    ['javascript', "const value = '/* ! fake */';"],
    ['javascript', 'const value = `/**\n * ! fake\n */`;'],
    ['javascript', String.raw`const pattern = /\/\/!fake/;`],
    ['typescript', 'const value: "//! fake" = "//! fake";'],
    ['javascriptreact', '<div title="//! fake">//! text</div>'],
    ['typescriptreact', '<T,>(x:T) => <div title="/* ! fake */">{x}</div>'],
  ]
) {
  test(`${language}: comment-looking syntax in strings stays unstyled: ${text}`, async () => {
    assert.deepEqual(await decorations(text, language), []);
  });
}

for (const language of ['javascript', 'typescript', 'javascriptreact', 'typescriptreact']) {
  test(`${language}: a string marker cannot hide a real trailing comment`, async () => {
    const text = 'const url = "https://!fake"; // ! actual';
    assert.deepEqual(await decorations(text, language), [[0, text.lastIndexOf('//'), text.length]]);
  });
}

test('JSX block comments are recognized despite parser recovery nodes', async () => {
  const text = '<div>{/* ! actual */}</div>';
  assert.deepEqual(await decorations(text, 'javascriptreact'), [[0, text.indexOf('!'), text.indexOf('*/')]]);
});

test('comments inside template expressions remain supported', async () => {
  const text = 'const value = `//! fake ${1 /* ! real */}`;';
  assert.deepEqual(await decorations(text, 'javascript'), [[0, text.indexOf('! real'), text.indexOf('*/')]]);
});
