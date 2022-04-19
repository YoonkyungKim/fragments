module.exports = {
  env: {
    node: true,
    commonjs: true,
    es2021: true,
    // To configure ESLint for Jest, see:
    // https://eslint.org/docs/user-guide/configuring/language-options#specifying-environments
    jest: true,
  },
  extends: 'eslint:recommended',
  parserOptions: {
    ecmaVersion: 'latest',
  },
  rules: {
    "indent": ["error", 2],
    "quotes": [2, "single", "avoid-escape"],
  },
};
