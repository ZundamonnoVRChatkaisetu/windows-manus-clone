import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 p-4">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Windows Manus Clone</h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          Windows環境で動作する自律型AIエージェント。Ollamaと連携し、複雑なタスクを自動で完了します。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        <div className="border rounded-lg p-6 shadow-md bg-card">
          <h2 className="text-2xl font-bold mb-4">自律的なタスク実行</h2>
          <p className="text-muted-foreground mb-4">
            複雑なタスクを独立して計画・実行し、具体的な結果を提供します。
            レポート作成、データ分析、コンテンツ生成などを自動化できます。
          </p>
          <Link href="/chat">
            <Button>始める</Button>
          </Link>
        </div>

        <div className="border rounded-lg p-6 shadow-md bg-card">
          <h2 className="text-2xl font-bold mb-4">Ollamaとの連携</h2>
          <p className="text-muted-foreground mb-4">
            ローカルにインストールされたOllamaのAIモデルを活用。
            プライバシーを保ちながら高度なAI機能を利用できます。
          </p>
          <Link href="/settings">
            <Button variant="outline">設定</Button>
          </Link>
        </div>

        <div className="border rounded-lg p-6 shadow-md bg-card">
          <h2 className="text-2xl font-bold mb-4">高度なツール統合</h2>
          <p className="text-muted-foreground mb-4">
            ウェブブラウザ、コードエディタ、データベース管理システムなどのツールと
            シームレスに連携し、自動化されたワークフローを実現します。
          </p>
        </div>

        <div className="border rounded-lg p-6 shadow-md bg-card">
          <h2 className="text-2xl font-bold mb-4">透明性のあるプロセス</h2>
          <p className="text-muted-foreground mb-4">
            AIの意思決定プロセスをリアルタイムで可視化。操作を観察し、
            必要に応じて介入することができます。
          </p>
        </div>
      </div>
    </div>
  );
}
