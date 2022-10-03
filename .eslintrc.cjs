module.exports = {
  parserOptions: {
    ecmaVersion : 2022,
    sourceType  : 'module'
  },
  env: {
    node: true,
  },
  extends: [
    'eslint:recommended',
  ],
  plugins : ['import'],
  rules   : {
    'key-spacing': [
      'error',
      {
        'align': {
          'afterColon'  : true,
          'beforeColon' : true,
          'on'          : 'colon'
        }
      }
    ],
    'quotes': [
      'error',
      'single',
      { 'allowTemplateLiterals': true }
    ],
    'semi'         : ['error', 'always'],
    'indent'       : ['error', 2],
    'import/order' : ['error', {
      groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'object', 'type']
    }]
  }
};