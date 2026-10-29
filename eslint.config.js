import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', '.claude', '.taste-skill', '.img2threejs'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    // Route configuration declares lazy page components; render/main.tsx is a dev-only entry
    // script. Neither is a hot-reloaded component module.
    files: ['src/app/routes.tsx', 'src/render/main.tsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  {
    // Three.js objects (materials, meshes, cameras) are designed to be mutated every frame
    // inside React Three Fiber's useFrame, outside React's render cycle. That is the
    // intended pattern, so the compiler's "hook values are immutable" rule doesn't apply here.
    files: ['src/three/**/*.{ts,tsx}'],
    rules: { 'react-hooks/immutability': 'off' },
  },
);
