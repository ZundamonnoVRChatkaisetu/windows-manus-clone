'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BrainCog, Monitor, Download, RotateCcw, Cpu, Palette, Loader2 } from 'lucide-react';
import { 
  getInstalledModels, 
  OllamaModel, 
  getAvailableModels,
  checkOllamaInstallation
} from '@/lib/ollama';
import Link from 'next/link';

export default function SettingsPage() {
  const [developerMode, setDeveloperMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [selectedModel, setSelectedModel] = useState('llama3:8b-instruct-q4_0');
  const [installedModels, setInstalledModels] = useState<OllamaModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [ollamaRunning, setOllamaRunning] = useState(false);
  
  useEffect(() => {
    // Ollamaのステータスを確認
    const checkOllamaStatus = async () => {
      try {
        const info = await checkOllamaInstallation();
        setOllamaRunning(info.isRunning || false);
        
        if (info.isRunning) {
          loadModels();
        } else {
          setIsLoadingModels(false);
        }
      } catch (error) {
        console.error('Ollamaステータス確認中にエラーが発生しました:', error);
        setIsLoadingModels(false);
      }
    };
    
    checkOllamaStatus();
  }, []);
  
  // モデル一覧を読み込む
  const loadModels = async () => {
    setIsLoadingModels(true);
    try {
      const installed = await getInstalledModels();
      setInstalledModels(installed);
      
      // インストール済みモデルがある場合は、最初のモデルを選択
      if (installed.length > 0) {
        setSelectedModel(installed[0].name);
      }
    } catch (error) {
      console.error('モデル一覧の読み込み中にエラーが発生しました:', error);
    } finally {
      setIsLoadingModels(false);
    }
  };
  
  return (
    <MainLayout>
      <div className="container py-6 space-y-6">
        <h1 className="text-3xl font-bold">設定</h1>
        
        <div className="grid gap-6 md:grid-cols-2">
          {/* Ollamaモデル設定 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BrainCog className="mr-2 h-5 w-5" />
                Ollamaモデル設定
              </CardTitle>
              <CardDescription>
                使用するAIモデルとその設定を管理します
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="model-select" className="text-sm font-medium">
                  使用モデル
                </label>
                {isLoadingModels ? (
                  <div className="flex items-center space-x-2 h-10 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">モデル一覧を読み込み中...</span>
                  </div>
                ) : !ollamaRunning ? (
                  <div className="text-sm text-amber-500 flex items-center space-x-2 h-10 py-2">
                    <span>Ollamaサービスが実行されていません。</span>
                    <Link href="/ollama" className="text-primary underline">
                      Ollama管理ページ
                    </Link>
                    <span>で起動してください。</span>
                  </div>
                ) : installedModels.length === 0 ? (
                  <div className="text-sm text-amber-500 flex items-center space-x-2 h-10 py-2">
                    <span>インストール済みのモデルがありません。</span>
                    <Link href="/ollama" className="text-primary underline">
                      Ollama管理ページ
                    </Link>
                    <span>でモデルをインストールしてください。</span>
                  </div>
                ) : (
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger id="model-select">
                      <SelectValue placeholder="モデルを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {installedModels.map((model) => (
                        <SelectItem key={model.name} value={model.name}>
                          {model.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">
                    モデルの更新を確認
                  </label>
                  <p className="text-xs text-muted-foreground">
                    最新バージョンのモデルがあるか確認します
                  </p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={loadModels}
                  disabled={isLoadingModels || !ollamaRunning}
                >
                  {isLoadingModels ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  更新確認
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">
                    モデル管理
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Ollamaで利用可能なモデルの管理や追加を行います
                  </p>
                </div>
                <Button 
                  size="sm"
                  variant="secondary"
                  asChild
                >
                  <Link href="/ollama">
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    Ollama管理
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* テーマとUI設定 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Palette className="mr-2 h-5 w-5" />
                テーマとUI設定
              </CardTitle>
              <CardDescription>
                アプリケーションの外観と動作を設定します
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">
                    通知を有効にする
                  </label>
                  <p className="text-xs text-muted-foreground">
                    タスクの完了時に通知を表示します
                  </p>
                </div>
                <Switch
                  checked={notificationsEnabled}
                  onCheckedChange={setNotificationsEnabled}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">
                    開発者モード
                  </label>
                  <p className="text-xs text-muted-foreground">
                    詳細なデバッグ情報を表示します
                  </p>
                </div>
                <Switch
                  checked={developerMode}
                  onCheckedChange={setDeveloperMode}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="theme-select" className="text-sm font-medium">
                  カラーテーマ
                </label>
                <Select defaultValue="system">
                  <SelectTrigger id="theme-select">
                    <SelectValue placeholder="テーマを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">ライトモード</SelectItem>
                    <SelectItem value="dark">ダークモード</SelectItem>
                    <SelectItem value="system">システム設定に合わせる</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          
          {/* システム情報 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Cpu className="mr-2 h-5 w-5" />
                システム情報
              </CardTitle>
              <CardDescription>
                アプリケーションとシステムのステータス
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">アプリケーションバージョン</p>
                  <p className="text-sm font-medium">v0.1.0</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Ollamaステータス</p>
                  <p className={`text-sm font-medium ${ollamaRunning ? 'text-green-500' : 'text-red-500'}`}>
                    {ollamaRunning ? '実行中' : '停止中'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">使用中メモリ</p>
                  <p className="text-sm font-medium">2.4 GB</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">GPU状態</p>
                  <p className="text-sm font-medium">使用可能</p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" className="w-full">
                <Monitor className="mr-1.5 h-3.5 w-3.5" />
                詳細情報
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
