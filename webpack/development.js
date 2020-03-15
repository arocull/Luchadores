const _ = require('lodash');
// eslint-disable-next-line
const webpack = require('webpack');
const path = require('path');

// https://webpack.js.org/concepts/targets/
// Also suggests splitting up the config into two pieces... Better for us anyway.

const commonConfig = {
  mode: 'development',
  devtool: 'eval-source-map', // inline-source-map
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
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

const clientConfig = _.defaultsDeep(commonConfig, {
  entry: {
    client: './src/client/client.ts',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, '../dist/public'),
  },
  target: 'web',
  plugins: [
    new webpack.DefinePlugin({
      CANVAS_RENDERER: JSON.stringify(true),
      WEBGL_RENDERER: JSON.stringify(true),
    }),
  ],
});

const serverConfig = _.defaultsDeep(commonConfig, {
  entry: {
    server: './src/server/server.ts',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, '../dist'),
  },
  target: 'node',
});

module.exports = [clientConfig, serverConfig];
