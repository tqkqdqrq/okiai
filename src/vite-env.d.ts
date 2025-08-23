/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DIFY_API_KEY?: string
  readonly VITE_DIFY_BASE_URL?: string
  readonly DIFY_API_KEY?: string
  readonly DIFY_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}