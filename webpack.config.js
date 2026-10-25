const path = require('node:path');

module.exports = ['node', 'webworker'].map((target) => ({
  target,
  entry: './src/extension.ts',
  output: {
    filename: 'extension.js',
    path: path.resolve(__dirname, target === 'node' ? 'dist' : 'dist/web'),
    libraryTarget: 'commonjs2',
  },
  resolve: { extensions: ['.ts', '.js'] },
  module: { rules: [{ test: /\.ts$/, exclude: /node_modules/, use: 'ts-loader' }] },
  externals: { vscode: 'commonjs vscode' },
  devtool: false,
}));
