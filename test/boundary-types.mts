import type { DecorationRenderOptions } from 'vscode';

export interface TestPosition {
  line: number;
  character: number;
}
export class TestRange {
  start: TestPosition;
  end: TestPosition;
  constructor(start: TestPosition, end: TestPosition) {
    this.start = start;
    this.end = end;
  }
}
export interface TestDecoration {
  range: TestRange;
}
export interface TestStyle {
  options: DecorationRenderOptions;
  disposed: boolean;
  dispose(): void;
}
export interface TestDocument {
  languageId: string;
  uri: { path: string };
  getText(): string;
  positionAt(offset: number): TestPosition;
}
export interface TestEditor {
  document: TestDocument;
  decorations: Map<TestStyle, TestDecoration[]>;
  setDecorations(style: TestStyle, ranges: readonly TestDecoration[]): void;
}
export interface TestSettings {
  [key: string]: unknown;
  multilineComments: boolean;
  highlightPlainText: boolean;
  tags: unknown;
  enabled?: boolean;
}
export interface TestDisposable {
  dispose(): void;
}
export type TestListener = (event?: unknown) => unknown;
