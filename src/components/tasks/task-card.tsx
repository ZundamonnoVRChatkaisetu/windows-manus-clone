import React from 'react';
import { cn } from '@/lib/utils';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  XCircle, 
  ExternalLink 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

interface TaskCardProps {
  task: Task;
  onView?: (task: Task) => void;
  onCancel?: (task: Task) => void;
  className?: string;
}

export function TaskCard({
  task,
  onView,
  onCancel,
  className
}: TaskCardProps) {
  // ステータスに応じたアイコンとカラーを取得
  const getStatusDetails = (status: TaskStatus) => {
    switch (status) {
      case 'pending':
        return {
          icon: <Clock className="h-5 w-5" />,
          label: '保留中',
          color: 'text-yellow-500 dark:text-yellow-400',
          bgColor: 'bg-yellow-50 dark:bg-yellow-950'
        };
      case 'running':
        return {
          icon: <Clock className="h-5 w-5 animate-spin" />,
          label: '実行中',
          color: 'text-blue-500 dark:text-blue-400',
          bgColor: 'bg-blue-50 dark:bg-blue-950'
        };
      case 'completed':
        return {
          icon: <CheckCircle2 className="h-5 w-5" />,
          label: '完了',
          color: 'text-green-500 dark:text-green-400',
          bgColor: 'bg-green-50 dark:bg-green-950'
        };
      case 'failed':
        return {
          icon: <XCircle className="h-5 w-5" />,
          label: '失敗',
          color: 'text-red-500 dark:text-red-400',
          bgColor: 'bg-red-50 dark:bg-red-950'
        };
      default:
        return {
          icon: <AlertCircle className="h-5 w-5" />,
          label: '不明',
          color: 'text-gray-500 dark:text-gray-400',
          bgColor: 'bg-gray-50 dark:bg-gray-900'
        };
    }
  };

  const { icon, label, color, bgColor } = getStatusDetails(task.status);

  return (
    <div
      className={cn(
        'rounded-lg border p-4 shadow-sm',
        {
          'bg-card': task.status !== 'running',
          [bgColor]: task.status === 'running',
        },
        className
      )}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">{task.title}</h3>
          <div className={cn('flex items-center gap-1', color)}>
            {icon}
            <span className="text-xs">{label}</span>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground line-clamp-2">
          {task.description}
        </p>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
          <span>
            {task.status === 'completed' && task.completedAt
              ? `完了: ${formatDate(task.completedAt)}`
              : `作成: ${formatDate(task.createdAt)}`}
          </span>
          
          <div className="flex gap-2">
            {task.status === 'running' && onCancel && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onCancel(task)}
                className="h-7 px-2"
              >
                キャンセル
              </Button>
            )}
            
            {onView && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onView(task)}
                className="h-7 px-2"
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                詳細
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 日付フォーマット用の関数
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}
