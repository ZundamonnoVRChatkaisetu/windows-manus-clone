'use client';

import React, { useState } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VSCodeFile } from '@/lib/vscode';

// ファイルツリーのアイテム型
export interface FileTreeItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  isOpen?: boolean;
  isActive?: boolean;
  children?: FileTreeItem[];
  extension?: string;
}

interface FileTreeProps {
  items: FileTreeItem[];
  activeFile?: string;
  onFileSelect: (file: FileTreeItem) => void;
  onFolderToggle: (folder: FileTreeItem) => void;
  className?: string;
}

export function FileTree({
  items,
  activeFile,
  onFileSelect,
  onFolderToggle,
  className,
}: FileTreeProps) {
  return (
    <div className={cn('p-2 text-sm', className)}>
      <ul className="space-y-1">
        {items.map((item) => (
          <FileTreeNode
            key={item.id}
            item={item}
            activeFile={activeFile}
            onFileSelect={onFileSelect}
            onFolderToggle={onFolderToggle}
            level={0}
          />
        ))}
      </ul>
    </div>
  );
}

interface FileTreeNodeProps {
  item: FileTreeItem;
  activeFile?: string;
  onFileSelect: (file: FileTreeItem) => void;
  onFolderToggle: (folder: FileTreeItem) => void;
  level: number;
}

function FileTreeNode({
  item,
  activeFile,
  onFileSelect,
  onFolderToggle,
  level,
}: FileTreeNodeProps) {
  const isActive = activeFile === item.path;
  const paddingLeft = level * 16;

  const handleClick = () => {
    if (item.type === 'file') {
      onFileSelect(item);
    } else {
      onFolderToggle(item);
    }
  };

  return (
    <li>
      <div
        className={cn(
          'flex items-center py-1 px-2 rounded cursor-pointer hover:bg-accent hover:text-accent-foreground',
          isActive && 'bg-primary text-primary-foreground'
        )}
        style={{ paddingLeft: `${paddingLeft + 4}px` }}
        onClick={handleClick}
      >
        {item.type === 'folder' && (
          <>
            {item.isOpen ? (
              <ChevronDown className="h-4 w-4 mr-1 flex-shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 mr-1 flex-shrink-0" />
            )}
            {item.isOpen ? (
              <FolderOpen className="h-4 w-4 mr-2 text-blue-500 flex-shrink-0" />
            ) : (
              <Folder className="h-4 w-4 mr-2 text-blue-500 flex-shrink-0" />
            )}
          </>
        )}
        {item.type === 'file' && (
          <File className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
        )}
        <span className="truncate">{item.name}</span>
      </div>
      
      {item.type === 'folder' && item.isOpen && item.children && (
        <ul className="mt-1">
          {item.children.map((child) => (
            <FileTreeNode
              key={child.id}
              item={child}
              activeFile={activeFile}
              onFileSelect={onFileSelect}
              onFolderToggle={onFolderToggle}
              level={level + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

// VSCodeFileからFileTreeItemに変換するヘルパー関数
export function transformVSCodeFilesToTreeItems(files: VSCodeFile[], rootPath: string): FileTreeItem[] {
  // パスをディレクトリ構造に変換
  const tree: { [key: string]: FileTreeItem } = {};
  const rootItems: FileTreeItem[] = [];
  
  // インデックスを追跡
  let index = 0;
  
  // ルートパスの処理
  const normalizedRootPath = rootPath.endsWith('/') || rootPath.endsWith('\\') 
    ? rootPath 
    : rootPath + '/';
  
  // ファイルをツリー構造に変換
  files.forEach(file => {
    // ルートパスを取り除く
    let relativePath = file.path;
    if (file.path.startsWith(normalizedRootPath)) {
      relativePath = file.path.substring(normalizedRootPath.length);
    }
    
    // パスをセグメントに分割
    const segments = relativePath.split(/[\/\\]/);
    let currentPath = '';
    let parentPath = '';
    
    // 各セグメントを処理
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      if (!segment) continue;
      
      parentPath = currentPath;
      currentPath = currentPath ? `${currentPath}/${segment}` : segment;
      
      // 最後のセグメント（ファイル）または途中のフォルダ
      const isFile = i === segments.length - 1;
      
      if (!tree[currentPath]) {
        const item: FileTreeItem = {
          id: `tree-item-${index++}`,
          name: segment,
          type: isFile ? 'file' : 'folder',
          path: file.path,
          isOpen: false,
          isActive: file.isActive,
          children: [],
        };
        
        if (isFile) {
          item.extension = file.extension;
        }
        
        tree[currentPath] = item;
        
        // 親フォルダに追加
        if (parentPath) {
          if (!tree[parentPath].children) {
            tree[parentPath].children = [];
          }
          tree[parentPath].children!.push(item);
        } else {
          // ルートアイテム
          rootItems.push(item);
        }
      }
    }
  });
  
  return rootItems;
}

// モックのファイルツリーを生成する関数
export function generateMockFileTree(): FileTreeItem[] {
  return [
    {
      id: 'root-1',
      name: 'my-project',
      type: 'folder',
      path: '/my-project',
      isOpen: true,
      children: [
        {
          id: 'folder-1',
          name: 'src',
          type: 'folder',
          path: '/my-project/src',
          isOpen: true,
          children: [
            {
              id: 'file-1',
              name: 'index.js',
              type: 'file',
              path: '/my-project/src/index.js',
              extension: 'js',
            },
            {
              id: 'file-2',
              name: 'app.js',
              type: 'file',
              path: '/my-project/src/app.js',
              extension: 'js',
            },
          ],
        },
        {
          id: 'folder-2',
          name: 'public',
          type: 'folder',
          path: '/my-project/public',
          isOpen: false,
          children: [
            {
              id: 'file-3',
              name: 'index.html',
              type: 'file',
              path: '/my-project/public/index.html',
              extension: 'html',
            },
          ],
        },
        {
          id: 'file-4',
          name: 'package.json',
          type: 'file',
          path: '/my-project/package.json',
          extension: 'json',
        },
        {
          id: 'file-5',
          name: 'README.md',
          type: 'file',
          path: '/my-project/README.md',
          extension: 'md',
        },
      ],
    },
  ];
}