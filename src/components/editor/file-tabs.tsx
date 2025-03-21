'use client';

import React from 'react';
import { File, X, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VSCodeFile } from '@/lib/vscode';

interface FileTabsProps {
  files: VSCodeFile[];
  activeFile?: string;
  onSelectFile: (filePath: string) => void;
  onCloseFile: (filePath: string) => void;
  className?: string;
}

export function FileTabs({
  files,
  activeFile,
  onSelectFile,
  onCloseFile,
  className,
}: FileTabsProps) {
  // 開いているファイルのみを表示
  const openFiles = files.filter((file) => file.isOpen);

  if (openFiles.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-10 border-b', className)}>
        <span className="text-sm text-muted-foreground">開いているファイルはありません</span>
      </div>
    );
  }

  return (
    <div className={cn('border-b', className)}>
      <ScrollArea className="h-10" orientation="horizontal">
        <div className="flex h-10">
          {openFiles.map((file) => (
            <FileTab
              key={file.path}
              file={file}
              isActive={file.path === activeFile}
              onSelect={() => onSelectFile(file.path)}
              onClose={() => onCloseFile(file.path)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

interface FileTabProps {
  file: VSCodeFile;
  isActive: boolean;
  onSelect: () => void;
  onClose: () => void;
}

function FileTab({ file, isActive, onSelect, onClose }: FileTabProps) {
  // ファイルアイコンの色を拡張子に基づいて設定
  const getIconColor = (extension?: string) => {
    switch (extension?.toLowerCase()) {
      case 'js':
        return 'text-yellow-500';
      case 'ts':
        return 'text-blue-500';
      case 'html':
        return 'text-orange-500';
      case 'css':
        return 'text-purple-500';
      case 'json':
        return 'text-green-500';
      case 'md':
        return 'text-gray-500';
      case 'py':
        return 'text-blue-600';
      case 'java':
        return 'text-red-500';
      case 'cs':
        return 'text-purple-600';
      case 'cpp':
      case 'c':
      case 'h':
        return 'text-blue-700';
      default:
        return 'text-gray-400';
    }
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  return (
    <div
      className={cn(
        'flex items-center px-3 h-full cursor-pointer group hover:bg-accent hover:text-accent-foreground',
        isActive ? 'bg-accent text-accent-foreground border-t-2 border-primary' : 'border-t-2 border-transparent',
        file.isModified && !isActive && 'border-t-2 border-yellow-500'
      )}
      onClick={onSelect}
    >
      <File
        className={cn('h-4 w-4 mr-2 flex-shrink-0', getIconColor(file.extension))}
      />
      <span className="text-sm truncate max-w-[120px]">{file.name}</span>
      
      {file.isModified && (
        <Circle
          className={cn(
            'h-2 w-2 ml-2 flex-shrink-0',
            isActive ? 'text-primary' : 'text-yellow-500'
          )}
          fill="currentColor"
        />
      )}
      
      <button
        className="ml-2 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 focus:opacity-100"
        onClick={handleClose}
        aria-label={`Close ${file.name}`}
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}