import prettier from 'eslint-plugin-prettier';
import nodePlugin from 'eslint-plugin-node';

export default [
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs'
    },
    plugins: {
      prettier,
      node: nodePlugin
    },
    rules: {
      'prettier/prettier': 'error',
      'no-unused-vars': 'warn',
      'no-console': 'off'
    }
  }
];
