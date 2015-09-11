import path from 'path';
import webpack from 'webpack';

export default {
  devtool: 'eval',
  entry: [
    'webpack-dev-server/client?http://localhost:3000',
    'webpack/hot/only-dev-server',
    './src/index'
  ],
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/static/'
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin()
  ],
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel',
        include: path.join(__dirname, 'src'),
        query: {
          stage: 0,
          plugins: ['./build/babel-relay-plugin']
        }
      },
      //{
      //  test: /\.js$/,
      //  loader: 'react-hot',
      //  include: path.join(__dirname, 'src')
      //}
    ]
  }
};
