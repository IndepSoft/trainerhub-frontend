import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { globalIgnores } from 'eslint/config'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Alinea eslint con noUnusedParameters de tsconfig: el prefijo `_` marca
      // un binding intencionadamente sin usar (firma impuesta por un callback,
      // prop declarada pero aun no cableada).
      // El desacoplamiento de Supabase se sostiene aqui, no en la buena fe:
      // fuera de shared/infrastructure/supabase nadie puede importar el SDK ni
      // el cliente. Si migras a un backend propio, esta regla te garantiza que
      // no queda ninguna fuga escondida en un componente.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@supabase/*', '**/infrastructure/supabase/client'],
              message:
                'No importes Supabase directamente. Usa los puertos de @/shared/domain/ports via el container (@/app/container).',
            },
          ],
        },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    // El adaptador es, por definicion, el unico que conoce el proveedor.
    files: ['src/shared/infrastructure/supabase/**'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
  {
    // Componentes de shadcn/ui. El patron de la libreria es exportar el
    // componente junto a sus variantes de `cva` en el mismo fichero, lo que
    // choca de frente con react-refresh/only-export-components. No es un
    // defecto que podamos corregir sin desviarnos de la libreria y romper la
    // actualizacion de sus componentes, asi que la regla se desactiva aqui y
    // solo aqui. El resto del proyecto la sigue teniendo activa.
    files: ['src/shared/ui/**'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
