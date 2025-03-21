'use client';

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout';
import { ComputerWindow, Action } from '@/components/computer';
import { v4 as uuidv4 } from 'uuid';

// サンプルアクションデータ
const SAMPLE_ACTIONS: Action[] = [
  {
    id: uuidv4(),
    type: 'system',
    name: 'システム初期化',
    status: 'completed',
    details: 'AIエージェントシステムの初期化\nメモリの確保: 2GB\nモデルのロード: llama3:8b-instruct-q4_0',
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5分前
    duration: 2500,
    result: '初期化完了'
  },
  {
    id: uuidv4(),
    type: 'browser',
    name: 'Googleで検索',
    status: 'completed',
    details: 'クエリ: "Next.js 最新バージョン"\nURL: https://www.google.com/search?q=Next.js+最新バージョン',
    timestamp: new Date(Date.now() - 1000 * 60 * 4), // 4分前
    duration: 1200,
    result: '検索結果取得: Next.js 14.1.0が最新バージョン'
  },
  {
    id: uuidv4(),
    type: 'browser',
    name: 'Next.js公式サイトにアクセス',
    status: 'completed',
    details: 'URL: https://nextjs.org/\nタイトル: Next.js by Vercel - The React Framework for the Web',
    timestamp: new Date(Date.now() - 1000 * 60 * 3), // 3分前
    duration: 800,
    result: 'ページ情報取得完了'
  },
  {
    id: uuidv4(),
    type: 'code',
    name: 'Next.jsプロジェクト作成',
    status: 'completed',
    details: 'コマンド: npx create-next-app@latest my-project\n選択オプション:\n- TypeScript: Yes\n- ESLint: Yes\n- Tailwind CSS: Yes\n- src/ directory: Yes\n- App Router: Yes',
    timestamp: new Date(Date.now() - 1000 * 60 * 2), // 2分前
    duration: 15000,
    result: 'プロジェクト作成完了: C:\\Users\\user\\projects\\my-project'
  },
  {
    id: uuidv4(),
    type: 'file',
    name: 'package.jsonの編集',
    status: 'completed',
    details: 'ファイル: C:\\Users\\user\\projects\\my-project\\package.json\n依存関係の追加:\n- shadcn/ui\n- lucide-react',
    timestamp: new Date(Date.now() - 1000 * 60), // 1分前
    duration: 500,
    result: 'ファイル更新完了'
  },
  {
    id: uuidv4(),
    type: 'code',
    name: '依存関係のインストール',
    status: 'running',
    details: 'コマンド: npm install\n進行中...',
    timestamp: new Date(),
    duration: 0
  },
];

export default function ComputerPage() {
  const [actions, setActions] = useState<Action[]>(SAMPLE_ACTIONS);
  const [isRunning, setIsRunning] = useState(true);

  // 実行開始
  const handleStart = () => {
    setIsRunning(true);
    
    // 実行中のアクションがなければ、新しいアクションを追加
    const hasRunningAction = actions.some(action => action.status === 'running');
    if (!hasRunningAction) {
      const newAction: Action = {
        id: uuidv4(),
        type: 'system',
        name: 'プロセス実行',
        status: 'running',
        details: '新しいタスクを実行中...',
        timestamp: new Date()
      };
      
      setActions(prev => [...prev, newAction]);
    }
  };

  // 実行停止
  const handleStop = () => {
    setIsRunning(false);
    
    // 実行中のアクションを停止状態に更新
    setActions(prev => 
      prev.map(action => 
        action.status === 'running' 
          ? { 
              ...action, 
              status: 'failed', 
              details: action.details + '\n\n実行が中断されました。', 
              duration: new Date().getTime() - action.timestamp.getTime() 
            } 
          : action
      )
    );
  };

  // リセット
  const handleReset = () => {
    setIsRunning(false);
    setActions([]);
  };

  return (
    <MainLayout>
      <div className="container py-6 space-y-6">
        <h1 className="text-3xl font-bold">Manusのコンピュータ</h1>
        <p className="text-muted-foreground">
          AIエージェントの操作を監視し、実行中のアクションを確認できます。
        </p>
        
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <ComputerWindow
              actions={actions}
              isRunning={isRunning}
              onStart={handleStart}
              onStop={handleStop}
              onReset={handleReset}
              className="h-[calc(100vh-16rem)]"
            />
          </div>
          
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-2">コンピュータの使い方</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Manusのコンピュータは、AIエージェントが実行しているアクションをリアルタイムで表示します。
                以下の機能を使用して、AIの操作を管理できます。
              </p>
              
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-primary/10 p-1 rounded-full mr-3">
                    <Play className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">実行</p>
                    <p className="text-sm text-muted-foreground">AIエージェントの実行を開始します。</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-destructive/10 p-1 rounded-full mr-3">
                    <Stop className="h-4 w-4 text-destructive" />
                  </div>
                  <div>
                    <p className="font-medium">停止</p>
                    <p className="text-sm text-muted-foreground">実行中のアクションを停止します。</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-blue-500/10 p-1 rounded-full mr-3">
                    <RotateCcw className="h-4 w-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-medium">リセット</p>
                    <p className="text-sm text-muted-foreground">すべてのアクション履歴をクリアします。</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-2">アクションタイプ</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center">
                  <div className="mr-2 text-blue-500">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <circle cx="15.5" cy="8.5" r="1.5" />
                      <path d="M8.5 13.5c0 1.5 1.5 3 3.5 3s3.5-1.5 3.5-3" />
                    </svg>
                  </div>
                  <span className="text-sm">ブラウザ操作</span>
                </div>
                
                <div className="flex items-center">
                  <div className="mr-2 text-green-500">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                      <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z" />
                    </svg>
                  </div>
                  <span className="text-sm">ファイル操作</span>
                </div>
                
                <div className="flex items-center">
                  <div className="mr-2 text-purple-500">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="16 18 22 12 16 6" />
                      <polyline points="8 6 2 12 8 18" />
                    </svg>
                  </div>
                  <span className="text-sm">コード実行</span>
                </div>
                
                <div className="flex items-center">
                  <div className="mr-2 text-orange-500">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 6.1H3" />
                      <path d="M21 12.2H3" />
                      <path d="M15.5 18.3H3" />
                    </svg>
                  </div>
                  <span className="text-sm">API呼び出し</span>
                </div>
                
                <div className="flex items-center">
                  <div className="mr-2 text-gray-500">
                    <Cpu className="h-4 w-4" />
                  </div>
                  <span className="text-sm">システム操作</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
