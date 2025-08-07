const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    target: 'web',
    mode: argv.mode || 'development',
    entry: './src/webview/index.tsx',
    output: {
      path: path.resolve(__dirname, 'dist', 'webview'),
      filename: isProduction ? '[name].[contenthash].js' : 'webview.js',
      clean: true,
      publicPath: ''
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.css']
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: {
            loader: 'ts-loader',
            options: {
              transpileOnly: true // Faster builds
            }
          }
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader']
        }
      ]
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/webview/index.html',
        minify: isProduction
      })
    ],
    optimization: {
      splitChunks: isProduction ? {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 20
          },
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: 'react',
            chunks: 'all',
            priority: 30
          },
          prism: {
            test: /[\\/]node_modules[\\/]prismjs[\\/]/,
            name: 'prism',
            chunks: 'all',
            priority: 25
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true
          }
        }
      } : false,
      usedExports: true,
      sideEffects: false
    },
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    cache: {
      type: 'filesystem',
      cacheDirectory: path.resolve(__dirname, '.webpack-cache')
    }
  };
};