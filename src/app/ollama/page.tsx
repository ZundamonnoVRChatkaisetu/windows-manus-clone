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
import { 
  AlertCircle, 
  Check, 
  Download,
  Trash,
  RefreshCw,
  Database,
  ServerOff,
  Check as CheckIcon,
  Play,
  ExternalLink,
  Info,
  Cpu
} from 'lucide-react';
import Link from 'next/link';
import { 
  checkOllamaInstallation, 
  OllamaInstallInfo,
  startOllamaService,
  getOllamaInstallerUrl,
  getInstalledModels,
  OllamaModel,
  getAvailableModels,
  pullModel,
  deleteModel,
  formatModelSize
} from '@/lib/ollama';

export default function OllamaPage() {
  const [installInfo, setInstallInfo] = useState<OllamaInstallInfo | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [installedModels, setInstalledModels] = useState<OllamaModel[]>([]);
  const [availableModels, setAvailableModels] = useState<{name: string, isInstalled: boolean}[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [downloadingModels, setDownloadingModels] = useState<Set<string>>(new Set());
  const [deletingModels, setDeletingModels] = useState<Set<string>>(new Set());

  // Ollamaのインストール状況を確認
  useEffect(() => {
    const checkInstallation = async () => {
      setIsChecking(true);
      try {
        const info = await checkOllamaInstallation();
        setInstallInfo(info);
        
        if (info.isInstalled && info.isRunning) {
          loadModels();
        }
      } catch (error) {
        console.error('Ollamaインストール確認中にエラーが発生しました:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkInstallation();
  }, []);

  // モデル一覧を読み込む
  const loadModels = async () => {
    setIsLoadingModels(true);
    try {
      const [installed, available] = await Promise.all([
        getInstalledModels(),
        getAvailableModels()
      ]);
      setInstalledModels(installed);
      setAvailableModels(available);
    } catch (error) {
      console.error('モデル一覧の読み込み中にエラーが発生しました:', error);
    } finally {
      setIsLoadingModels(false);
    }
  };

  // Ollamaサービスを起動
  const handleStartService = async () => {
    if (!installInfo?.isInstalled) return;
    
    setIsStarting(true);
    try {
      const success = await startOllamaService(installInfo.installPath);
      if (success) {
        // インストール情報を更新
        const updatedInfo = await checkOllamaInstallation();
        setInstallInfo(updatedInfo);
        
        if (updatedInfo.isRunning) {
          loadModels();
        }
      }
    } catch (error) {
      console.error('Ollamaサービス起動中にエラーが発生しました:', error);
    } finally {
      setIsStarting(false);
    }
  };

  // モデルをダウンロード
  const handlePullModel = async (modelName: string) => {
    setDownloadingModels(prev => new Set(prev).add(modelName));
    try {
      await pullModel(modelName);
      // モデル一覧を更新
      await loadModels();
    } catch (error) {
      console.error(`モデル ${modelName} のダウンロード中にエラーが発生しました:`, error);
    } finally {
      setDownloadingModels(prev => {
        const newSet = new Set(prev);
        newSet.delete(modelName);
        return newSet;
      });
    }
  };

  // モデルを削除
  const handleDeleteModel = async (modelName: string) => {
    setDeletingModels(prev => new Set(prev).add(modelName));
    try {
      await deleteModel(modelName);
      // モデル一覧を更新
      await loadModels();
    } catch (error) {
      console.error(`モデル ${modelName} の削除中にエラーが発生しました:`, error);
    } finally {
      setDeletingModels(prev => {
        const newSet = new Set(prev);
        newSet.delete(modelName);
        return newSet;
      });
    }
  };

  // モデル名を整形する
  const formatModelName = (name: string) => {
    const parts = name.split(':');
    if (parts.length > 1) {
      return (
        <span>
          <span className="font-semibold">{parts[0]}</span>
          <span className="text-muted-foreground">:{parts.slice(1).join(':')}</span>
        </span>
      );
    }
    return name;
  };

  return (
    <MainLayout>
      <div className="container py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Ollama管理</h1>
          
          <Button 
            onClick={loadModels}
            disabled={!installInfo?.isRunning || isLoadingModels}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingModels ? 'animate-spin' : ''}`} />
            更新
          </Button>
        </div>

        {/* インストールステータス */}
        <Card>
          <CardHeader>
            <CardTitle>Ollamaステータス</CardTitle>
            <CardDescription>
              Ollamaのインストール状況とサービスの状態
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isChecking ? (
              <div className="flex items-center justify-center p-4">
                <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                <span>確認中...</span>
              </div>
            ) : installInfo?.isInstalled ? (
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="mr-4 h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">Ollamaがインストールされています</h3>
                    <p className="text-sm text-muted-foreground">
                      バージョン: {installInfo.version || '不明'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      インストールパス: {installInfo.installPath || '不明（PATHから実行可能）'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  {installInfo.isRunning ? (
                    <>
                      <div className="mr-4 h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                        <Cpu className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium">Ollamaサービスが実行中です</h3>
                        <p className="text-sm text-muted-foreground">
                          サービスはlocalhost:11434で実行中です
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="mr-4 h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                        <ServerOff className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium">Ollamaサービスが停止しています</h3>
                        <p className="text-sm text-muted-foreground">
                          モデルを使用するにはサービスを起動する必要があります
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center">
                <div className="mr-4 h-10 w-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">Ollamaがインストールされていません</h3>
                  <p className="text-sm text-muted-foreground">
                    Ollamaを使用するには、公式サイトからダウンロードしてインストールしてください
                  </p>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            {installInfo?.isInstalled && !installInfo.isRunning && (
              <Button 
                onClick={handleStartService}
                disabled={isStarting}
              >
                {isStarting ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                サービスを起動
              </Button>
            )}
            
            {!installInfo?.isInstalled && (
              <a 
                href={getOllamaInstallerUrl()} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button>
                  <Download className="h-4 w-4 mr-2" />
                  Ollamaをダウンロード
                </Button>
              </a>
            )}
            
            <Button 
              variant="outline" 
              onClick={async () => {
                setIsChecking(true);
                const info = await checkOllamaInstallation();
                setInstallInfo(info);
                setIsChecking(false);
                
                if (info.isInstalled && info.isRunning) {
                  loadModels();
                }
              }}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
              再確認
            </Button>
          </CardFooter>
        </Card>

        {/* モデル一覧 */}
        {installInfo?.isRunning && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* インストール済みモデル */}
            <Card>
              <CardHeader>
                <CardTitle>インストール済みモデル</CardTitle>
                <CardDescription>
                  ローカルにインストールされているOllamaモデル
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingModels ? (
                  <div className="flex items-center justify-center p-4">
                    <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                    <span>読み込み中...</span>
                  </div>
                ) : installedModels.length > 0 ? (
                  <div className="space-y-3">
                    {installedModels.map((model) => (
                      <div 
                        key={model.name} 
                        className="flex items-center justify-between p-3 border rounded-md"
                      >
                        <div className="flex items-center">
                          <Database className="h-5 w-5 mr-3 text-primary" />
                          <div>
                            <div>{formatModelName(model.name)}</div>
                            <div className="text-xs text-muted-foreground">
                              サイズ: {formatModelSize(model.size)} | 
                              更新: {new Date(model.modified_at).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          onClick={() => handleDeleteModel(model.name)}
                          disabled={deletingModels.has(model.name)}
                          className="h-8 w-8"
                          title="削除"
                        >
                          {deletingModels.has(model.name) ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash className="h-4 w-4 text-destructive" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-4 text-muted-foreground">
                    <Database className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>インストール済みのモデルがありません</p>
                    <p className="text-sm mt-1">下のモデル一覧からダウンロードしてください</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 利用可能なモデル */}
            <Card>
              <CardHeader>
                <CardTitle>利用可能なモデル</CardTitle>
                <CardDescription>
                  インストール可能なOllamaモデル
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingModels ? (
                  <div className="flex items-center justify-center p-4">
                    <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                    <span>読み込み中...</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {availableModels.map((model) => (
                      <div 
                        key={model.name} 
                        className="flex items-center justify-between p-3 border rounded-md"
                      >
                        <div className="flex items-center">
                          <Database className="h-5 w-5 mr-3 text-primary" />
                          <div>
                            <div>{formatModelName(model.name)}</div>
                            <div className="text-xs flex items-center mt-0.5">
                              {model.isInstalled && (
                                <span className="flex items-center text-green-600 dark:text-green-400 mr-1">
                                  <CheckIcon className="h-3 w-3 mr-0.5" />
                                  インストール済み
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {!model.isInstalled && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePullModel(model.name)}
                            disabled={downloadingModels.has(model.name)}
                          >
                            {downloadingModels.has(model.name) ? (
                              <>
                                <RefreshCw className="h-3 w-3 animate-spin mr-1.5" />
                                ダウンロード中
                              </>
                            ) : (
                              <>
                                <Download className="h-3 w-3 mr-1.5" />
                                ダウンロード
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <div className="text-sm text-muted-foreground flex items-start">
                  <Info className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                  <p>
                    これ以外のモデルを使用するには、Ollamaのコマンドラインから
                    <code className="mx-1 px-1 py-0.5 bg-muted rounded">ollama pull モデル名</code>
                    を実行してください。
                    <a 
                      href="https://ollama.com/library" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center text-primary mt-1 hover:underline"
                    >
                      Ollamaライブラリを見る
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </p>
                </div>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
