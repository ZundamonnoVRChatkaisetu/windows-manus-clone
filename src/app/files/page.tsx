'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout';
import {
  FileList,
  FileCreateDialog,
  FileShareDialog,
  FilePreview,
} from '@/components/files';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { FileInfo, FileTemplate, FileShareInfo } from '@/lib/files';
import { FileText, Search, Plus, RefreshCw, Trash } from 'lucide-react';

export default function FilesPage() {
  const { toast } = useToast();
  
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [templates, setTemplates] = useState<FileTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // ダイアログの状態
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // 選択中のファイル
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  
  // ファイル一覧を取得
  const fetchFiles = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/files');
      const data = await response.json();
      
      if (data.success) {
        setFiles(data.data);
      } else {
        throw new Error(data.error || 'ファイル一覧の取得に失敗しました');
      }
    } catch (error) {
      console.error('ファイル一覧取得エラー:', error);
      toast({
        title: 'エラー',
        description: 'ファイル一覧の取得に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // テンプレート一覧を取得
  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/files/templates');
      const data = await response.json();
      
      if (data.success) {
        setTemplates(data.data);
      } else {
        throw new Error(data.error || 'テンプレート一覧の取得に失敗しました');
      }
    } catch (error) {
      console.error('テンプレート一覧取得エラー:', error);
    }
  };
  
  // 初回読み込み時にファイル一覧とテンプレート一覧を取得
  useEffect(() => {
    fetchFiles();
    fetchTemplates();
  }, []);
  
  // ファイル検索
  const searchFiles = async () => {
    if (!searchQuery) {
      fetchFiles();
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/files?query=${encodeURIComponent(searchQuery)}&includeContent=true`);
      const data = await response.json();
      
      if (data.success) {
        setFiles(data.data);
      } else {
        throw new Error(data.error || '検索に失敗しました');
      }
    } catch (error) {
      console.error('ファイル検索エラー:', error);
      toast({
        title: 'エラー',
        description: '検索に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // ファイル作成
  const handleCreateFile = async (fileData: {
    name: string;
    content: string;
    path?: string;
    type?: string;
    templateId?: string;
    variables?: Record<string, string>;
  }) => {
    try {
      const response = await fetch('/api/files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fileData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'ファイルを作成しました',
          description: `${fileData.name} を作成しました`,
        });
        fetchFiles(); // ファイル一覧を更新
      } else {
        throw new Error(data.error || 'ファイルの作成に失敗しました');
      }
    } catch (error) {
      console.error('ファイル作成エラー:', error);
      toast({
        title: 'エラー',
        description: 'ファイルの作成に失敗しました',
        variant: 'destructive',
      });
    }
  };
  
  // ファイル削除
  const handleDeleteFile = async () => {
    if (!selectedFile) return;
    
    try {
      const response = await fetch(`/api/files?id=${selectedFile.id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'ファイルを削除しました',
          description: `${selectedFile.name} を削除しました`,
        });
        fetchFiles(); // ファイル一覧を更新
        setDeleteDialogOpen(false);
      } else {
        throw new Error(data.error || 'ファイルの削除に失敗しました');
      }
    } catch (error) {
      console.error('ファイル削除エラー:', error);
      toast({
        title: 'エラー',
        description: 'ファイルの削除に失敗しました',
        variant: 'destructive',
      });
    }
  };
  
  // ファイル共有
  const handleShareFile = async (
    fileId: string, 
    options: {
      expiresIn?: number;
      password?: string;
      allowDownload?: boolean;
      allowEdit?: boolean;
    }
  ): Promise<FileShareInfo | null> => {
    try {
      const response = await fetch('/api/files/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId,
          ...options,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error || 'ファイルの共有に失敗しました');
      }
    } catch (error) {
      console.error('ファイル共有エラー:', error);
      toast({
        title: 'エラー',
        description: 'ファイルの共有に失敗しました',
        variant: 'destructive',
      });
      return null;
    }
  };
  
  // ファイルダウンロード
  const handleDownloadFile = (file: FileInfo) => {
    if (!file.content) {
      toast({
        title: 'エラー',
        description: 'ファイル内容が取得できません',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      let content = file.content;
      if (typeof content === 'object') {
        content = JSON.stringify(content);
      }
      
      const blob = new Blob([content], { type: file.type });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
      
      toast({
        title: 'ダウンロード開始',
        description: `${file.name} のダウンロードを開始しました`,
      });
    } catch (error) {
      console.error('ファイルダウンロードエラー:', error);
      toast({
        title: 'エラー',
        description: 'ファイルのダウンロードに失敗しました',
        variant: 'destructive',
      });
    }
  };
  
  // ファイル選択
  const handleSelectFile = (file: FileInfo) => {
    setSelectedFile(file);
    setPreviewDialogOpen(true);
  };
  
  // ファイル編集
  const handleEditFile = (file: FileInfo) => {
    // TODO: 編集機能の実装
    toast({
      title: '編集機能',
      description: '編集機能は現在開発中です',
    });
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight">ファイル管理</h1>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="ファイルを検索..."
                className="pl-8 w-full sm:w-[300px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    searchFiles();
                  }
                }}
              />
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={fetchFiles}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              
              <FileCreateDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onFileCreate={handleCreateFile}
                templates={templates}
              >
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  新規作成
                </Button>
              </FileCreateDialog>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>ファイル一覧</CardTitle>
            <CardDescription>
              作成したファイル、テンプレートからの出力ファイルなどを管理します
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileList
              files={files}
              isLoading={isLoading}
              onSelect={handleSelectFile}
              onEdit={handleEditFile}
              onDelete={(file) => {
                setSelectedFile(file);
                setDeleteDialogOpen(true);
              }}
              onShare={(file) => {
                setSelectedFile(file);
                setShareDialogOpen(true);
              }}
              onDownload={handleDownloadFile}
              onPreview={handleSelectFile}
              className="min-h-[400px]"
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="text-sm text-muted-foreground">
              {files.length}件のファイル
            </div>
          </CardFooter>
        </Card>
      </div>
      
      {/* ファイル削除確認ダイアログ */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ファイルを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedFile?.name} を削除します。この操作は元に戻せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={handleDeleteFile}
            >
              <Trash className="h-4 w-4 mr-2" />
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* ファイル共有ダイアログ */}
      <FileShareDialog
        file={selectedFile || undefined}
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        onShareFile={handleShareFile}
      />
      
      {/* ファイルプレビューダイアログ */}
      <FilePreview
        file={selectedFile || undefined}
        open={previewDialogOpen}
        onOpenChange={setPreviewDialogOpen}
        onDownload={handleDownloadFile}
        onEdit={handleEditFile}
      />
    </MainLayout>
  );
}
