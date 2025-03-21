import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Task } from './task-card';
import { CheckCircle2, Clock, AlertCircle, XCircle } from 'lucide-react';

interface TaskDetailDialogProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onCancel?: (task: Task) => void;
}

export function TaskDetailDialog({
  task,
  open,
  onClose,
  onCancel
}: TaskDetailDialogProps) {
  if (!task) return null;

  // ステータスに応じたアイコンとカラーを取得
  const getStatusDetails = (status: Task['status']) => {
    switch (status) {
      case 'pending':
        return {
          icon: <Clock className="h-5 w-5" />,
          label: '保留中',
          color: 'text-yellow-500 dark:text-yellow-400'
        };
      case 'running':
        return {
          icon: <Clock className="h-5 w-5 animate-spin" />,
          label: '実行中',
          color: 'text-blue-500 dark:text-blue-400'
        };
      case 'completed':
        return {
          icon: <CheckCircle2 className="h-5 w-5" />,
          label: '完了',
          color: 'text-green-500 dark:text-green-400'
        };
      case 'failed':
        return {
          icon: <XCircle className="h-5 w-5" />,
          label: '失敗',
          color: 'text-red-500 dark:text-red-400'
        };
      default:
        return {
          icon: <AlertCircle className="h-5 w-5" />,
          label: '不明',
          color: 'text-gray-500 dark:text-gray-400'
        };
    }
  };

  const { icon, label, color } = getStatusDetails(task.status);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{task.title}</DialogTitle>
          <DialogDescription className="flex items-center gap-1">
            <span className={color}>{icon}</span>
            <span>{label}</span>
            <span className="ml-2 text-muted-foreground">
              作成: {formatDate(task.createdAt)}
            </span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 my-4">
          <div>
            <h4 className="text-sm font-medium mb-1">説明</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {task.description}
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-1">タイムライン</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white">
                  <CheckCircle2 className="h-3 w-3" />
                </div>
                <span>タスク作成: {formatDate(task.createdAt)}</span>
              </div>
              
              {task.status === 'completed' && task.completedAt && (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white">
                    <CheckCircle2 className="h-3 w-3" />
                  </div>
                  <span>タスク完了: {formatDate(task.completedAt)}</span>
                </div>
              )}
              
              {task.status === 'failed' && (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white">
                    <XCircle className="h-3 w-3" />
                  </div>
                  <span>タスク失敗: {formatDate(task.updatedAt)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <DialogFooter>
          {task.status === 'running' && onCancel && (
            <Button variant="destructive" onClick={() => onCancel(task)}>
              タスクをキャンセル
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            閉じる
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 日付フォーマット用の関数
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date);
}
