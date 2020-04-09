/* eslint-disable no-console */
const _ = require('lodash');
// eslint-disable-next-line
const webpack = require('webpack');
const path = require('path');
// eslint-disable-next-line
const nodeExternals = require('webpack-node-externals');
const childProcess = require('child_process');

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
  plugins: [
    {
      apply: (compiler) => {
        let ps = null;
        let watchEnabled = false;

        async function startServer() {
          const serverPath = path.join(__dirname, '../dist/server.js');
          console.log(`Starting ${serverPath} ...`);
          ps = childProcess.spawn('node', [serverPath]);

          ps.stdout.on('data', (data) => {
            process.stdout.write(data);
          });

          ps.stderr.on('data', (data) => {
            process.stderr.write(data);
          });

          // Automatically restart the server if it crashes.
          ps.once('close', () => {
            console.log('Crash detected, restarting ...');
            startServer();
          });
        }

        // https://webpack.js.org/api/compiler-hooks/
        compiler.hooks.afterEmit.tap('RunServer', () => {
          if (watchEnabled) {
            if (ps !== null) {
              console.log('Killing old process ...');
              ps.kill();
            } else {
              startServer();
            }
          }
        });

        compiler.hooks.watchRun.tap('RunServer', () => {
          console.log('Watch enabled, will restart server process automatically');
          watchEnabled = true;
        });
      },
    },
  ],
});

module.exports = [clientConfig, serverConfig];
