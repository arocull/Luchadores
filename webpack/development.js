const _ = require('lodash');
// eslint-disable-next-line
const webpack = require('webpack');
const path = require('path');
// eslint-disable-next-line
const nodeExternals = require('webpack-node-externals');

// https://webpack.js.org/concepts/targets/
// Also suggests splitting up the config into two pieces... Better for us anyway.

const commonConfig = {
  mode: 'development',
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
};

const clientConfig = _.defaultsDeep(_.cloneDeep(commonConfig), {
  target: 'web',
  entry: {
    client: './src/client/client.ts',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, '../dist/public'),
  },
  plugins: [
    new webpack.DefinePlugin({
      CANVAS_RENDERER: JSON.stringify(true),
      WEBGL_RENDERER: JSON.stringify(true),
    }),
  ],
  devtool: 'eval-source-map', // inline-source-map
});

const serverConfig = _.defaultsDeep(_.cloneDeep(commonConfig), {
  target: 'node',
  entry: {
    server: './src/server/server.ts',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, '../dist'),
  },
  externals: [nodeExternals()],
});

module.exports = [clientConfig, serverConfig];
