// babel.config.js
module.exports = {
  presets: [
    [
      'next/babel',
      {
        'preset-react': {
          runtime: 'automatic',
        },
      },
    ],
  ],
  plugins: [
    [
      'babel-plugin-react-data-testid-generator',
      {
        attributes: ['data-testid'],
      },
    ],
  ],
};

=============

  npm install --save-dev babel-plugin-react-data-testid-generator
