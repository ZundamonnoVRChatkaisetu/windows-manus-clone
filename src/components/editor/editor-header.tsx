import React from 'react';
import { Button } from '@/components/ui/button';
import {
  PlayCircle,
  PauseCircle,
  Save,
  FolderOpen,
  Plus,
  Search,
  RotateCw,
  XCircle,
  PlusCircle,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { VSCodeCommand } from '@/lib/vscode';

interface EditorHeaderProps {
  isConnected: boolean;
  isExecuting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onExecuteCommand: (command: VSCodeCommand | string, args?: any[]) => void;
  onRefresh: () => void;
  language: string;
  onLanguageChange: (language: string) => void;
}

export function EditorHeader({
  isConnected,
  isExecuting,
  onConnect,
  onDisconnect,
  onExecuteCommand,
  onRefresh,
  language,
  onLanguageChange,
}: EditorHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b p-2 bg-background">
      <div className="flex items-center space-x-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onExecuteCommand(VSCodeCommand.OPEN_FOLDER)}
                disabled={!isConnected}
              >
                <FolderOpen className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>フォルダを開く</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onExecuteCommand(VSCodeCommand.NEW_FILE)}
                disabled={!isConnected}
              >
                <Plus className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>新規ファイル</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onExecuteCommand(VSCodeCommand.SAVE_FILE)}
                disabled={!isConnected}
              >
                <Save className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>保存</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <span className="mx-2 text-muted-foreground">|</span>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onExecuteCommand(VSCodeCommand.RUN_CODE)}
                disabled={!isConnected || isExecuting}
              >
                <PlayCircle className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>実行</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onExecuteCommand(VSCodeCommand.STOP_CODE)}
                disabled={!isConnected || !isExecuting}
              >
                <PauseCircle className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>停止</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <span className="mx-2 text-muted-foreground">|</span>
        
        <Select value={language} onValueChange={onLanguageChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="言語を選択" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="javascript">JavaScript</SelectItem>
            <SelectItem value="typescript">TypeScript</SelectItem>
            <SelectItem value="python">Python</SelectItem>
            <SelectItem value="java">Java</SelectItem>
            <SelectItem value="csharp">C#</SelectItem>
            <SelectItem value="cpp">C++</SelectItem>
            <SelectItem value="go">Go</SelectItem>
            <SelectItem value="rust">Rust</SelectItem>
            <SelectItem value="html">HTML</SelectItem>
            <SelectItem value="css">CSS</SelectItem>
            <SelectItem value="json">JSON</SelectItem>
            <SelectItem value="markdown">Markdown</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex items-center space-x-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <RotateCw className="h-4 w-4 mr-2" />
                更新
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>エディタを更新</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {isConnected ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onDisconnect}
            className="bg-red-500 text-white hover:bg-red-600"
          >
            <XCircle className="h-4 w-4 mr-2" />
            切断
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={onConnect}>
            <PlusCircle className="h-4 w-4 mr-2" />
            接続
          </Button>
        )}
      </div>
    </div>
  );
}
