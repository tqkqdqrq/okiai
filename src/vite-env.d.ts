/// <reference types="vite/client" />

interface ImportMetaEnv {
  // クライアントサイドでは環境変数は不要（サーバーサイドで処理）
  // セキュリティのためAPIキーはクライアントに公開しない
}