import path from 'node:path';
import type { Configuration } from 'webpack';

const configurations: Configuration[] = (['node', 'webworker'] as const).map(target => ({
  target,
  entry: './out/extension.js',
  output: {
    filename: 'extension.js',
    path: path.resolve(import.meta.dirname, target === 'node' ? 'dist' : 'dist/web'),
    libraryTarget: 'commonjs2',
  },
  externals: { vscode: 'commonjs vscode' },
  devtool: false,
}));

export default configurations;
