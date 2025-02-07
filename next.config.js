const path = require('path');

module.exports = {
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(glsl|vs|fs)$/,
      loader: 'shader-loader',
      options: {
        glsl: {
          chunkPath: path.resolve(__dirname, 'src/shaders/chunks'),
        },
      },
    });
    return config;
  },
  sassOptions: {
    includePaths: [path.join(__dirname, 'styles')],
  },
};