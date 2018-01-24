const path = require('path');

const phaserBase = path.join(__dirname, '/node_modules/phaser-ce/')
const phaser = path.join(phaserBase, 'build/custom/phaser-split.js');
const pixi = path.join(phaserBase, 'build/custom/pixi.js');
const p2 = path.join(phaserBase, 'build/custom/p2.js');

const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  devtool: 'source-map',
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    compress: true,
    port: 9000,
    inline: true,
    watchOptions: {
      aggregateTimeout: 300,
      poll: true,
      ignored: /node_modules/,
    },
  },
  entry: path.join(__dirname, 'src/index.ts'),
  module: {
    rules: [
      { test: /.ts$/, loaders: ['awesome-typescript-loader'] },
      { test: /pixi\.js$/, loaders: ['expose-loader?PIXI'] },
      { test: /phaser-split\.js$/, loaders: ['expose-loader?Phaser'] },
      { test: /p2\.js$/, loaders: ['expose-loader?p2'] },
    ],
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'index.js',
  },
  plugins: [
    new HtmlWebpackPlugin(),
  ],
  resolve: {
    alias: {
      phaser,
      pixi,
      p2,
    },
    extensions: ['.ts', '.js'],
  },
};
