'use client';

import React, { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Download } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [isInitializing, setIsInitializing] = useState(true);
  const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'running' | 'not-running' | 'error'>('checking');
  const [modelStatus, setModelStatus] = useState<'checking' | 'available' | 'not-available' | 'error'>('checking');
  const [downloadingLlama, setDownloadingLlama] = useState(false);
  const [installedModels, setInstalledModels] = useState<string[]>([]);

  // アプリ起動時にモデル同期を実行
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Ollamaの状態チェック
        const ollamaResponse = await fetch('/api/ollama/check');
        const ollamaData = await ollamaResponse.json();
        
        if (ollamaData.isRunning) {
          setOllamaStatus('running');
          
          // モデル同期を実行
          const syncResponse = await fetch('/api/ollama/models/sync');
          const syncData = await syncResponse.json();
          
          if (syncResponse.ok) {
            if (syncData.models && syncData.models.length > 0) {
              setModelStatus('available');
              setInstalledModels(syncData.models.map((model: any) => model.name));
            } else {
              setModelStatus('not-available');
            }
          } else {
            setModelStatus('error');
            console.error('モデル同期エラー:', syncData.error);
          }
        } else {
          setOllamaStatus('not-running');
          setModelStatus('not-available');
        }
      } catch (error) {
        console.error('初期化エラー:', error);
        setOllamaStatus('error');
        setModelStatus('error');
      } finally {
        setIsInitializing(false);
      }
    };

    initializeApp();
  }, []);

  const handleStartOllama = async () => {
    try {
      const response = await fetch('/api/ollama/start', { method: 'POST' });
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Ollamaを起動中",
          description: "Ollamaを起動しています。少々お待ちください...",
        });
        
        // 数秒待ってから再チェック
        setTimeout(() => {
          window.location.reload();
        }, 5000);
      } else {
        toast({
          title: "エラー",
          description: data.error || "Ollamaの起動に失敗しました",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "エラー",
        description: "Ollamaの起動に失敗しました",
        variant: "destructive",
      });
    }
  };

  const handleDownloadLlama3 = async () => {
    if (downloadingLlama) return;

    setDownloadingLlama(true);
    try {
      toast({
        title: "llama3:latestをダウンロード中",
        description: "このプロセスには数分かかることがあります...",
      });

      const response = await fetch('/api/ollama/models/pull', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: 'llama3:latest' })
      });

      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "ダウンロード完了",
          description: "llama3:latestモデルが正常にインストールされました。",
        });
        
        // 現在のページをリロードしてステータスを更新
        window.location.reload();
      } else {
        toast({
          title: "エラー",
          description: data.error || "モデルのダウンロードに失敗しました",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('モデルダウンロードエラー:', error);
      toast({
        title: "エラー",
        description: "モデルのダウンロード中にエラーが発生しました",
        variant: "destructive",
      });
    } finally {
      setDownloadingLlama(false);
    }
  };

  const goToSettings = () => {
    router.push('/settings');
  };

  const goToChat = () => {
    router.push('/chat');
  };

  const goToOllamaManager = () => {
    router.push('/ollama');
  };

  // llama3:latestが既にインストールされているかチェック
  const hasLlama3Latest = installedModels.includes('llama3:latest');

  return (
    <MainLayout>
      <div className="container py-6 space-y-6">
        <h1 className="text-3xl font-bold">Windows Manus Clone</h1>
        <p className="text-muted-foreground">
          Windows環境で動作するManus AIクローンプラットフォームへようこそ
        </p>

        {isInitializing ? (
          <Card>
            <CardHeader>
              <CardTitle>初期化中...</CardTitle>
            </CardHeader>
            <CardContent>
              <p>アプリケーションを初期化しています。少々お待ちください...</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Ollamaサービス</CardTitle>
                <CardDescription>
                  AIモデルを実行するためにOllamaサービスが必要です
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {ollamaStatus === 'running' ? (
                  <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <AlertTitle>Ollamaサービス実行中</AlertTitle>
                    <AlertDescription>
                      Ollamaサービスは正常に動作しています
                    </AlertDescription>
                  </Alert>
                ) : ollamaStatus === 'not-running' ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Ollamaサービス停止中</AlertTitle>
                    <AlertDescription>
                      <p className="mb-2">Ollamaサービスが実行されていません</p>
                      <Button onClick={handleStartOllama} size="sm">Ollamaを起動</Button>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>接続エラー</AlertTitle>
                    <AlertDescription>
                      <p className="mb-2">Ollamaサービスの状態確認中にエラーが発生しました</p>
                      <Button onClick={() => window.location.reload()} size="sm">再試行</Button>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AIモデル</CardTitle>
                <CardDescription>
                  チャット機能を使用するにはAIモデルが必要です
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {modelStatus === 'available' ? (
                  <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <AlertTitle>AIモデル利用可能</AlertTitle>
                    <AlertDescription>
                      <p className="mb-2">AIモデルが検出され、チャット機能が利用可能です</p>
                      {hasLlama3Latest ? (
                        <div className="flex space-x-2">
                          <Button onClick={goToChat} size="sm" className="flex-1">チャットを開始</Button>
                          <Button onClick={goToOllamaManager} size="sm" variant="outline">モデル管理</Button>
                        </div>
                      ) : (
                        <div className="flex flex-col space-y-2">
                          <Button onClick={goToChat} size="sm">チャットを開始</Button>
                          <p className="text-amber-600 dark:text-amber-400 text-sm mt-2">
                            推奨モデル「llama3:latest」がインストールされていません。
                          </p>
                          <Button 
                            onClick={handleDownloadLlama3} 
                            disabled={downloadingLlama} 
                            size="sm" 
                            variant="secondary"
                            className="w-full"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            {downloadingLlama ? 'ダウンロード中...' : 'llama3:latestをインストール'}
                          </Button>
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                ) : modelStatus === 'not-available' ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>AIモデルがありません</AlertTitle>
                    <AlertDescription>
                      <p className="mb-2">利用可能なAIモデルが検出されませんでした。このアプリを利用するには、「llama3:latest」モデルのインストールをお勧めします。</p>
                      <div className="flex flex-col space-y-2">
                        <Button 
                          onClick={handleDownloadLlama3} 
                          disabled={downloadingLlama || ollamaStatus !== 'running'} 
                          size="sm"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          {downloadingLlama ? 'ダウンロード中...' : 'llama3:latestをインストール'}
                        </Button>
                        <p className="text-xs text-muted-foreground">または</p>
                        <Button onClick={goToSettings} size="sm" variant="outline">
                          別のモデルを設定
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>モデル検出エラー</AlertTitle>
                    <AlertDescription>
                      <p className="mb-2">AIモデルの検出中にエラーが発生しました</p>
                      <Button onClick={() => window.location.reload()} size="sm">再試行</Button>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>チャット</CardTitle>
              <CardDescription>
                AIアシスタントとチャットする
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={goToChat} disabled={modelStatus !== 'available'}>
                チャットを開始
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>コンピュータ</CardTitle>
              <CardDescription>
                AIエージェントの操作を監視する
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push('/computer')} disabled={modelStatus !== 'available'}>
                コンピュータを開く
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>設定</CardTitle>
              <CardDescription>
                アプリケーション設定とモデル管理
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={goToSettings}>
                設定を開く
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}