module.exports = {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-recommended',
  ],
  plugins: [
    'stylelint-declaration-strict-value',
  ],
  rules: {
    // Enforce using variables for colors, font families, and font weights
    'scale-unlimited/declaration-strict-value': [
      ['/color$/', 'font-family', 'font-weight', 'box-shadow'],
      {
        ignoreValues: {
          '/^inherit|currentColor|transparent|none$/': true,
        },
        ignoreFunctions: false,
      },
    ],
    // Enforce kebab-case for class selectors
    'selector-class-pattern': '^[a-z][a-zA-Z0-9]*(-[a-zA-Z0-9]+)*$',
    // Enforce consistent indentation
    indentation: 2,
    // Enforce consistent quotes
    'string-quotes': 'single',
    // Enforce consistent line breaks for properties
    'declaration-colon-newline-after': 'always-multi-line',
    // Disallow vendor prefixes (let autoprefixer handle them)
    'at-rule-no-vendor-prefix': true,
    'property-no-vendor-prefix': true,
    'selector-no-vendor-prefix': true,
    'value-no-vendor-prefix': true,
  },
  ignoreFiles: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
  ],
};
