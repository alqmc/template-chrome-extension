module.exports = {
  parser: 'vue-eslint-parser',
  extends: ['plugin:@typescript-eslint/recommended'],
  parserOptions: {
    parser: '@typescript-eslint/parser',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
      tsx: true
    }
  },
  rules: {
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'comma-dangle': ['off', 'always-multiline'], // 添加结尾的逗号
    'no-param-reassign': ['error', { props: false }], // 参数不可改变，属性可改变
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/ban-types': 0,
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-empty-function': 0,
    '@typescript-eslint/no-unused-vars': [
      'error',
      { vars: 'all', args: 'after-used', ignoreRestSiblings: true }
    ],
    semi: ['error', 'always'],
    indent: ['error', 2, { SwitchCase: 1, flatTernaryExpressions: true }], // 使用两个空格，switch强制缩进default:0
    camelcase: 'off'
  }
};
