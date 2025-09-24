module.exports = {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-recommended',
  ],
  rules: {
    // Disable rules that conflict with CSS modules
    'selector-class-pattern': null,
    'no-descending-specificity': null,
    'declaration-block-no-duplicate-custom-properties': null,
    'property-no-unknown': [true, { 
      ignoreProperties: ['composes', 'compose-with']
    }],
    'selector-pseudo-class-no-unknown': [
      true,
      {
        ignorePseudoClasses: ['global', 'local']
      }
    ],
    
    // Basic formatting
    'rule-empty-line-before': [
      'always-multi-line',
      {
        except: ['first-nested'],
        ignore: ['after-comment']
      }
    ],
    'at-rule-empty-line-before': [
      'always',
      {
        except: ['blockless-after-same-name-blockless', 'first-nested'],
        ignore: ['after-comment']
      }
    ],
  },
  ignoreFiles: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
  ],
};
