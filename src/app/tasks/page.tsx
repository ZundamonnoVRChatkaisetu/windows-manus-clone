'use client';

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout';
import { TaskList, Task, TaskDetailDialog } from '@/components/tasks';
import { v4 as uuidv4 } from 'uuid';

// サンプルデータ
const SAMPLE_TASKS: Task[] = [
  {
    id: uuidv4(),
    title: 'ウェブサイトの設計',
    description: 'Manusが生成した単一ページのウェブサイトを設計します。レスポンシブデザインと最新のUIトレンドを取り入れます。',
    status: 'completed',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3日前
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2日前
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2日前
  },
  {
    id: uuidv4(),
    title: 'ブログ記事の作成',
    description: 'AIと機械学習の最新トレンドに関するブログ記事を作成します。2000文字程度で、技術的な内容を一般ユーザーにもわかりやすく説明します。',
    status: 'running',
    createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30分前
    updatedAt: new Date(Date.now() - 1000 * 60 * 5), // 5分前
  },
  {
    id: uuidv4(),
    title: 'データ分析スクリプトの作成',
    description: 'CSVデータを分析し、トレンドを特定するPythonスクリプトを作成します。Pandas、Matplotlib、seabornライブラリを使用します。',
    status: 'pending',
    createdAt: new Date(Date.now() - 1000 * 60 * 10), // 10分前
    updatedAt: new Date(Date.now() - 1000 * 60 * 10), // 10分前
  },
  {
    id: uuidv4(),
    title: 'バグ修正',
    description: 'ウェブアプリのナビゲーションバーで発生しているバグを修正します。モバイル表示時にドロップダウンメニューが正しく表示されない問題を修正します。',
    status: 'failed',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2時間前
    updatedAt: new Date(Date.now() - 1000 * 60 * 60), // 1時間前
  },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(SAMPLE_TASKS);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // タスク詳細ダイアログを開く
  const handleViewTask = (task: Task) => {
    setSelectedTask(task);
    setIsDialogOpen(true);
  };

  // タスク詳細ダイアログを閉じる
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  // タスクをキャンセルする
  const handleCancelTask = (taskToCancel: Task) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskToCancel.id
          ? { 
              ...task, 
              status: 'failed', 
              updatedAt: new Date() 
            }
          : task
      )
    );
    
    setIsDialogOpen(false);
  };

  return (
    <MainLayout>
      <div className="container py-6">
        <TaskList
          tasks={tasks}
          onViewTask={handleViewTask}
          onCancelTask={handleCancelTask}
        />
        
        <TaskDetailDialog
          task={selectedTask}
          open={isDialogOpen}
          onClose={handleCloseDialog}
          onCancel={handleCancelTask}
        />
      </div>
    </MainLayout>
  );
}
