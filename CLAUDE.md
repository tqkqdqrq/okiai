# パチスロ有利区間計算ツール - Claude設定

## プロジェクト概要
パチスロの有利区間を計算するReact TypeScriptアプリケーション。AI画像認識機能により、スクリーンショットから自動的にゲーム履歴データを抽出し、有利区間の範囲を計算します。

## 主要技術
- React 19 + TypeScript
- Vite（開発・ビルドツール）
- Google Generative AI (Gemini) - 画像解析
- Tailwind CSS - スタイリング

## 開発コマンド
- `npm run dev` - 開発サーバー起動（デフォルトポート: 5173）
- `npm run build` - 本番ビルド
- `npm run preview` - ビルドプレビュー

## プロジェクト構成
- `App.tsx` - メインアプリケーションコンポーネント
- `components/` - 再利用可能なReactコンポーネント
  - `ImageProcessor.tsx` - 画像アップロード・処理
  - `HistoryTable.tsx` - ゲーム履歴データ表示
  - `icons.tsx` - アイコンコンポーネント
- `services/` - 外部サービス連携
  - `geminiService.ts` - Google Gemini AI連携
- `utils/` - ユーティリティ関数
  - `calculator.ts` - 有利区間計算ロジック
- `types.ts` - TypeScript型定義
- `constants.ts` - アプリケーション定数

## 主要機能
1. **画像処理**: ゲーム履歴のスクリーンショットをアップロードし、AIでデータを自動抽出
2. **手動データ入力**: ゲーム記録の追加・編集・削除
3. **有利区間計算**: ゲーム履歴に基づく有利区間範囲の自動計算
4. **データ管理**: レコード追加、データクリア、選択削除
5. **区切り機能**: データを区切って新しいセクションとして計算

## 環境設定
- Node.js必須
- AI画像処理機能には`.env.local`に`GEMINI_API_KEY`を設定

## コードスタイルガイドライン
- TypeScriptで厳密な型付け
- React関数コンポーネント + Hooks
- Tailwind CSSで一貫したスタイリング
- 日本語UI

## テスト
現在、特定のテストフレームワークは設定されていません。テスト追加時の推奨：
- Jest - ユニットテスト
- React Testing Library - コンポーネントテスト
- Cypress - E2Eテスト

## デプロイ
`npm run build`の出力を使用して静的サイトとしてデプロイ可能。