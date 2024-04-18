const path = require('path');

module.exports = {
  entry: './index.js', // Entry point of your application
  output: {
    filename: 'bundle.js', // Name of the bundled output file
    path: path.resolve(__dirname, 'dist'), // Output directory
  },
};
