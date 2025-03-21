import React from 'react';
import { MainLayout } from '@/components/layout';
import { VSCodeEditor } from '@/components/editor';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function EditorPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">コードエディタ</h1>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>VSCode エディタ</CardTitle>
              <CardDescription>
                コードの編集、実行、デバッグができます。「接続」ボタンをクリックして開始してください。
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[800px]">
                <VSCodeEditor className="h-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
