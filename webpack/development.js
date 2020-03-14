// eslint-disable-next-line
const webpack = require('webpack');
const path = require('path');

module.exports = {
  mode: 'development',
  devtool: 'eval-source-map', // inline-source-map
  // watch: true,
  entry: {
    client: './src/client/client.ts',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, '../dist'),
  },
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
  plugins: [
    new webpack.DefinePlugin({
      CANVAS_RENDERER: JSON.stringify(true),
      WEBGL_RENDERER: JSON.stringify(true),
    }),
  ],
};
