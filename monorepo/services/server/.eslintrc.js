module.exports = {
  extends: 'airbnb-base',
  parserOptions: {
    ecmaVersion: 2020,
  },
  plugins: [
    'import',
  ],
  rules: {
    'no-underscore-dangle': ['error', { allow: ['_id', '__typename'] }],
  },
};
