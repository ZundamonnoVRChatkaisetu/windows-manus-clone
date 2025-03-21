import React from 'react';
import { MainLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Send } from 'lucide-react';
import Link from 'next/link';

// 実際の実装では、この情報はAPIから取得します
const mockFeedback = {
  id: 'fb_123',
  type: 'BUG',
  content: 'ブラウザ機能でURLを入力してもページが読み込まれません。Chrome上でテストしたときに発生します。',
  email: 'user@example.com',
  status: 'NEW',
  rating: 3,
  createdAt: '2025-03-20T10:30:00Z',
  metadata: JSON.stringify({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    platform: 'Win32',
    screenSize: '1920x1080',
    locale: 'ja-JP',
  }),
  response: null,
};

interface FeedbackDetailPageProps {
  params: {
    id: string;
  };
}

export default function FeedbackDetailPage({ params }: FeedbackDetailPageProps) {
  const { id } = params;
  
  // 実際の実装では、このIDを使ってAPIからデータを取得します
  const feedback = mockFeedback;
  
  // メタデータをパース
  const metadata = feedback.metadata ? JSON.parse(feedback.metadata) : null;
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/feedback">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">フィードバック詳細</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>#{feedback.id}</CardTitle>
                    <CardDescription>
                      {new Date(feedback.createdAt).toLocaleString('ja-JP')}
                    </CardDescription>
                  </div>
                  <Badge className={
                    feedback.status === 'NEW' ? 'bg-yellow-500' :
                    feedback.status === 'IN_REVIEW' ? 'bg-blue-500' :
                    feedback.status === 'RESOLVED' ? 'bg-green-500' :
                    'bg-gray-500'
                  }>
                    {feedback.status === 'NEW' ? '新規' :
                    feedback.status === 'IN_REVIEW' ? 'レビュー中' :
                    feedback.status === 'RESOLVED' ? '解決済み' :
                    feedback.status === 'CLOSED' ? 'クローズ' :
                    feedback.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-1">種類</h3>
                  <Badge variant="outline">
                    {feedback.type === 'BUG' ? 'バグ報告' :
                    feedback.type === 'FEATURE_REQUEST' ? '機能リクエスト' :
                    feedback.type === 'IMPROVEMENT' ? '改善提案' :
                    feedback.type === 'QUESTION' ? '質問' :
                    '一般的なフィードバック'}
                  </Badge>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-1">評価</h3>
                  <div>{'★'.repeat(feedback.rating)}{'☆'.repeat(5 - feedback.rating)}</div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-1">内容</h3>
                  <div className="p-4 rounded-md bg-muted whitespace-pre-wrap">
                    {feedback.content}
                  </div>
                </div>
                
                {feedback.email && (
                  <div>
                    <h3 className="text-sm font-medium mb-1">連絡先メール</h3>
                    <div>{feedback.email}</div>
                  </div>
                )}
                
                {feedback.response && (
                  <div>
                    <h3 className="text-sm font-medium mb-1">返信内容</h3>
                    <div className="p-4 rounded-md bg-accent whitespace-pre-wrap">
                      {feedback.response}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>返信</CardTitle>
                <CardDescription>
                  フィードバックに対する返信を入力してください
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea 
                  placeholder="返信メッセージを入力..." 
                  className="min-h-[150px]"
                />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Select defaultValue={feedback.status}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="ステータスを変更" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NEW">新規</SelectItem>
                    <SelectItem value="IN_REVIEW">レビュー中</SelectItem>
                    <SelectItem value="RESOLVED">解決済み</SelectItem>
                    <SelectItem value="CLOSED">クローズ</SelectItem>
                    <SelectItem value="SPAM">スパム</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button>
                  <Send className="mr-2 h-4 w-4" />
                  送信して更新
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>メタデータ</CardTitle>
                <CardDescription>
                  フィードバック送信時の環境情報
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {metadata ? (
                  <>
                    <div>
                      <h3 className="text-sm font-medium mb-1">ユーザーエージェント</h3>
                      <div className="text-sm break-words">{metadata.userAgent}</div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium mb-1">プラットフォーム</h3>
                      <div>{metadata.platform}</div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium mb-1">画面サイズ</h3>
                      <div>{metadata.screenSize}</div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium mb-1">言語設定</h3>
                      <div>{metadata.locale}</div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium mb-1">送信日時</h3>
                      <div>{new Date(metadata.timestamp).toLocaleString('ja-JP')}</div>
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    メタデータはありません
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
