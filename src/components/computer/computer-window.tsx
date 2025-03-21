import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { 
  ChevronDown, 
  ChevronRight, 
  Cpu, 
  Play, 
  RotateCcw, 
  X, 
  Maximize2, 
  Minimize2,
  Square // Stopの代わりにSquareを使用
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface Action {
  id: string;
  type: 'browser' | 'file' | 'code' | 'system' | 'api';
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  details: string;
  timestamp: Date;
  duration?: number; // ミリ秒単位
  result?: string;
}

export interface ComputerWindowProps {
  actions: Action[];
  isRunning?: boolean;
  onStart?: () => void;
  onStop?: () => void;
  onReset?: () => void;
  className?: string;
}

export function ComputerWindow({
  actions = [],
  isRunning = false,
  onStart,
  onStop,
  onReset,
  className
}: ComputerWindowProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedActionIds, setExpandedActionIds] = useState<Set<string>>(new Set());

  // アクションの詳細表示/非表示を切り替える
  const toggleActionExpand = (actionId: string) => {
    const newExpandedActionIds = new Set(expandedActionIds);
    if (newExpandedActionIds.has(actionId)) {
      newExpandedActionIds.delete(actionId);
    } else {
      newExpandedActionIds.add(actionId);
    }
    setExpandedActionIds(newExpandedActionIds);
  };

  // アクションタイプに応じたアイコンとカラーを取得
  const getActionTypeDetails = (type: Action['type']) => {
    switch (type) {
      case 'browser':
        return { 
          icon: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <circle cx="15.5" cy="8.5" r="1.5" />
            <path d="M8.5 13.5c0 1.5 1.5 3 3.5 3s3.5-1.5 3.5-3" />
          </svg>,
          color: 'text-blue-500'
        };
      case 'file':
        return { 
          icon: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 3v4a1 1 0 0 0 1 1h4" />
            <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z" />
          </svg>,
          color: 'text-green-500'
        };
      case 'code':
        return { 
          icon: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>,
          color: 'text-purple-500'
        };
      case 'api':
        return { 
          icon: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 6.1H3" />
            <path d="M21 12.2H3" />
            <path d="M15.5 18.3H3" />
          </svg>,
          color: 'text-orange-500'
        };
      case 'system':
      default:
        return { 
          icon: <Cpu className="h-4 w-4" />,
          color: 'text-gray-500'
        };
    }
  };

  // アクションステータスに応じたカラーを取得
  const getStatusColor = (status: Action['status']) => {
    switch (status) {
      case 'running':
        return 'text-yellow-500 dark:text-yellow-400';
      case 'completed':
        return 'text-green-500 dark:text-green-400';
      case 'failed':
        return 'text-red-500 dark:text-red-400';
      case 'pending':
      default:
        return 'text-gray-500 dark:text-gray-400';
    }
  };

  return (
    <div
      className={cn(
        'border rounded-lg overflow-hidden bg-black text-green-400 font-mono',
        className
      )}
    >
      {/* ウィンドウヘッダー */}
      <div className="flex items-center justify-between p-2 bg-gray-900 border-b">
        <div className="flex items-center">
          <Cpu className="h-4 w-4 mr-2" />
          <span className="text-sm font-medium">Manusのコンピュータ</span>
        </div>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-full hover:bg-gray-800"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-full hover:bg-gray-800"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* ウィンドウコンテンツ */}
      {isExpanded && (
        <>
          {/* コマンドバー */}
          <div className="flex items-center p-2 bg-gray-900 border-b">
            <Button
              variant="outline"
              size="sm"
              className="mr-1 bg-gray-800 hover:bg-gray-700 text-green-400 border-green-600"
              onClick={onStart}
              disabled={isRunning}
            >
              <Play className="h-3 w-3 mr-1" />
              実行
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="mr-1 bg-gray-800 hover:bg-gray-700 text-red-400 border-red-600"
              onClick={onStop}
              disabled={!isRunning}
            >
              <Square className="h-3 w-3 mr-1" />
              停止
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-gray-800 hover:bg-gray-700 text-blue-400 border-blue-600"
              onClick={onReset}
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              リセット
            </Button>
          </div>

          {/* アクションリスト */}
          <div className="h-64 overflow-y-auto p-2 text-xs">
            {actions.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">アクションはありません</p>
              </div>
            ) : (
              <div className="space-y-2">
                {actions.map((action) => {
                  const { icon, color } = getActionTypeDetails(action.type);
                  const statusColor = getStatusColor(action.status);
                  const isActionExpanded = expandedActionIds.has(action.id);

                  return (
                    <div key={action.id} className="border border-gray-800 rounded-md overflow-hidden">
                      <div 
                        className="flex items-center justify-between p-2 bg-gray-900 cursor-pointer"
                        onClick={() => toggleActionExpand(action.id)}
                      >
                        <div className="flex items-center">
                          <div className="mr-1">
                            {isActionExpanded ? (
                              <ChevronDown className="h-3 w-3" />
                            ) : (
                              <ChevronRight className="h-3 w-3" />
                            )}
                          </div>
                          <div className={cn("mr-2", color)}>
                            {icon}
                          </div>
                          <span>{action.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {action.status === 'running' && (
                            <div className="animate-pulse h-2 w-2 rounded-full bg-yellow-500"></div>
                          )}
                          <span className={statusColor}>
                            {action.status}
                          </span>
                          <span className="text-gray-500">
                            {action.timestamp.toLocaleTimeString()}
                          </span>
                          {action.duration !== undefined && (
                            <span className="text-gray-500">
                              {(action.duration / 1000).toFixed(2)}s
                            </span>
                          )}
                        </div>
                      </div>

                      {isActionExpanded && (
                        <div className="p-2 bg-gray-950 border-t border-gray-800">
                          <div className="whitespace-pre-wrap break-all">{action.details}</div>
                          {action.result && (
                            <div className="mt-2 pt-2 border-t border-gray-800">
                              <span className="text-green-400">結果: </span>
                              <span className="text-gray-400">{action.result}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ステータスバー */}
          <div className="p-2 bg-gray-900 border-t text-xs flex justify-between">
            <div>
              ステータス: {isRunning ? (
                <span className="text-yellow-400">実行中</span>
              ) : (
                <span className="text-green-400">待機中</span>
              )}
            </div>
            <div>アクション数: {actions.length}</div>
          </div>
        </>
      )}
    </div>
  );
}
