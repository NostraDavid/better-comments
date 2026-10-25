import type { DecorationOptions, TextEditorDecorationType } from 'vscode';

export interface TagDefinition {
  tag: string;
  color?: string;
  backgroundColor?: string;
  strikethrough?: boolean;
  underline?: boolean;
  bold?: boolean;
  italic?: boolean;
}

export interface CommentTag {
  tag: string;
  escapedTag: string;
  decoration: TextEditorDecorationType;
  ranges: DecorationOptions[];
}

export interface Contributions {
  multilineComments: boolean;
  highlightPlainText: boolean;
  tags: unknown;
}

export interface CommentConfig {
  lineComment?: string | string[];
  blockComment?: [string, string];
}

export interface CommentConfiguration {
  GetCommentConfiguration(languageCode: string): Promise<CommentConfig | undefined>;
}
