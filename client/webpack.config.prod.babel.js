import path from 'path';
import ExtractTextPlugin from 'extract-text-webpack-plugin';

export default {
  devtool: false,
  entry: [
    './src/index'
  ],
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: path.join(__dirname, 'src')
      },
      {
        test: /\.scss$/,
        loader: ExtractTextPlugin.extract({use: ['css-loader', 'sass-loader']})
      },
      { test: /\.(png|jpg|svg)$/, loader: 'file-loader?name=images/[name].[ext]' }
    ]
  },
  plugins: [
    new ExtractTextPlugin('styles.css')
  ],
  output: {
    path: path.join(__dirname, 'static', 'assets'),
    filename: 'bundle.js',
    publicPath: '/assets/'
  }
};
