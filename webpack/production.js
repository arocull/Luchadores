const path = require('path');
const development = require('./development');
const webpackMerge = require('webpack-merge');

module.exports = webpackMerge(development, {
  mode: 'production',
  devtool: false,
  watch: false,
  performance: {
    maxEntrypointSize: 900000,
    maxAssetSize: 900000
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
    },
  },
});
