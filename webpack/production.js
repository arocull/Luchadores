// eslint-disable-next-line
const webpackMerge = require('webpack-merge');
const development = require('./development');

module.exports = webpackMerge(development, {
  mode: 'production',
  devtool: false,
  watch: false,
  performance: {
    maxEntrypointSize: 900000,
    maxAssetSize: 900000,
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
    },
  },
});
