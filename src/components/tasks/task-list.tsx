import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Task, TaskCard } from './task-card';
import { Button } from '@/components/ui/button';
import { 
  Filter, 
  MoreHorizontal, 
  Check, 
  RefreshCw, 
  Clock 
} from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
  onViewTask?: (task: Task) => void;
  onCancelTask?: (task: Task) => void;
  className?: string;
}

export function TaskList({
  tasks,
  onViewTask,
  onCancelTask,
  className
}: TaskListProps) {
  const [filter, setFilter] = useState<'all' | 'running' | 'completed' | 'pending'>('all');
  
  // タスクをフィルタリング
  const filteredTasks = tasks.filter((task) => {
    switch (filter) {
      case 'running':
        return task.status === 'running';
      case 'completed':
        return task.status === 'completed';
      case 'pending':
        return task.status === 'pending';
      default:
        return true;
    }
  });

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">タスク</h2>
        
        <div className="flex items-center space-x-2">
          <FilterButton 
            icon={<Clock className="h-4 w-4" />}
            label="保留"
            isActive={filter === 'pending'}
            onClick={() => setFilter(filter === 'pending' ? 'all' : 'pending')}
          />
          
          <FilterButton 
            icon={<RefreshCw className="h-4 w-4" />}
            label="実行中"
            isActive={filter === 'running'}
            onClick={() => setFilter(filter === 'running' ? 'all' : 'running')}
          />
          
          <FilterButton 
            icon={<Check className="h-4 w-4" />}
            label="完了"
            isActive={filter === 'completed'}
            onClick={() => setFilter(filter === 'completed' ? 'all' : 'completed')}
          />
          
          <Button variant="ghost" size="icon" title="その他のオプション">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">その他のオプション</span>
          </Button>
        </div>
      </div>
      
      {filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
          <Filter className="h-10 w-10 mb-2" />
          <h3 className="text-lg font-medium">タスクが見つかりません</h3>
          <p className="text-sm">
            {filter === 'all'
              ? 'タスクがまだ作成されていません。'
              : `選択した条件に合うタスクがありません。`}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onView={onViewTask}
              onCancel={onCancelTask}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface FilterButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function FilterButton({ icon, label, isActive, onClick }: FilterButtonProps) {
  return (
    <Button
      variant={isActive ? 'default' : 'outline'}
      size="sm"
      className="h-8"
      onClick={onClick}
    >
      {icon}
      <span className="ml-1">{label}</span>
    </Button>
  );
}
