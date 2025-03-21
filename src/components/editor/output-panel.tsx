'use client';

import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Trash2, DownloadCloud } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VSCodeLog, VSCodeLogLevel } from '@/lib/vscode';

interface OutputPanelProps {
  logs: VSCodeLog[];
  onClear: () => void;
  onDownload?: () => void;
  className?: string;
}

export function OutputPanel({
  logs,
  onClear,
  onDownload,
  className,
}: OutputPanelProps) {
  const downloadLogs = () => {
    if (onDownload) {
      onDownload();
      return;
    }

    // デフォルトのダウンロード処理
    try {
      const text = logs
        .map((log) => `[${new Date(log.timestamp).toLocaleString()}] [${log.level}] ${log.message}`)
        .join('\n');
      
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `vscode-logs-${new Date().toISOString().split('T')[0]}.txt`;
      a.click();
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('ログのダウンロードに失敗しました:', error);
    }
  };

  return (
    <div className={cn('flex flex-col h-full border rounded-md overflow-hidden', className)}>
      <div className="flex items-center justify-between px-3 py-2 bg-muted">
        <h3 className="text-sm font-medium">出力</h3>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={downloadLogs}
            title="ログをダウンロード"
          >
            <DownloadCloud className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onClear}
            title="クリア"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-3 bg-black text-white text-sm font-mono">
        {logs.length === 0 ? (
          <div className="text-gray-500 italic">出力はありません</div>
        ) : (
          <div className="space-y-1">
            {logs.map((log) => (
              <LogLine key={log.id} log={log} />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

interface LogLineProps {
  log: VSCodeLog;
}

function LogLine({ log }: LogLineProps) {
  // ログレベルに応じたスタイル
  const levelStyles = {
    [VSCodeLogLevel.INFO]: 'text-blue-400',
    [VSCodeLogLevel.WARNING]: 'text-yellow-400',
    [VSCodeLogLevel.ERROR]: 'text-red-400',
    [VSCodeLogLevel.DEBUG]: 'text-gray-400',
  };

  const time = new Date(log.timestamp).toLocaleTimeString();

  return (
    <div className="whitespace-pre-wrap break-all">
      <span className="text-gray-500">[{time}]</span>{' '}
      <span className={levelStyles[log.level]}>
        [{log.level}]
      </span>{' '}
      {log.source && <span className="text-purple-400">[{log.source}]</span>}{' '}
      <span>{log.message}</span>
    </div>
  );
}