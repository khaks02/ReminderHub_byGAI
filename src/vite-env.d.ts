
// This file provides TypeScript definitions for Vite's environment variables,
// ensuring type safety when accessing them via `import.meta.env`.

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
