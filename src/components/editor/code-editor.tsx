'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface CodeEditorProps {
  value: string;
  language?: string;
  onChange?: (code: string) => void;
  readOnly?: boolean;
  className?: string;
  height?: string;
  placeholder?: string;
}

export function CodeEditor({
  value,
  language = 'javascript',
  onChange,
  readOnly = false,
  className = '',
  height = 'min-h-[200px]',
  placeholder = 'コードを入力してください...'
}: CodeEditorProps) {
  const [code, setCode] = useState(value || '');
  const editorRef = useRef<HTMLTextAreaElement>(null);
  
  useEffect(() => {
    setCode(value || '');
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setCode(newValue);
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
        value={code}
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
}

// 言語ごとのサンプルコードを取得する関数
export function getLanguageSample(language: string): string {
  switch (language.toLowerCase()) {
    case 'javascript':
    case 'js':
      return `// JavaScript Sample
console.log('Hello, World!');

function greet(name) {
  return \`Hello, \${name}!\`;
}

const result = greet('User');
console.log(result);
`;

    case 'typescript':
    case 'ts':
      return `// TypeScript Sample
console.log('Hello, World!');

function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

const result: string = greet('User');
console.log(result);
`;

    case 'python':
    case 'py':
      return `# Python Sample
print("Hello, World!")

def greet(name):
    return f"Hello, {name}!"

result = greet("User")
print(result)
`;

    case 'html':
      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HTML Sample</title>
</head>
<body>
  <h1>Hello, World!</h1>
  <p>This is a sample HTML document.</p>
</body>
</html>
`;

    case 'css':
      return `/* CSS Sample */
body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 20px;
  color: #333;
  background-color: #f8f8f8;
}

h1 {
  color: #0066cc;
}

p {
  line-height: 1.6;
}
`;

    case 'json':
      return `{
  "name": "sample-project",
  "version": "1.0.0",
  "description": "A sample project",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "test": "echo \\"Error: no test specified\\" && exit 1"
  },
  "keywords": ["sample", "example"],
  "author": "",
  "license": "MIT"
}
`;

    case 'markdown':
    case 'md':
      return `# Sample Markdown

## Introduction

This is a sample Markdown document.

- Item 1
- Item 2
- Item 3

[Link to Example](https://example.com)

\`\`\`javascript
console.log('Hello from code block!');
\`\`\`
`;

    default:
      return `// Sample Code
// Language: ${language}

// Your code here...
`;
  }
}