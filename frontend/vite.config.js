import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const packageJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8'))

// Attempt to get git commit hash
let commitHash = process.env.GIT_COMMIT;
if (!commitHash) {
  try {
    const { execSync } = await import('child_process');
    commitHash = execSync('git rev-parse --short HEAD').toString().trim();
  } catch (e) {
    commitHash = 'unknown';
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    '__APP_VERSION__': JSON.stringify(packageJson.version + (process.env.BUILD_METADATA || '')),
    '__COMMIT_HASH__': JSON.stringify(commitHash),
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: '0.0.0.0',
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          mermaid: ['mermaid']
        }
      },
      globals: {
        __APP_VERSION__: 'readonly',
        __COMMIT_HASH__: 'readonly',
      }
    }
  },
})
