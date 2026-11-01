// eslint.config.js — ESLint flat config for hexa-studio
// Runtime prerequisites: Node.js >= 18.0.0, eslint >= 8.57.0 (npm install)
// Usage: npm run lint
export default [
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        THREE: 'readonly',
        gsap: 'readonly',
        ScrollTrigger: 'readonly',
        Lenis: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'off',
      'semi': ['error', 'always'],
      'quotes': ['warn', 'single', { avoidEscape: true }],
      'indent': ['warn', 2],
      'no-trailing-spaces': 'warn',
    },
  },
  {
    ignores: ['node_modules/', 'CLIPS/', 'assets/', 'media/'],
  },
];
