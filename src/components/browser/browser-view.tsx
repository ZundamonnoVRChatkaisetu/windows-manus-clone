import React, { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  Home, 
  X, 
  Search,
  MoreHorizontal,
  Share2,
  Download,
  Printer
} from 'lucide-react';

interface BrowserViewProps {
  initialUrl?: string;
  className?: string;
}

export function BrowserView({
  initialUrl = 'about:blank',
  className
}: BrowserViewProps) {
  const [url, setUrl] = useState(initialUrl);
  const [inputUrl, setInputUrl] = useState(initialUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // ブラウザ履歴を前に戻る
  const handleGoBack = () => {
    if (iframeRef.current && canGoBack) {
      // 実際の実装ではここでiframeの履歴を戻る処理を行う
      // iframeRef.current.contentWindow.history.back();
      console.log('Go back');
    }
  };
  
  // ブラウザ履歴を次に進む
  const handleGoForward = () => {
    if (iframeRef.current && canGoForward) {
      // 実際の実装ではここでiframeの履歴を進む処理を行う
      // iframeRef.current.contentWindow.history.forward();
      console.log('Go forward');
    }
  };
  
  // ページをリロード
  const handleRefresh = () => {
    if (iframeRef.current) {
      setIsLoading(true);
      // 実際の実装ではここでiframeをリロードする処理を行う
      // iframeRef.current.src = iframeRef.current.src;
      console.log('Refresh page');
      
      // ローディング状態のシミュレーション
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    }
  };
  
  // URLを読み込む
  const handleLoadUrl = (e: React.FormEvent) => {
    e.preventDefault();
    
    let processedUrl = inputUrl.trim();
    if (!processedUrl.startsWith('http://') && !processedUrl.startsWith('https://')) {
      processedUrl = `https://${processedUrl}`;
    }
    
    setUrl(processedUrl);
    setIsLoading(true);
    
    // ローディング状態のシミュレーション
    setTimeout(() => {
      setIsLoading(false);
      setCanGoBack(true); // 実際にはiframeの状態に基づいて設定する
    }, 1000);
  };
  
  // ホームページに戻る
  const handleGoHome = () => {
    setInputUrl('https://www.google.com');
    setUrl('https://www.google.com');
  };

  return (
    <div
      className={cn(
        'flex flex-col border rounded-lg overflow-hidden bg-background h-full',
        className
      )}
    >
      {/* ブラウザコントロールバー */}
      <div className="flex items-center p-2 border-b">
        <div className="flex space-x-1 mr-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleGoBack}
            disabled={!canGoBack}
            title="戻る"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleGoForward}
            disabled={!canGoForward}
            title="進む"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isLoading}
            title="再読み込み"
            className={isLoading ? 'animate-spin' : ''}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleGoHome}
            title="ホーム"
          >
            <Home className="h-4 w-4" />
          </Button>
        </div>
        
        <form onSubmit={handleLoadUrl} className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-2">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            className="w-full h-9 rounded-md pl-8 pr-8 border bg-background"
            placeholder="URLを入力"
          />
          {inputUrl && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute inset-y-0 right-0 h-9 w-9"
              onClick={() => setInputUrl('')}
              title="クリア"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </form>
        
        <div className="flex space-x-1 ml-2">
          <Button
            variant="ghost"
            size="icon"
            title="共有"
          >
            <Share2 className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            title="ダウンロード"
          >
            <Download className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            title="印刷"
          >
            <Printer className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            title="その他"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* ブラウザコンテンツ (iframe) */}
      <div className="flex-1 bg-white overflow-hidden">
        <iframe
          ref={iframeRef}
          src={url}
          title="ブラウザビュー"
          className="w-full h-full border-none"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        />
      </div>
      
      {/* ステータスバー */}
      <div className="flex items-center justify-between px-2 py-1 border-t bg-muted text-xs text-muted-foreground">
        <div>{url}</div>
        <div>{isLoading ? '読み込み中...' : '完了'}</div>
      </div>
    </div>
  );
}
