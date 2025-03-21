'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface CodeEditorProps {
  code: string;
  language?: string;
  onChange?: (code: string) => void;
  readOnly?: boolean;
  className?: string;
  height?: string;
  placeholder?: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  language = 'javascript',
  onChange,
  readOnly = false,
  className = '',
  height = 'min-h-[200px]',
  placeholder = 'コードを入力してください...'
}) => {
  const [value, setValue] = useState(code || '');
  const editorRef = useRef<HTMLTextAreaElement>(null);
  
  useEffect(() => {
    setValue(code || '');
  }, [code]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    onChange?.(newValue);
  };

  // シンプルなシンタックスハイライトを模倣するスタイル
  const getLanguageClass = () => {
    switch (language.toLowerCase()) {
      case 'javascript':
      case 'js':
      case 'typescript':
      case 'ts':
        return 'text-blue-600 dark:text-blue-400';
      case 'html':
        return 'text-red-600 dark:text-red-400';
      case 'css':
        return 'text-green-600 dark:text-green-400';
      case 'python':
      case 'py':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-foreground';
    }
  };

  return (
    <div className={cn('relative border rounded-md overflow-hidden', className)}>
      <div className="flex items-center justify-between px-3 py-1.5 bg-muted/40 border-b">
        <span className="text-xs font-medium text-muted-foreground">
          {language.toUpperCase()}
        </span>
      </div>
      <textarea
        ref={editorRef}
        value={value}
        onChange={handleChange}
        readOnly={readOnly}
        placeholder={placeholder}
        className={cn(
          'w-full p-3 font-mono text-sm resize-none bg-background focus:outline-none',
          height,
          readOnly ? 'cursor-default' : '',
          getLanguageClass()
        )}
      />
    </div>
  );
};

export default CodeEditor;
