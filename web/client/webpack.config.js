const path = require('path');
const { VueLoaderPlugin } = require('vue-loader');
const ExitOnCompletePlugin = require('./ExitOnCompletePlugin');

module.exports = {
  mode: 'development',
  entry: './src/index.ts',
  watch: false,
  output: {
    path: path.resolve(__dirname, 'build/client/build'),
    filename: 'build.js',
    publicPath: 'build/',
  },
  resolve: {
    extensions: ['.ts', '.js', '.vue'],
    alias: {
      vue$: 'vue/dist/vue.esm.js',
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules|vue\/src/,
        loader: 'ts-loader',
        options: {
          appendTsSuffixTo: [/\.vue$/],
        },
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader',
      },
      {
        test: /\.(jpe?g|png|gif|svg|jpg)$/i,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]', // Preserve original filenames
              outputPath: 'images/',
              publicPath: 'images/',
            },
          },
          {
            loader: 'image-webpack-loader',
            options: {
              mozjpeg: {
                progressive: true,
                quality: 50,
              },
              gifsicle: {
                interlaced: false,
              },
              optipng: {
                optimizationLevel: 7,
              },
              pngquant: {
                quality: '75-90',
                speed: 3,
              },
            },
          },
        ],
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              sourceMap: true,
            },
          },
        ],
      },
    ],
  },
  plugins: [new VueLoaderPlugin(), new ExitOnCompletePlugin()],
  performance: {
    hints: false,
  },
  devtool: 'source-map',
};
