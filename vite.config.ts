import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

// Fix: __dirname is not available in ES modules. This defines it based on the current file's location.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Per security review, environment variables are only exposed to the client
  // via the `VITE_` prefix and should not include sensitive keys.
  // The AI API keys are handled securely by Supabase Edge Functions.
})