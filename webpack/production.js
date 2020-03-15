const _ = require('lodash');
// eslint-disable-next-line
const webpackMerge = require('webpack-merge');
const development = require('./development');

const commonConfig = {
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
};

const clientConfig = webpackMerge(development[0], _.defaultsDeep(_.cloneDeep(commonConfig), {

}));

const serverConfig = webpackMerge(development[1], _.defaultsDeep(_.cloneDeep(commonConfig), {

}));

module.exports = [clientConfig, serverConfig];
