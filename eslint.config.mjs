// eslint.config.mjs — ESLint v9 Flat Config pour Next 15
import js from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import tseslint from 'typescript-eslint';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  // Base JS
  js.configs.recommended,

  // TypeScript (sans forcer type-check partout pour rester rapide)
  ...tseslint.configs.recommended,

  // Next.js (core web vitals)
  nextPlugin.configs['core-web-vitals'],

  // Règles communes
  {
    rules: {
      // ➜ on désactive les erreurs qui te bloquent
      '@typescript-eslint/no-explicit-any': 'off',
      'react/no-unescaped-entities': 'off',

      // warnings utiles mais non bloquants
      '@next/next/no-img-element': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
      'prefer-const': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/ban-ts-comment': [
        'warn',
        { 'ts-expect-error': 'allow-with-description', 'ts-ignore': true }
      ],
    },
  },

  // Règles spécifiques TS/TSX si tu veux (optionnel)
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json', // si tu veux activer des règles "type-aware"
      },
    },
    rules: {
      // tu peux en mettre d’autres ici si besoin
    },
  },
];