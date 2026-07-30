const path = require('path');
const dotenv = require('dotenv');
const HtmlWebpackPlugin = require('html-webpack-plugin');

dotenv.config();

const apiPort = process.env.PORT || 3000;

module.exports = {
  mode: 'development',
  entry: path.resolve(__dirname, 'client/src/index.tsx'),
  output: {
    path: path.resolve(__dirname, 'client/dist'),
    filename: 'bundle.js',
    clean: true,
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: path.resolve(__dirname, 'client/tsconfig.json'),
          },
        },
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'client/public/index.html'),
    }),
  ],
  devServer: {
    port: 8080,
    historyApiFallback: true,
    proxy: [
      {
        context: ['/api'],
        target: `http://localhost:${apiPort}`,
      },
    ],
  },
};
