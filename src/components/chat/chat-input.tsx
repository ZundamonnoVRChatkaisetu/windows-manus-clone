import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { SendHorizontal, Mic, Paperclip, Loader2 } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  className?: string;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  isLoading = false,
  className,
  placeholder = 'メッセージを入力...'
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    
    if (trimmedInput && !isLoading) {
      onSend(trimmedInput);
      setInput('');
    }
  };

  // テキストエリアの高さを自動調整
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 200);
      textarea.style.height = `${newHeight}px`;
    }
  }, [input]);

  // Enterキーで送信（Shift + Enterは改行）
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'relative flex w-full items-end gap-2 rounded-lg border bg-background p-2',
        className
      )}
    >
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="shrink-0"
        title="ファイルを添付"
      >
        <Paperclip className="h-5 w-5" />
        <span className="sr-only">ファイルを添付</span>
      </Button>
      
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={1}
        className="min-h-10 flex-1 resize-none bg-transparent px-2 py-1.5 outline-none"
        disabled={isLoading}
      />
      
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="shrink-0"
        title="音声入力"
      >
        <Mic className="h-5 w-5" />
        <span className="sr-only">音声入力</span>
      </Button>
      
      <Button
        type="submit"
        size="icon"
        disabled={!input.trim() || isLoading}
        title="送信"
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <SendHorizontal className="h-5 w-5" />
        )}
        <span className="sr-only">送信</span>
      </Button>
    </form>
  );
}
