import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      'no-unused-vars': ['error', { caughtErrors: 'none' }],
      // Estes efeitos carregam estado remoto; a regra do React Compiler trata
      // esse padrÃ£o vÃ¡lido como atualizaÃ§Ã£o sÃ­ncrona local.
      'react-hooks/set-state-in-effect': 'off',
      // Callbacks de effects executam depois da inicializaÃ§Ã£o do componente.
      'react-hooks/immutability': 'off',
    },
  },
])
