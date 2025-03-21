'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout';
import { 
  ChatInput, 
  MessageList, 
  ChatMessage 
} from '@/components/chat';
import { v4 as uuidv4 } from 'uuid';
import { toast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const router = useRouter();

  // 初期化時にウェルカムメッセージを表示
  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      id: uuidv4(),
      content: 'こんにちは！Manus AIのWindowsクローンです。タスクや質問がありましたらお気軽にどうぞ。',
      role: 'assistant',
      createdAt: new Date(),
    };
    setMessages([welcomeMessage]);
  }, []);

  // 新しいメッセージを追加する関数
  const handleSendMessage = async (content: string) => {
    // ユーザーメッセージを追加
    const userMessage: ChatMessage = {
      id: uuidv4(),
      content,
      role: 'user',
      createdAt: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setModelError(null); // エラー状態をリセット
    
    try {
      // APIにメッセージを送信
      const response = await fetch('/api/ollama/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages
            .concat(userMessage)
            .map(msg => ({
              role: msg.role,
              content: msg.content,
            })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error || 'エラーが発生しました';
        
        // モデル関連のエラーの場合
        if (errorMessage.includes('No model selected') || 
            errorMessage.includes('No Ollama models detected')) {
          setModelError(errorMessage);
          if (errorData.suggestion) {
            setModelError(`${errorMessage}\n${errorData.suggestion}`);
          }
          throw new Error(errorMessage);
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      
      // アシスタントからの応答を追加
      const assistantMessage: ChatMessage = {
        id: uuidv4(),
        content: data.message.content,
        role: 'assistant',
        createdAt: new Date(),
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('エラーが発生しました:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'エラーが発生しました。もう一度お試しください。';
      
      // エラー通知
      toast({
        title: "エラー",
        description: errorMessage,
        variant: "destructive",
      });
      
      // エラーメッセージを追加
      const systemMessage: ChatMessage = {
        id: uuidv4(),
        content: errorMessage,
        role: 'system',
        createdAt: new Date(),
      };
      
      setMessages((prev) => [...prev, systemMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col h-[calc(100vh-4rem)] max-w-4xl mx-auto">
        {modelError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>モデルエラー</AlertTitle>
            <AlertDescription>
              <p className="whitespace-pre-line mb-2">{modelError}</p>
              <Button onClick={() => router.push('/settings')} size="sm">
                設定ページへ移動
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        <div className="flex-1 overflow-hidden">
          <MessageList 
            messages={messages} 
            isLoading={isLoading} 
            className="h-full"
          />
        </div>
        
        <div className="mt-auto p-4">
          <ChatInput 
            onSend={handleSendMessage} 
            isLoading={isLoading} 
            placeholder="エージェントに指示を入力..."
          />
        </div>
      </div>
    </MainLayout>
  );
}
