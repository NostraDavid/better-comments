import * as vscode from 'vscode';
import { Configuration } from './configuration';
import { Parser } from './parser';

export function activate(context: vscode.ExtensionContext) {
  const configuration = new Configuration();
  const entries = new Map<vscode.TextEditor, {
    parser: Parser;
    document: vscode.TextDocument;
    language: string;
    revision: number;
    timer?: ReturnType<typeof setTimeout>;
  }>();
  let disposed = false;

  function schedule(editor: vscode.TextEditor, reload = false) {
    let entry = entries.get(editor);
    if (!entry) {
      entry = {
        parser: new Parser(configuration, editor.document),
        document: editor.document,
        language: editor.document.languageId,
        revision: 0,
      };
      entries.set(editor, entry);
    }
    if (reload || entry.document !== editor.document || entry.language !== editor.document.languageId) {
      entry.parser.ReloadConfiguration(editor.document);
      entry.document = editor.document;
      entry.language = editor.document.languageId;
    }
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
      if (
        current.parser.supportedLanguage
        && vscode.workspace.getConfiguration('better-comments', document).get('enabled', true)
      ) {
        const scan = current.parser.ScanComments(document);
        current.parser.FindSingleLineComments(editor, scan);
        current.parser.FindBlockComments(editor, scan);
        current.parser.FindJSDocComments(editor, scan);
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
  vscode.workspace.onDidOpenTextDocument(
    document => {
      for (const editor of vscode.window.visibleTextEditors) {
        if (editor.document === document) schedule(editor);
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
