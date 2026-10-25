import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { test } from 'node:test';
import vm from 'node:vm';

async function fixture() {
  const directory = new URL('../out/', import.meta.url);
  const require = createRequire(new URL('extension.js', directory));
  const listeners = {};
  const timers = new Map();
  let timerId = 0;
  const styles = [];
  const settings = { multilineComments: true, highlightPlainText: false, tags: [{ tag: '!', color: '#ff0000' }] };
  const editors = ['python', 'javascript'].map(languageId => {
    const text = languageId === 'python' ? '# ! work' : '// ! work';
    const document = {
      languageId,
      uri: { path: languageId },
      getText: () => text,
      positionAt: offset => ({ line: 0, character: offset }),
    };
    const decorations = new Map();
    return {
      document,
      decorations,
      setDecorations(style, ranges) {
        decorations.set(style, Array.from(ranges));
      },
    };
  });
  const subscribe = name => (handler, _thisArg, subscriptions) => {
    (listeners[name] ||= []).push(handler);
    const disposable = {
      dispose() {
        listeners[name] = listeners[name].filter(item => item !== handler);
      },
    };
    subscriptions?.push(disposable);
    return disposable;
  };
  const vscode = {
    Range: class {
      constructor(start, end) {
        this.start = start;
        this.end = end;
      }
    },
    Uri: { joinPath: (base, file) => ({ path: path.join(base.path, file) }) },
    window: {
      activeTextEditor: editors[0],
      visibleTextEditors: editors,
      createTextEditorDecorationType(options) {
        const style = {
          options,
          disposed: false,
          dispose() {
            this.disposed = true;
          },
        };
        styles.push(style);
        return style;
      },
      showWarningMessage() {},
      onDidChangeActiveTextEditor: subscribe('active'),
      onDidChangeVisibleTextEditors: subscribe('visible'),
    },
    workspace: {
      getConfiguration: () => ({ ...settings, get: (key, fallback) => settings[key] ?? fallback }),
      fs: {
        readFile: async uri =>
          new TextEncoder().encode(JSON.stringify({
            comments: uri.path.includes('python')
              ? { lineComment: '#', blockComment: ['"""', '"""'] }
              : { lineComment: '//', blockComment: ['/*', '*/'] },
          })),
      },
      onDidChangeTextDocument: subscribe('text'),
      onDidChangeConfiguration: subscribe('settings'),
      onDidOpenTextDocument: subscribe('open'),
      onDidCloseTextDocument: subscribe('close'),
    },
    extensions: {
      all: editors.map(editor => ({
        extensionUri: { path: '/extensions' },
        packageJSON: {
          contributes: {
            languages: [{ id: editor.document.languageId, configuration: editor.document.languageId + '.json' }],
          },
        },
      })),
      onDidChange: subscribe('extensions'),
    },
    Disposable: class {
      constructor(dispose) {
        this.dispose = dispose;
      }
    },
  };
  const cache = new Map();
  function load(name) {
    if (cache.has(name)) return cache.get(name).exports;
    const module = { exports: {} };
    cache.set(name, module);
    vm.runInNewContext(fs.readFileSync(new URL(name + '.js', directory), 'utf8'), {
      module,
      exports: module.exports,
      TextDecoder,
      setTimeout(callback) {
        const id = ++timerId;
        timers.set(id, callback);
        return id;
      },
      clearTimeout(id) {
        timers.delete(id);
      },
      require(specifier) {
        if (specifier === 'vscode') return vscode;
        if (specifier.startsWith('./')) return load(specifier.slice(2));
        return require(specifier);
      },
    });
    return module.exports;
  }
  const context = { subscriptions: [] };
  const extension = load('extension');
  await extension.activate(context);
  async function flush() {
    for (let attempt = 0; attempt < 10; attempt++) {
      await new Promise(resolve => setImmediate(resolve));
      if (!timers.size) continue;
      const callbacks = Array.from(timers.values());
      timers.clear();
      for (const callback of callbacks) await callback();
    }
  }
  await flush();
  function rendered(editor) {
    return Array.from(editor.decorations.entries()).filter(([style, ranges]) => !style.disposed && ranges.length).map((
      [style, ranges],
    ) => ({ color: style.options.color, count: ranges.length }));
  }
  return {
    editors,
    settings,
    styles,
    listeners,
    vscode,
    context,
    flush,
    rendered,
    async emit(name, event) {
      for (const handler of listeners[name] || []) await handler(event);
      await flush();
    },
  };
}

test('settings refresh all visible editors without reloading the extension', async () => {
  const f = await fixture();
  f.settings.tags = [{ tag: '!', color: '#00ff00' }];
  await f.emit('settings', { affectsConfiguration: section => section === 'better-comments' });
  for (const editor of f.editors) {
    assert.deepEqual(f.rendered(editor), [{ color: '#00ff00', count: 1 }], editor.document.languageId);
  }
});

test('disposing the extension clears decorations and pending updates', async () => {
  const f = await fixture();
  await f.emit('text', { document: f.editors[0].document });
  for (const item of f.context.subscriptions) item.dispose();
  assert.ok(f.styles.every(style => style.disposed));
  for (const editor of f.editors) assert.deepEqual(f.rendered(editor), []);
});
