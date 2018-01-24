const path = require('path');

const phaserModulePath = path.join(__dirname, '/node_modules/phaser-ce/');

module.exports = {
  webpack(config) {
    if (!config.module) {
      config.module = {};
    }

    if (!config.module.rules) {
      config.module.rules = [];
    }

    config.module.rules = config.module.rules.concat([
      { test: /.ts$/, loaders: ['awesome-typescript-loader'] },
      { test: /pixi\.js$/, loaders: ['expose-loader?PIXI'] },
      { test: /phaser-split\.js$/, loaders: ['expose-loader?Phaser'] },
      { test: /p2\.js$/, loaders: ['expose-loader?p2'] },
    ]);

    if (!config.resolve) {
      config.resolve = {};
    }

    if (!config.resolve.alias) {
      config.resolve.alias = {};
    }

    config.resolve.alias.phaser = path.join(phaserModulePath, 'build/custom/phaser-split.js');
    config.resolve.alias.pixi = path.join(phaserModulePath, 'build/custom/pixi.js');
    config.resolve.alias.p2 = path.join(phaserModulePath, 'build/custom/p2.js');

    if (!config.resolve.extensions) {
      config.resolve.extensions = [];
    }

    if (!config.resolve.extensions.find(x => x === '.ts')) {
      config.resolve.extensions.push('.ts');
    }

    return config;
  }
};
