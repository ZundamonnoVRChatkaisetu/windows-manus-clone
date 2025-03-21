import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileInfo } from '@/lib/files';
import { Download, X, Edit, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilePreviewProps {
  file?: FileInfo;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onDownload?: (file: FileInfo) => void;
  onEdit?: (file: FileInfo) => void;
  children?: React.ReactNode;
}

export function FilePreview({
  file,
  open,
  onOpenChange,
  onDownload,
  onEdit,
  children,
}: FilePreviewProps) {
  if (!file) return null;
  
  // MIMEタイプに基づいてプレビュータイプを決定
  const getPreviewType = () => {
    const type = file.type;
    
    if (type.startsWith('image/')) {
      return 'image';
    } else if (type.includes('pdf')) {
      return 'pdf';
    } else if (type.startsWith('text/') || type.includes('json') || type.includes('javascript') || type.includes('typescript')) {
      return 'text';
    } else if (type.includes('html')) {
      return 'html';
    } else if (type.includes('csv') || type.includes('excel') || type.includes('spreadsheet')) {
      return 'csv';
    } else {
      return 'unknown';
    }
  };
  
  const previewType = getPreviewType();
  
  // 画像プレビュー
  const ImagePreview = () => {
    if (!file.content) return <div className="text-center p-4">イメージデータがありません</div>;
    
    try {
      // Base64エンコードされた画像データの場合
      const src = file.content.startsWith('data:') 
        ? file.content 
        : `data:${file.type};base64,${btoa(file.content)}`;
      
      return (
        <div className="flex justify-center p-4">
          <img
            src={src}
            alt={file.name}
            className="max-w-full max-h-[70vh] object-contain"
          />
        </div>
      );
    } catch (e) {
      return <div className="text-center p-4">イメージの表示に失敗しました</div>;
    }
  };
  
  // テキストプレビュー
  const TextPreview = () => {
    if (!file.content) return <div className="text-center p-4">テキストデータがありません</div>;
    
    return (
      <ScrollArea className="h-[70vh] w-full">
        <pre className="p-4 text-sm font-mono whitespace-pre-wrap break-all">
          {file.content}
        </pre>
      </ScrollArea>
    );
  };
  
  // PDFプレビュー
  const PdfPreview = () => {
    if (!file.content) return <div className="text-center p-4">PDFデータがありません</div>;
    
    try {
      // Base64エンコードされたPDFデータの場合
      const src = file.content.startsWith('data:') 
        ? file.content 
        : `data:application/pdf;base64,${btoa(file.content)}`;
      
      return (
        <div className="w-full h-[70vh]">
          <iframe
            src={src}
            width="100%"
            height="100%"
            title={file.name}
            className="border-0"
          />
        </div>
      );
    } catch (e) {
      return <div className="text-center p-4">PDFの表示に失敗しました</div>;
    }
  };
  
  // HTMLプレビュー
  const HtmlPreview = () => {
    if (!file.content) return <div className="text-center p-4">HTMLデータがありません</div>;
    
    return (
      <div className="w-full h-[70vh] border">
        <iframe
          srcDoc={file.content}
          width="100%"
          height="100%"
          title={file.name}
          sandbox="allow-same-origin"
          className="border-0"
        />
      </div>
    );
  };
  
  // CSVプレビュー
  const CsvPreview = () => {
    if (!file.content) return <div className="text-center p-4">CSVデータがありません</div>;
    
    try {
      // CSVを簡易的にパース
      const rows = file.content.split('\n').map(row => row.split(','));
      const headers = rows[0] || [];
      const data = rows.slice(1);
      
      return (
        <ScrollArea className="h-[70vh] w-full">
          <div className="p-4">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted">
                  {headers.map((header, index) => (
                    <th key={index} className="border p-2 text-left">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, rowIndex) => (
                  <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="border p-2">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScrollArea>
      );
    } catch (e) {
      return <div className="text-center p-4">CSVの表示に失敗しました</div>;
    }
  };
  
  // 未対応フォーマットのプレビュー
  const UnknownPreview = () => {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <div className="p-8 rounded-full bg-muted mb-4">
          <ExternalLink className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">プレビューできません</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          このファイル形式 ({file.extension}) はプレビューに対応していません。
          ダウンロードして適切なアプリケーションで開いてください。
        </p>
        <Button 
          className="mt-4"
          onClick={() => onDownload?.(file)}
        >
          <Download className="h-4 w-4 mr-2" />
          ダウンロード
        </Button>
      </div>
    );
  };
  
  // プレビュータイプに応じたコンポーネントをレンダリング
  const renderPreview = () => {
    switch (previewType) {
      case 'image':
        return <ImagePreview />;
      case 'text':
        return <TextPreview />;
      case 'pdf':
        return <PdfPreview />;
      case 'html':
        return <HtmlPreview />;
      case 'csv':
        return <CsvPreview />;
      default:
        return <UnknownPreview />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <span className="truncate">{file.name}</span>
          </DialogTitle>
          <DialogDescription>
            {file.path}
          </DialogDescription>
        </DialogHeader>

        <div className={cn(
          "mt-2",
          previewType === 'unknown' ? 'bg-background' : 'bg-muted/30 rounded-md'
        )}>
          {renderPreview()}
        </div>

        <DialogFooter className="gap-2">
          {previewType !== 'unknown' && (
            <Button 
              variant="outline"
              onClick={() => onDownload?.(file)}
            >
              <Download className="h-4 w-4 mr-2" />
              ダウンロード
            </Button>
          )}
          
          {(previewType === 'text' || previewType === 'html' || previewType === 'csv') && (
            <Button 
              onClick={() => onEdit?.(file)}
            >
              <Edit className="h-4 w-4 mr-2" />
              編集
            </Button>
          )}
          
          <Button 
            variant="ghost"
            onClick={() => onOpenChange?.(false)}
          >
            <X className="h-4 w-4 mr-2" />
            閉じる
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
