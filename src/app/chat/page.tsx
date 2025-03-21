'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout';
import { 
  ChatInput, 
  MessageList, 
  ChatMessage 
} from '@/components/chat';
import { v4 as uuidv4 } from 'uuid';

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
    
    try {
      // TODO: ここでOllamaサービスを使用して応答を取得
      // 仮のタイムアウトでレスポンスをシミュレート
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // アシスタントからの応答を追加
      const assistantMessage: ChatMessage = {
        id: uuidv4(),
        content: `あなたのメッセージ: "${content}" を受け取りました。このデモではOllamaと連携していないため、実際の応答は生成されていません。`,
        role: 'assistant',
        createdAt: new Date(),
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('エラーが発生しました:', error);
      
      // エラーメッセージを追加
      const errorMessage: ChatMessage = {
        id: uuidv4(),
        content: 'エラーが発生しました。もう一度お試しください。',
        role: 'system',
        createdAt: new Date(),
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col h-[calc(100vh-4rem)] max-w-4xl mx-auto">
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
