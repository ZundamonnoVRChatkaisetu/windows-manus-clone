'use client';

import React, { useState, useEffect } from 'react';
import { ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { EditorHeader } from './editor-header';
import { FileTree, generateMockFileTree, FileTreeItem } from './file-tree';
import { FileTabs } from './file-tabs';
import { CodeEditor, getLanguageSample } from './code-editor';
import { OutputPanel } from './output-panel';
import { 
  VSCodeCommand, 
  VSCodeCommandResult,
  VSCodeFile, 
  VSCodeLog, 
  VSCodeLogLevel,
  VSCodeWindowState
} from '@/lib/vscode';
import { v4 as uuidv4 } from 'uuid';

interface VSCodeEditorProps {
  className?: string;
}

export function VSCodeEditor({ className }: VSCodeEditorProps) {
  const { toast } = useToast();
  
  // エディタの状態
  const [connected, setConnected] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState(getLanguageSample('javascript'));
  const [files, setFiles] = useState<VSCodeFile[]>([]);
  const [activeFile, setActiveFile] = useState<string | undefined>();
  const [fileTree, setFileTree] = useState<FileTreeItem[]>(generateMockFileTree());
  const [logs, setLogs] = useState<VSCodeLog[]>([]);

  // 初期化
  useEffect(() => {
    // モックデータを設定
    const mockFiles: VSCodeFile[] = [
      {
        path: '/my-project/src/index.js',
        name: 'index.js',
        extension: 'js',
        content: getLanguageSample('javascript'),
        isOpen: true,
        isActive: true,
        isModified: false,
      },
      {
        path: '/my-project/src/app.js',
        name: 'app.js',
        extension: 'js',
        content: `// App.js
import React from 'react';

function App() {
  return (
    <div>
      <h1>Hello, React!</h1>
    </div>
  );
}

export default App;
`,
        isOpen: true,
        isActive: false,
        isModified: true,
      },
      {
        path: '/my-project/public/index.html',
        name: 'index.html',
        extension: 'html',
        content: getLanguageSample('html'),
        isOpen: false,
        isActive: false,
        isModified: false,
      },
      {
        path: '/my-project/package.json',
        name: 'package.json',
        extension: 'json',
        content: getLanguageSample('json'),
        isOpen: false,
        isActive: false,
        isModified: false,
      },
      {
        path: '/my-project/README.md',
        name: 'README.md',
        extension: 'md',
        content: getLanguageSample('markdown'),
        isOpen: false,
        isActive: false,
        isModified: false,
      },
    ];
    
    setFiles(mockFiles);
    setActiveFile('/my-project/src/index.js');
    
    // アクティブファイルのコードを設定
    const activeFileData = mockFiles.find(f => f.path === '/my-project/src/index.js');
    if (activeFileData) {
      setCode(activeFileData.content || '');
      setLanguage(activeFileData.extension || 'javascript');
    }
    
    // 接続時にログを追加
    if (connected) {
      addLog('VSCodeに接続しました', VSCodeLogLevel.INFO);
    }
  }, [connected]);

  // VSCodeに接続
  const handleConnect = () => {
    setConnected(true);
    toast({
      title: 'VSCodeに接続しました',
      description: 'エディタが利用可能になりました',
    });
  };

  // VSCodeから切断
  const handleDisconnect = () => {
    setConnected(false);
    toast({
      title: 'VSCodeから切断しました',
      description: 'エディタとの接続が切断されました',
    });
  };

  // コマンドを実行
  const handleExecuteCommand = async (command: VSCodeCommand | string, args?: any[]) => {
    if (!connected) {
      toast({
        title: 'エラー',
        description: 'VSCodeに接続されていません',
        variant: 'destructive',
      });
      return;
    }
    
    addLog(`コマンド実行: ${command}`, VSCodeLogLevel.INFO);
    
    // 実際の実装では、APIを使用してコマンドを実行
    // ここではモック実装
    
    // コマンドに応じた処理
    switch (command) {
      case VSCodeCommand.OPEN_FOLDER:
        toast({
          title: 'フォルダを開く',
          description: 'フォルダ選択ダイアログが表示されます',
        });
        break;
        
      case VSCodeCommand.OPEN_FILE:
        toast({
          title: 'ファイルを開く',
          description: 'ファイル選択ダイアログが表示されます',
        });
        break;
        
      case VSCodeCommand.NEW_FILE:
        toast({
          title: '新規ファイル',
          description: '新しいファイルが作成されました',
        });
        break;
        
      case VSCodeCommand.SAVE_FILE:
        // 現在のファイルを保存
        if (activeFile) {
          const updatedFiles = files.map(file => {
            if (file.path === activeFile) {
              return { ...file, content: code, isModified: false };
            }
            return file;
          });
          
          setFiles(updatedFiles);
          
          toast({
            title: 'ファイルを保存',
            description: `${activeFile.split('/').pop()} が保存されました`,
          });
          
          addLog(`ファイルを保存しました: ${activeFile}`, VSCodeLogLevel.INFO);
        }
        break;
        
      case VSCodeCommand.RUN_CODE:
        // コードを実行
        setExecuting(true);
        addLog('コードを実行中...', VSCodeLogLevel.INFO);
        
        // 実行を模擬（3秒後に結果表示）
        setTimeout(() => {
          addLog('実行結果:', VSCodeLogLevel.INFO);
          
          if (language === 'javascript' || language === 'typescript') {
            addLog('Hello, World!', VSCodeLogLevel.INFO);
          } else if (language === 'python') {
            addLog('Hello, World!', VSCodeLogLevel.INFO);
          } else {
            addLog('出力: Hello, World!', VSCodeLogLevel.INFO);
          }
          
          setExecuting(false);
        }, 3000);
        break;
        
      case VSCodeCommand.STOP_CODE:
        // 実行を停止
        setExecuting(false);
        addLog('実行を停止しました', VSCodeLogLevel.WARNING);
        break;
        
      default:
        // その他のコマンド
        toast({
          title: 'コマンド実行',
          description: `${command} が実行されました`,
        });
    }
  };

  // ファイルを選択
  const handleSelectFile = (filePath: string) => {
    const selectedFile = files.find(file => file.path === filePath);
    if (!selectedFile) return;
    
    // ファイルがまだ開かれていない場合は開く
    const updatedFiles = files.map(file => ({
      ...file,
      isActive: file.path === filePath,
      isOpen: file.path === filePath ? true : file.isOpen,
    }));
    
    setFiles(updatedFiles);
    setActiveFile(filePath);
    setCode(selectedFile.content || '');
    setLanguage(selectedFile.extension || 'javascript');
    
    addLog(`ファイルを開きました: ${filePath}`, VSCodeLogLevel.INFO);
  };

  // ファイルを閉じる
  const handleCloseFile = (filePath: string) => {
    // ファイルを閉じる
    const fileIndex = files.findIndex(file => file.path === filePath);
    if (fileIndex === -1) return;
    
    const isActive = files[fileIndex].isActive;
    const updatedFiles = files.map(file => ({
      ...file,
      isOpen: file.path === filePath ? false : file.isOpen,
      isActive: file.path === filePath ? false : file.isActive,
    }));
    
    setFiles(updatedFiles);
    
    // アクティブなファイルを閉じた場合は、別のファイルをアクティブにする
    if (isActive) {
      const openFiles = updatedFiles.filter(file => file.isOpen);
      if (openFiles.length > 0) {
        const newActiveFile = openFiles[0];
        const finalFiles = updatedFiles.map(file => ({
          ...file,
          isActive: file.path === newActiveFile.path,
        }));
        
        setFiles(finalFiles);
        setActiveFile(newActiveFile.path);
        setCode(newActiveFile.content || '');
        setLanguage(newActiveFile.extension || 'javascript');
      } else {
        setActiveFile(undefined);
        setCode('');
      }
    }
    
    addLog(`ファイルを閉じました: ${filePath}`, VSCodeLogLevel.INFO);
  };

  // フォルダを開閉
  const handleFolderToggle = (folder: FileTreeItem) => {
    const toggleFolder = (items: FileTreeItem[]): FileTreeItem[] => {
      return items.map(item => {
        if (item.id === folder.id) {
          return { ...item, isOpen: !item.isOpen };
        }
        
        if (item.children) {
          return { ...item, children: toggleFolder(item.children) };
        }
        
        return item;
      });
    };
    
    setFileTree(toggleFolder(fileTree));
  };

  // コードが変更されたらファイルを修正済みとしてマーク
  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    
    if (activeFile) {
      const fileIndex = files.findIndex(file => file.path === activeFile);
      if (fileIndex !== -1 && files[fileIndex].content !== newCode) {
        const updatedFiles = [...files];
        updatedFiles[fileIndex] = {
          ...updatedFiles[fileIndex],
          isModified: true,
          content: newCode,
        };
        setFiles(updatedFiles);
      }
    }
  };

  // ログを追加
  const addLog = (message: string, level: VSCodeLogLevel, source?: string) => {
    const log: VSCodeLog = {
      id: uuidv4(),
      timestamp: new Date(),
      message,
      level,
      source,
    };
    
    setLogs(prevLogs => [log, ...prevLogs].slice(0, 100)); // 最大100件まで保持
  };

  // ログをクリア
  const handleClearLogs = () => {
    setLogs([]);
    addLog('ログをクリアしました', VSCodeLogLevel.INFO);
  };

  // 言語が変更されたときの処理
  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    
    // サンプルコードを設定するかを確認
    if (!code || code === getLanguageSample(language)) {
      setCode(getLanguageSample(newLanguage));
    }
    
    toast({
      title: '言語を変更',
      description: `言語を ${newLanguage} に変更しました`,
    });
  };

  // リフレッシュボタンが押されたときの処理
  const handleRefresh = () => {
    // 現在のファイルを再読み込み
    if (activeFile) {
      const fileData = files.find(file => file.path === activeFile);
      if (fileData) {
        setCode(fileData.content || '');
      }
    }
    
    toast({
      title: '更新',
      description: 'エディタを更新しました',
    });
  };

  return (
    <div className={cn('flex flex-col h-full border rounded-md overflow-hidden bg-background', className)}>
      <EditorHeader
        isConnected={connected}
        isExecuting={executing}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        onExecuteCommand={handleExecuteCommand}
        onRefresh={handleRefresh}
        language={language}
        onLanguageChange={handleLanguageChange}
      />
      
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* サイドバー */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
          <FileTree
            items={fileTree}
            activeFile={activeFile}
            onFileSelect={(file) => handleSelectFile(file.path)}
            onFolderToggle={handleFolderToggle}
            className="h-full"
          />
        </ResizablePanel>
        
        {/* メインエディタ */}
        <ResizablePanel defaultSize={80}>
          <div className="flex flex-col h-full">
            <FileTabs
              files={files}
              activeFile={activeFile}
              onSelectFile={handleSelectFile}
              onCloseFile={handleCloseFile}
            />
            
            <ResizablePanelGroup direction="vertical" className="flex-1">
              {/* コードエディタ */}
              <ResizablePanel defaultSize={70}>
                <CodeEditor
                  value={code}
                  onChange={handleCodeChange}
                  language={language}
                  readOnly={!connected}
                  className="h-full"
                />
              </ResizablePanel>
              
              {/* 出力パネル */}
              <ResizablePanel defaultSize={30}>
                <OutputPanel
                  logs={logs}
                  onClear={handleClearLogs}
                  className="h-full"
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}