module.exports = {
  'env': {
    'browser': true,
    'es2021': true,
  },
  'extends': ['google', 'plugin:import/errors', 'plugin:import/warnings'],
  'parserOptions': {
    'ecmaVersion': 12,
    'sourceType': 'module',
  },
  'rules': {
  },
  'settings': {
    'import/resolver': {
      'babel-module': {},
    },
  },
};
