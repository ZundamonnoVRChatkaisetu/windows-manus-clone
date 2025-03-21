import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  readOnly?: boolean;
  className?: string;
  style?: React.CSSProperties;
  tabSize?: number;
  lineNumbers?: boolean;
  fontSize?: number;
}

export function CodeEditor({
  value,
  onChange,
  language = 'javascript',
  readOnly = false,
  className,
  style,
  tabSize = 2,
  lineNumbers = true,
  fontSize = 14,
}: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [lines, setLines] = useState<string[]>([]);
  const [selectionStart, setSelectionStart] = useState(0);

  // 行番号を更新
  useEffect(() => {
    setLines(value.split('\n').map((_, i) => String(i + 1)));
  }, [value]);

  // タブキーの処理
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      // タブをスペースに置き換え
      const spaces = ' '.repeat(tabSize);
      const newValue =
        value.substring(0, start) + spaces + value.substring(end);

      onChange(newValue);

      // カーソル位置を更新
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + tabSize;
      }, 0);
    }
  };

  // カーソル位置が変更されたときの処理
  const handleSelectionChange = () => {
    if (textareaRef.current) {
      setSelectionStart(textareaRef.current.selectionStart);
    }
  };

  // 現在の行番号を取得
  const getCurrentLineNumber = () => {
    const text = value.substring(0, selectionStart);
    return (text.match(/\n/g) || []).length + 1;
  };

  // 外部スクロールとのシンクロ用
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const onScroll = () => {
      const lineNumbersEl = textarea.previousElementSibling;
      if (lineNumbersEl) {
        lineNumbersEl.scrollTop = textarea.scrollTop;
      }
    };

    textarea.addEventListener('scroll', onScroll);
    return () => {
      textarea.removeEventListener('scroll', onScroll);
    };
  }, []);

  const currentLineNumber = getCurrentLineNumber();

  return (
    <div
      className={cn(
        'relative border rounded-md overflow-hidden bg-background text-foreground',
        className
      )}
      style={{
        ...style,
        fontFamily: 'monospace',
        fontSize: `${fontSize}px`,
      }}
    >
      {lineNumbers && (
        <div
          className="absolute top-0 left-0 bottom-0 overflow-hidden bg-muted text-muted-foreground text-right select-none p-2"
          style={{ width: '3em' }}
        >
          {lines.map((line, i) => (
            <div
              key={i}
              className={cn(
                'leading-relaxed',
                i + 1 === currentLineNumber && 'bg-accent text-accent-foreground'
              )}
            >
              {line}
            </div>
          ))}
        </div>
      )}

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onSelect={handleSelectionChange}
        onClick={handleSelectionChange}
        onKeyUp={handleSelectionChange}
        className={cn(
          'w-full h-full p-2 resize-none outline-none bg-transparent',
          lineNumbers && 'pl-12'
        )}
        style={{
          tabSize: tabSize,
          lineHeight: '1.5',
          minHeight: '300px',
        }}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        data-language={language}
        readOnly={readOnly}
      />
    </div>
  );
}

// 言語ごとのサンプルコード
export const getLanguageSample = (language: string): string => {
  switch (language.toLowerCase()) {
    case 'javascript':
      return `// JavaScript Sample
function greeting(name) {
  return \`Hello, \${name}!\`;
}

console.log(greeting('World'));
`;

    case 'typescript':
      return `// TypeScript Sample
function greeting(name: string): string {
  return \`Hello, \${name}!\`;
}

console.log(greeting('World'));
`;

    case 'python':
      return `# Python Sample
def greeting(name):
    return f"Hello, {name}!"

print(greeting("World"))
`;

    case 'java':
      return `// Java Sample
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
`;

    case 'csharp':
      return `// C# Sample
using System;

class Program {
    static void Main() {
        Console.WriteLine("Hello, World!");
    }
}
`;

    case 'cpp':
      return `// C++ Sample
#include <iostream>

int main() {
    std::cout << "Hello, World!" << std::endl;
    return 0;
}
`;

    case 'go':
      return `// Go Sample
package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
}
`;

    case 'rust':
      return `// Rust Sample
fn main() {
    println!("Hello, World!");
}
`;

    case 'html':
      return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hello World</title>
</head>
<body>
    <h1>Hello, World!</h1>
</body>
</html>
`;

    case 'css':
      return `/* CSS Sample */
body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
    background-color: #f5f5f5;
}

h1 {
    color: #333;
    text-align: center;
}
`;

    case 'json':
      return `{
  "greeting": "Hello, World!",
  "items": [
    { "id": 1, "name": "Item 1" },
    { "id": 2, "name": "Item 2" },
    { "id": 3, "name": "Item 3" }
  ],
  "isActive": true,
  "count": 42
}
`;

    case 'markdown':
      return `# Hello, World!

This is a sample Markdown document.

## Features

- **Bold text**
- *Italic text*
- \`Code snippets\`

> This is a blockquote

[Link to Google](https://www.google.com)
`;

    default:
      return `// Sample code
// Language: ${language}

// Write your code here
`;
  }
};
