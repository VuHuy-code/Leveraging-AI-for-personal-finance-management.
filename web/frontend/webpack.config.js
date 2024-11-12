const path = require('path');

module.exports = {
  entry: './src/index.js',  // File đầu vào
  output: {
    path: path.resolve(__dirname, 'dist'),  // Thư mục đầu ra
    filename: 'bundle.js',  // File đầu ra
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,  // Áp dụng với file .js và .jsx
        exclude: /node_modules/,  // Loại trừ thư mục node_modules
        use: {
          loader: 'babel-loader',
        },
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  devServer: {
    static: path.join(__dirname, 'dist'),
    compress: true,
    port: 3000,
  },
};