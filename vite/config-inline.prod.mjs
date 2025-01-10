import { defineConfig } from 'vite';
import path from 'path';

// Get environment variables
const projectDir = process.env.PROJECT_DIR;
const adRootPath = process.env.AD_ROOT_PATH;

if (!projectDir || !adRootPath) {
  throw new Error('PROJECT_DIR and AD_ROOT_PATH environment variables are required');
}

export default defineConfig({
  root: adRootPath,
  base: './',
  build: {
    outDir: path.resolve(projectDir, 'dist-inline'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(adRootPath, 'index.html')
      },
      output: {
        inlineDynamicImports: true,
        manualChunks: undefined
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(adRootPath, 'src'),
      '@assets': path.resolve(adRootPath, 'public/assets')
    }
  }
}); 