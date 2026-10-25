import * as vscode from 'vscode';

import * as json5 from 'json5';

export class Configuration {
  private readonly commentConfig = new Map<string, Promise<CommentConfig | undefined>>();
  private readonly languageConfigFiles = new Map<string, vscode.Uri>();

  /**
   * Creates a new instance of the Parser class
   */
  public constructor() {
    this.UpdateLanguagesDefinitions();
  }

  /**
   * Generate a map of configuration files by language as defined by extensions
   * External extensions can override default configurations os VSCode
   */
  public UpdateLanguagesDefinitions() {
    this.commentConfig.clear();
    this.languageConfigFiles.clear();

    for (let extension of vscode.extensions.all) {
      let packageJSON = extension.packageJSON;

      if (packageJSON.contributes && packageJSON.contributes.languages) {
        for (let language of packageJSON.contributes.languages) {
          if (language.configuration) {
            let configPath = vscode.Uri.joinPath(extension.extensionUri, language.configuration);
            this.languageConfigFiles.set(language.id, configPath);
          }
        }
      }
    }
  }

  /**
   * Gets the configuration information for the specified language
   * @param languageCode
   * @returns
   */
  public async GetCommentConfiguration(languageCode: string): Promise<CommentConfig | undefined> {
    // * check if the language config has already been loaded
    if (this.commentConfig.has(languageCode)) {
      return this.commentConfig.get(languageCode);
    }

    // * if no config exists for this language, back out and leave the language unsupported
    if (!this.languageConfigFiles.has(languageCode)) {
      return undefined;
    }

    const filePath = this.languageConfigFiles.get(languageCode)!;
    const pending = Promise.resolve(vscode.workspace.fs.readFile(filePath))
      .then(rawContent => json5.parse(new TextDecoder().decode(rawContent)).comments as CommentConfig | undefined)
      .catch(() => undefined);
    this.commentConfig.set(languageCode, pending);
    return pending;
  }
}
