import * as vscode from 'vscode';
import { Configuration } from './configuration';
import { Parser } from './parser';

export function activate(context: vscode.ExtensionContext) {
  const configuration = new Configuration();
  const entries = new Map<vscode.TextEditor, {
    parser: Parser;
    revision: number;
    timer?: ReturnType<typeof setTimeout>;
  }>();
  let disposed = false;

  function schedule(editor: vscode.TextEditor, reload = false) {
    let entry = entries.get(editor);
    if (!entry) {
      entry = { parser: new Parser(configuration), revision: 0 };
      entries.set(editor, entry);
    }
    if (reload) entry.parser.ReloadConfiguration(editor.document);
    const current = entry;
    const revision = ++current.revision;
    clearTimeout(current.timer);
    current.timer = setTimeout(async () => {
      const document = editor.document;
      const language = document.languageId;
      await current.parser.SetRegex(language);
      if (
        disposed || revision !== current.revision || editor.document !== document
        || editor.document.languageId !== language || !vscode.window.visibleTextEditors.includes(editor)
      ) return;
      if (current.parser.supportedLanguage) {
        current.parser.FindSingleLineComments(editor);
        current.parser.FindBlockComments(editor);
        current.parser.FindJSDocComments(editor);
      }
      current.parser.ApplyDecorations(editor);
    }, 100);
  }

  function visibleChanged() {
    for (const [editor, entry] of entries) {
      if (!vscode.window.visibleTextEditors.includes(editor)) {
        clearTimeout(entry.timer);
        entry.revision++;
        entry.parser.Dispose();
        entries.delete(editor);
      }
    }
    for (const editor of vscode.window.visibleTextEditors) schedule(editor);
  }

  vscode.window.onDidChangeVisibleTextEditors(visibleChanged, null, context.subscriptions);
  vscode.window.onDidChangeActiveTextEditor(
    editor => {
      if (editor) schedule(editor);
    },
    null,
    context.subscriptions,
  );
  vscode.workspace.onDidChangeTextDocument(
    event => {
      for (const editor of vscode.window.visibleTextEditors) {
        if (editor.document === event.document) schedule(editor);
      }
    },
    null,
    context.subscriptions,
  );
  vscode.workspace.onDidChangeConfiguration(
    event => {
      for (const editor of vscode.window.visibleTextEditors) {
        if (event.affectsConfiguration('better-comments', editor.document)) schedule(editor, true);
      }
    },
    null,
    context.subscriptions,
  );
  vscode.extensions.onDidChange(
    () => {
      configuration.UpdateLanguagesDefinitions();
      visibleChanged();
    },
    null,
    context.subscriptions,
  );
  context.subscriptions.push(
    new vscode.Disposable(() => {
      disposed = true;
      for (const entry of entries.values()) {
        clearTimeout(entry.timer);
        entry.parser.Dispose();
      }
      entries.clear();
    }),
  );
  visibleChanged();
}

export function deactivate() {}
