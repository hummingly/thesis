import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import typescript from '@rollup/plugin-typescript';
import { minifyHtml } from 'vite-plugin-html';

export default defineConfig({
  plugins: [solidPlugin(), { ...typescript(), apply: "build" }, { ...minifyHtml(), apply: "build" }],
  build: {
    target: "esnext",
    polyfillDynamicImport: false,
    rollupOptions: {
      output: {
        manualChunks: undefined,
        inlineDynamicImports: true,
        entryFileNames: '[name].js',   // currently does not work for the legacy bundle
        assetFileNames: '[name].[ext]', // currently does not work for images
      }
    }
  },
});
