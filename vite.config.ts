import { defineConfig } from 'vite';
import { resolve } from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    dts({
      insertTypesEntry: true,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'DevPreviewUI',
      fileName: (format) => `devpreview-ui.${format}.js`,
      formats: ['es', 'umd'],
    },
    rollupOptions: {
      external: ['codemirror'],
      output: {
        globals: {
          codemirror: 'CodeMirror',
        },
      },
    },
    sourcemap: true,
    minify: 'terser',
  },
  server: {
    open: true,
    port: 3000,
  },
});