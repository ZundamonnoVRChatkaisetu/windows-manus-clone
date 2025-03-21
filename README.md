# Windows Manus Clone

<div align="center">
  <img src="https://raw.githubusercontent.com/ZundamonnoVRChatkaisetu/windows-manus-clone/main/public/logo.png" alt="Windows Manus Clone Logo" width="200" height="200" />
  <p>
    <strong>Windows環境で動作する自律型AIエージェント</strong>
  </p>
</div>

## 概要

Windows Manus Cloneは、「思考と行動を結びつける」汎用AIエージェント「Manus AI」の機能をWindows環境で再現することを目的としたオープンソースプロジェクトです。Manus AIの革新的な自律性と機能性をローカル環境で実現し、オープンソースの柔軟性を加えています。

このアプリケーションは、Ollamaと連携して動作し、単に質問に答えるだけでなく、ユーザーの意図を理解して具体的なアクションに変換し、結果を提供する自律型AIエージェントとして機能します。

## 主な機能

### 自律的なタスク実行

- **複雑なタスクの自動実行**: レポート作成、データ分析、コンテンツ生成など
- **オフライン処理**: 接続を切断した後もタスクを継続
- **進捗可視化**: リアルタイムでのタスク進行状況の表示
- **詳細な結果レポート**: タスク完了後の包括的なレポート生成

### マルチモーダル機能

- **多様なデータタイプ処理**: テキスト、画像、音声、ドキュメント
- **画像編集/表示**: 画像の表示と基本的な編集機能
- **音声録音/再生**: オーディオの録音と再生
- **ドキュメント表示**: 各種ドキュメントの閲覧

### ツール統合

- **ブラウザ自動化**: Webサイトの自動ナビゲーションと操作
- **VSCode連携**: コードエディタとの統合
- **ファイル管理**: ファイル作成、編集、管理

### ウェブサイト構築・デプロイ

- **テンプレート選択**: 多様なウェブサイトテンプレート
- **サイトビルダー**: 視覚的なウェブサイト構築ツール
- **デプロイウィザード**: 簡単なデプロイ設定と公開

### 透明性と可視化

- **「Manusのコンピュータ」ウィンドウ**: AIの操作を可視化
- **タスクリスト**: 実行中のタスクと進捗状況の表示
- **詳細なログ**: AIの思考と行動プロセスの透明化

## 技術スタック

- **フロントエンド**: Next.js、React、TypeScript、Tailwind CSS、shadcn/ui
- **バックエンド**: Node.js
- **データベース**: SQLite + Prisma
- **AI連携**: Ollama API
- **環境**: Windows最適化

## インストール方法

### 前提条件

- Node.js v20.0.0以上
- npm v10.0.0以上
- [Ollama](https://ollama.ai/) のインストール（LLMの実行に必要）

### インストール手順

1. リポジトリをクローン
```bash
git clone https://github.com/ZundamonnoVRChatkaisetu/windows-manus-clone.git
cd windows-manus-clone
```

2. 依存パッケージのインストール
```bash
npm install
```

3. データベースのセットアップ
```bash
npx prisma migrate dev --name init
```

4. 環境変数の設定
```bash
cp .env.example .env.local
```
`.env.local`ファイルを編集して必要な環境変数を設定します。

5. アプリケーションの起動
```bash
npm run dev
```

6. ブラウザで http://localhost:3000 にアクセス

## Ollamaの設定

Windows Manus Cloneは[Ollama](https://ollama.ai/)と連携して動作します。以下の手順でOllamaをセットアップしてください：

1. [Ollama公式サイト](https://ollama.ai/)からOllamaをダウンロードしてインストール
2. 以下のコマンドで推奨モデルをダウンロード：
```bash
ollama pull llama3:8b
```
3. Windows Manus Clone内の設定ページからOllamaの接続設定を行う

## 使い方

### 基本的な使い方

1. **初期設定**: 初回起動時に、使用するLLMモデルとAPIの設定を行います。
2. **チャットインターフェース**: 自然言語でタスクや質問を入力します。
3. **タスク定義**: 複雑なタスクの場合は、詳細を指定できます。
4. **タスク実行**: AIが自律的にタスクを実行し、進捗状況を表示します。
5. **結果確認**: タスク完了後、結果を確認し、必要に応じてダウンロードできます。

### 高度な機能

- **マルチモーダル入力**: 画像やドキュメントをアップロードして分析
- **ブラウザ操作**: 「Manusのコンピュータ」ウィンドウでAIのWeb操作を監視
- **ウェブサイト構築**: テンプレートからウェブサイトを構築してデプロイ
- **コード編集**: VSCode連携による効率的なコーディング

## 開発者向け情報

### プロジェクト構造

```
windows-manus-clone/
├── src/
│   ├── app/                 # ページコンポーネント
│   │   └── api/            # APIルート
│   ├── components/          # 再利用可能なコンポーネント
│   │   ├── ui/             # 基本UI要素
│   │   ├── layout/         # レイアウトコンポーネント
│   │   ├── chat/           # チャット関連コンポーネント
│   │   ├── computer/       # Manusコンピュータ関連
│   │   ├── tasks/          # タスク管理コンポーネント
│   │   ├── multimodal/     # マルチモーダルコンポーネント
│   │   ├── website/        # ウェブサイトビルダー
│   │   └── ...
│   ├── lib/                # ユーティリティ関数とヘルパー
│   │   ├── agent/          # AIエージェント関連
│   │   ├── multimodal/     # マルチモーダル処理
│   │   ├── ollama/         # Ollama連携
│   │   ├── prisma/         # Prismaクライアント
│   │   ├── sandbox/        # サンドボックス環境
│   │   ├── windows/        # Windows固有機能
│   │   └── ...
│   └── types/              # TypeScript型定義
├── prisma/                  # Prismaスキーマと設定
└── public/                  # 静的アセット
```

### 貢献方法

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## ロードマップ

- [ ] **Windows固有機能の強化**
  - [ ] Windows APIとの深い統合
  - [ ] ファイルシステム操作の最適化
  - [ ] プロセス管理機能

- [ ] **パフォーマンス最適化**
  - [ ] リソース使用量の最小化
  - [ ] 起動時間の短縮
  - [ ] 応答性の向上

- [ ] **セキュリティ強化**
  - [ ] サンドボックス環境の堅牢化
  - [ ] 権限管理の改善
  - [ ] データ保護機能

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細については[LICENSE](LICENSE)ファイルを参照してください。

## 免責事項

このプロジェクトは教育および研究目的で開発されています。オリジナルのManus AIと直接的な関連はなく、その商標権を侵害する意図はありません。実際のサービスとは機能や性能が異なる場合があります。

---

<div align="center">
  <p>Developed with ❤️ for the AI community</p>
</div>
