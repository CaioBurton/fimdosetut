/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  /** Endereço público do bucket do Cloudflare R2 com as fotos arquivadas (opcional). */
  readonly VITE_FOTOS_ARQUIVO_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
