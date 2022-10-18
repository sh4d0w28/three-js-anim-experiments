const path = require('path');

module.exports = {
  mode: 'development',
  output: {
    path:path.resolve(__dirname, "dist"),
    filename: 'main.js'
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    compress: true,
    port: 9000,
  },
};