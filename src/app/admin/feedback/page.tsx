import React from 'react';
import { MainLayout } from '@/components/layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

export default function FeedbackAdminPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">フィードバック管理</h1>
        </div>

        <Tabs defaultValue="all">
          <TabsList className="mb-4">
            <TabsTrigger value="all">すべて</TabsTrigger>
            <TabsTrigger value="new">新規</TabsTrigger>
            <TabsTrigger value="in-review">レビュー中</TabsTrigger>
            <TabsTrigger value="resolved">解決済み</TabsTrigger>
            <TabsTrigger value="closed">クローズ</TabsTrigger>
          </TabsList>
          <TabsContent value="all">
            <FeedbackTable status="all" />
          </TabsContent>
          <TabsContent value="new">
            <FeedbackTable status="NEW" />
          </TabsContent>
          <TabsContent value="in-review">
            <FeedbackTable status="IN_REVIEW" />
          </TabsContent>
          <TabsContent value="resolved">
            <FeedbackTable status="RESOLVED" />
          </TabsContent>
          <TabsContent value="closed">
            <FeedbackTable status="CLOSED" />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

type FeedbackTableProps = {
  status: string;
};

function FeedbackTable({ status }: FeedbackTableProps) {
  // Note: This is a static example. In a real implementation,
  // you would fetch data from the API using useEffect and useState
  return (
    <Card>
      <CardHeader>
        <CardTitle>フィードバック一覧</CardTitle>
        <CardDescription>
          ユーザーからのフィードバックを確認・管理します
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableCaption>フィードバック一覧</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>種類</TableHead>
              <TableHead className="w-1/3">内容</TableHead>
              <TableHead>評価</TableHead>
              <TableHead>ステータス</TableHead>
              <TableHead>日時</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">fb_123</TableCell>
              <TableCell>
                <Badge variant="outline">バグ報告</Badge>
              </TableCell>
              <TableCell className="max-w-md truncate">
                ブラウザ機能でURLを入力してもページが読み込まれません。
              </TableCell>
              <TableCell>★★★☆☆</TableCell>
              <TableCell>
                <Badge className="bg-yellow-500">新規</Badge>
              </TableCell>
              <TableCell>2025-03-20</TableCell>
              <TableCell>表示</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">fb_124</TableCell>
              <TableCell>
                <Badge variant="outline">機能リクエスト</Badge>
              </TableCell>
              <TableCell className="max-w-md truncate">
                タスク管理機能に優先度の高い順でソートする機能を追加してほしいです。
              </TableCell>
              <TableCell>★★★★☆</TableCell>
              <TableCell>
                <Badge className="bg-blue-500">レビュー中</Badge>
              </TableCell>
              <TableCell>2025-03-19</TableCell>
              <TableCell>表示</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">fb_125</TableCell>
              <TableCell>
                <Badge variant="outline">一般</Badge>
              </TableCell>
              <TableCell className="max-w-md truncate">
                とても使いやすいアプリケーションです。今後の開発に期待しています。
              </TableCell>
              <TableCell>★★★★★</TableCell>
              <TableCell>
                <Badge className="bg-green-500">解決済み</Badge>
              </TableCell>
              <TableCell>2025-03-18</TableCell>
              <TableCell>表示</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          合計: 3件のフィードバック
        </div>
        <div className="flex gap-2">
          <span className="text-sm">1 / 1 ページ</span>
        </div>
      </CardFooter>
    </Card>
  );
}
