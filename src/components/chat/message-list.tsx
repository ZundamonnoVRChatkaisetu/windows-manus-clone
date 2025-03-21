import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Message, ChatMessage } from './message';
import { Loader2 } from 'lucide-react';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  className?: string;
}

export function MessageList({
  messages,
  isLoading = false,
  className
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 新しいメッセージが来たら自動スクロール
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div
      className={cn(
        'flex flex-col w-full overflow-y-auto',
        className
      )}
    >
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="text-center text-muted-foreground">
            <p className="mb-2">エージェントを使い始めましょう</p>
            <p className="text-sm">エージェントは、あなたの指示に基づいてタスクを実行します。</p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 p-4 space-y-4">
            {messages.map((message) => (
              <Message key={message.id} message={message} />
            ))}
            
            {isLoading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">
                  エージェントが考えています...
                </span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </>
      )}
    </div>
  );
}
