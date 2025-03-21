import { v4 as uuidv4 } from 'uuid';
import { 
  FileCategory, 
  FileInfo, 
  FileListOptions, 
  FileOperationResult,
  FileSaveOptions, 
  FileSearchOptions, 
  FileShareInfo, 
  FileShareOptions, 
  FileStats, 
  FileTemplate 
} from './types';

/**
 * ファイル操作サービス
 */
export class FileService {
  private static instance: FileService;
  private files: Map<string, FileInfo>;
  private templates: Map<string, FileTemplate>;
  private sharedFiles: Map<string, FileShareInfo>;
  private eventListeners: Map<string, Function[]>;
  
  private constructor() {
    this.files = new Map<string, FileInfo>();
    this.templates = new Map<string, FileTemplate>();
    this.sharedFiles = new Map<string, FileShareInfo>();
    this.eventListeners = new Map<string, Function[]>();
    
    // テンプレートの初期化
    this.initTemplates();
  }
  
  /**
   * シングルトンインスタンスを取得
   */
  public static getInstance(): FileService {
    if (!FileService.instance) {
      FileService.instance = new FileService();
    }
    return FileService.instance;
  }
  
  /**
   * ファイル一覧を取得
   */
  public async listFiles(options?: FileListOptions): Promise<FileInfo[]> {
    // 実際の実装では、データベースやファイルシステムから取得する
    let files = Array.from(this.files.values());
    
    // フィルタリング
    if (options?.path) {
      files = files.filter(file => file.path.startsWith(options.path));
    }
    
    if (options?.filter) {
      const regex = new RegExp(options.filter, 'i');
      files = files.filter(file => regex.test(file.name) || regex.test(file.extension));
    }
    
    // ソート
    if (options?.sortBy) {
      files.sort((a, b) => {
        const aValue = a[options.sortBy!];
        const bValue = b[options.sortBy!];
        
        if (aValue < bValue) return options.order === 'desc' ? 1 : -1;
        if (aValue > bValue) return options.order === 'desc' ? -1 : 1;
        return 0;
      });
    }
    
    // ページング
    if (options?.offset !== undefined && options?.limit !== undefined) {
      files = files.slice(options.offset, options.offset + options.limit);
    }
    
    return files;
  }
  
  /**
   * ファイル情報を取得
   */
  public async getFile(id: string): Promise<FileInfo | null> {
    return this.files.get(id) || null;
  }
  
  /**
   * ファイルを作成
   */
  public async createFile(
    name: string, 
    content: string | ArrayBuffer, 
    options?: { 
      path?: string, 
      type?: string, 
      metadata?: any 
    }
  ): Promise<FileOperationResult> {
    try {
      const now = new Date();
      const path = options?.path || '/';
      const extension = name.includes('.') ? name.split('.').pop()! : '';
      const type = options?.type || this.getMimeTypeFromExtension(extension);
      const size = typeof content === 'string' ? 
        new Blob([content]).size : 
        content.byteLength;
      
      const fileInfo: FileInfo = {
        id: uuidv4(),
        name,
        path: path.endsWith('/') ? path + name : path + '/' + name,
        size,
        type,
        extension,
        createdAt: now,
        updatedAt: now,
        content: typeof content === 'string' ? content : undefined,
        metadata: options?.metadata,
      };
      
      this.files.set(fileInfo.id, fileInfo);
      this.emitEvent('file.created', fileInfo);
      
      return {
        success: true,
        message: 'ファイルが作成されました',
        fileInfo,
      };
    } catch (error) {
      return {
        success: false,
        message: 'ファイルの作成に失敗しました',
        error,
      };
    }
  }
  
  /**
   * ファイルを更新
   */
  public async updateFile(
    id: string, 
    content: string | ArrayBuffer, 
    options?: { 
      name?: string, 
      metadata?: any 
    }
  ): Promise<FileOperationResult> {
    try {
      const fileInfo = this.files.get(id);
      if (!fileInfo) {
        return {
          success: false,
          message: 'ファイルが見つかりません',
        };
      }
      
      const size = typeof content === 'string' ? 
        new Blob([content]).size : 
        content.byteLength;
      
      const updatedInfo: FileInfo = {
        ...fileInfo,
        name: options?.name || fileInfo.name,
        size,
        updatedAt: new Date(),
        content: typeof content === 'string' ? content : undefined,
        metadata: options?.metadata || fileInfo.metadata,
      };
      
      // パスの更新
      if (options?.name && options.name !== fileInfo.name) {
        const pathParts = fileInfo.path.split('/');
        pathParts.pop();
        const dirPath = pathParts.join('/');
        updatedInfo.path = dirPath + '/' + options.name;
        
        // 拡張子の更新
        if (options.name.includes('.')) {
          updatedInfo.extension = options.name.split('.').pop()!;
          updatedInfo.type = this.getMimeTypeFromExtension(updatedInfo.extension);
        }
      }
      
      this.files.set(id, updatedInfo);
      this.emitEvent('file.updated', updatedInfo);
      
      return {
        success: true,
        message: 'ファイルが更新されました',
        fileInfo: updatedInfo,
      };
    } catch (error) {
      return {
        success: false,
        message: 'ファイルの更新に失敗しました',
        error,
      };
    }
  }
  
  /**
   * ファイルを削除
   */
  public async deleteFile(id: string): Promise<FileOperationResult> {
    try {
      const fileInfo = this.files.get(id);
      if (!fileInfo) {
        return {
          success: false,
          message: 'ファイルが見つかりません',
        };
      }
      
      this.files.delete(id);
      this.emitEvent('file.deleted', fileInfo);
      
      return {
        success: true,
        message: 'ファイルが削除されました',
        fileInfo,
      };
    } catch (error) {
      return {
        success: false,
        message: 'ファイルの削除に失敗しました',
        error,
      };
    }
  }
  
  /**
   * ファイルを移動
   */
  public async moveFile(id: string, newPath: string): Promise<FileOperationResult> {
    try {
      const fileInfo = this.files.get(id);
      if (!fileInfo) {
        return {
          success: false,
          message: 'ファイルが見つかりません',
        };
      }
      
      const updatedInfo: FileInfo = {
        ...fileInfo,
        path: newPath.endsWith('/') ? newPath + fileInfo.name : newPath + '/' + fileInfo.name,
        updatedAt: new Date(),
      };
      
      this.files.set(id, updatedInfo);
      this.emitEvent('file.moved', { oldPath: fileInfo.path, newPath: updatedInfo.path, fileInfo: updatedInfo });
      
      return {
        success: true,
        message: 'ファイルが移動されました',
        fileInfo: updatedInfo,
      };
    } catch (error) {
      return {
        success: false,
        message: 'ファイルの移動に失敗しました',
        error,
      };
    }
  }
  
  /**
   * ファイルをコピー
   */
  public async copyFile(id: string, newPath: string, newName?: string): Promise<FileOperationResult> {
    try {
      const fileInfo = this.files.get(id);
      if (!fileInfo) {
        return {
          success: false,
          message: 'ファイルが見つかりません',
        };
      }
      
      const name = newName || fileInfo.name;
      const path = newPath.endsWith('/') ? newPath + name : newPath + '/' + name;
      const now = new Date();
      
      const newFileInfo: FileInfo = {
        ...fileInfo,
        id: uuidv4(),
        name,
        path,
        createdAt: now,
        updatedAt: now,
      };
      
      this.files.set(newFileInfo.id, newFileInfo);
      this.emitEvent('file.copied', { sourceId: id, fileInfo: newFileInfo });
      
      return {
        success: true,
        message: 'ファイルがコピーされました',
        fileInfo: newFileInfo,
      };
    } catch (error) {
      return {
        success: false,
        message: 'ファイルのコピーに失敗しました',
        error,
      };
    }
  }
  
  /**
   * ファイル内容を読み込む
   */
  public async readFile(id: string, encoding?: string): Promise<string | ArrayBuffer | null> {
    const fileInfo = this.files.get(id);
    if (!fileInfo || !fileInfo.content) {
      return null;
    }
    
    return fileInfo.content;
  }
  
  /**
   * ファイルをダウンロードする
   */
  public downloadFile(id: string): boolean {
    const fileInfo = this.files.get(id);
    if (!fileInfo || !fileInfo.content) {
      return false;
    }
    
    try {
      const blob = new Blob([fileInfo.content], { type: fileInfo.type });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = fileInfo.name;
      a.click();
      
      URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      console.error('ファイルのダウンロードに失敗しました:', error);
      return false;
    }
  }
  
  /**
   * ファイルを検索
   */
  public async searchFiles(options: FileSearchOptions): Promise<FileInfo[]> {
    let files = Array.from(this.files.values());
    
    // パスフィルタ
    if (options.path) {
      files = files.filter(file => {
        if (options.recursive) {
          return file.path.startsWith(options.path!);
        } else {
          const pathParts = file.path.split('/');
          pathParts.pop();
          const dirPath = pathParts.join('/');
          return dirPath === options.path;
        }
      });
    }
    
    // ファイルタイプフィルタ
    if (options.fileTypes && options.fileTypes.length > 0) {
      files = files.filter(file => 
        options.fileTypes!.some(type => file.extension.toLowerCase() === type.toLowerCase())
      );
    }
    
    // 検索クエリ
    if (options.query) {
      const query = options.caseSensitive ? options.query : options.query.toLowerCase();
      const regex = options.useRegex ? new RegExp(query, options.caseSensitive ? '' : 'i') : null;
      
      files = files.filter(file => {
        // ファイル名の検索
        const fileName = options.caseSensitive ? file.name : file.name.toLowerCase();
        if (regex) {
          if (regex.test(fileName)) return true;
        } else if (options.matchWholeWord) {
          if (fileName === query) return true;
        } else {
          if (fileName.includes(query)) return true;
        }
        
        // ファイル内容の検索
        if (options.includeContent && file.content) {
          const content = options.caseSensitive ? file.content : file.content.toLowerCase();
          if (regex) {
            return regex.test(content);
          } else if (options.matchWholeWord) {
            return content.split(/\s+/).includes(query);
          } else {
            return content.includes(query);
          }
        }
        
        return false;
      });
    }
    
    return files;
  }
  
  /**
   * ファイルを共有
   */
  public async shareFile(id: string, options?: FileShareOptions): Promise<FileShareInfo | null> {
    const fileInfo = this.files.get(id);
    if (!fileInfo) {
      return null;
    }
    
    try {
      const now = new Date();
      const shareId = uuidv4();
      
      const shareInfo: FileShareInfo = {
        id: shareId,
        url: `${window.location.origin}/share/${shareId}`,
        fileId: id,
        createdAt: now,
        allowDownload: options?.allowDownload !== undefined ? options.allowDownload : true,
        allowEdit: options?.allowEdit !== undefined ? options.allowEdit : false,
        password: !!options?.password,
      };
      
      if (options?.expiresIn) {
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + options.expiresIn);
        shareInfo.expiresAt = expiresAt;
      }
      
      this.sharedFiles.set(shareId, shareInfo);
      this.emitEvent('file.shared', shareInfo);
      
      return shareInfo;
    } catch (error) {
      console.error('ファイルの共有に失敗しました:', error);
      return null;
    }
  }
  
  /**
   * 共有を解除
   */
  public async unshareFile(shareId: string): Promise<boolean> {
    const shareInfo = this.sharedFiles.get(shareId);
    if (!shareInfo) {
      return false;
    }
    
    this.sharedFiles.delete(shareId);
    this.emitEvent('file.unshared', shareInfo);
    
    return true;
  }
  
  /**
   * 共有情報を取得
   */
  public getShareInfo(shareId: string): FileShareInfo | null {
    const shareInfo = this.sharedFiles.get(shareId);
    if (!shareInfo) {
      return null;
    }
    
    // 有効期限チェック
    if (shareInfo.expiresAt && shareInfo.expiresAt < new Date()) {
      this.sharedFiles.delete(shareId);
      return null;
    }
    
    return shareInfo;
  }
  
  /**
   * テンプレート一覧を取得
   */
  public getTemplates(category?: string): FileTemplate[] {
    let templates = Array.from(this.templates.values());
    
    if (category) {
      templates = templates.filter(template => template.category === category);
    }
    
    return templates;
  }
  
  /**
   * テンプレートからファイルを作成
   */
  public async createFileFromTemplate(
    templateId: string, 
    name: string, 
    variables?: Record<string, string>,
    path?: string
  ): Promise<FileOperationResult> {
    const template = this.templates.get(templateId);
    if (!template) {
      return {
        success: false,
        message: 'テンプレートが見つかりません',
      };
    }
    
    // 変数の置換
    let content = template.content;
    if (variables) {
      Object.entries(variables).forEach(([key, value]) => {
        content = content.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), value);
      });
    }
    
    return this.createFile(name, content, { path, metadata: { templateId } });
  }
  
  /**
   * ファイル統計情報を取得
   */
  public getFileStats(): FileStats {
    const files = Array.from(this.files.values());
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    
    // カテゴリ別カウント
    const categoryCounts: Record<string, number> = {};
    const getCategory = (file: FileInfo): string => {
      if (file.type.startsWith('image/')) return FileCategory.IMAGE;
      if (file.type.startsWith('text/')) {
        if (['js', 'ts', 'py', 'java', 'c', 'cpp', 'cs', 'go', 'rb', 'php'].includes(file.extension.toLowerCase())) {
          return FileCategory.CODE;
        }
        return FileCategory.DOCUMENT;
      }
      if (file.type.includes('json') || file.type.includes('xml') || file.type.includes('csv')) {
        return FileCategory.DATA;
      }
      return FileCategory.OTHER;
    };
    
    files.forEach(file => {
      const category = getCategory(file);
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });
    
    // 拡張子別カウント
    const extensionCounts: Record<string, number> = {};
    files.forEach(file => {
      const ext = file.extension.toLowerCase();
      extensionCounts[ext] = (extensionCounts[ext] || 0) + 1;
    });
    
    // 最終更新日時
    const lastUpdated = files.length > 0 ?
      new Date(Math.max(...files.map(file => file.updatedAt.getTime()))) :
      undefined;
    
    return {
      totalFiles: files.length,
      totalSize,
      categoryCounts,
      extensionCounts,
      lastUpdated,
    };
  }
  
  /**
   * イベントリスナーを追加
   */
  public on(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.push(callback);
    this.eventListeners.set(event, listeners);
  }
  
  /**
   * イベントリスナーを削除
   */
  public off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event) || [];
    const filteredListeners = listeners.filter(listener => listener !== callback);
    this.eventListeners.set(event, filteredListeners);
  }
  
  /**
   * イベント発火
   */
  private emitEvent(event: string, data: any): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error(`イベントリスナーエラー (${event}):`, error);
      }
    });
  }
  
  /**
   * ファイル拡張子からMIMEタイプを取得
   */
  private getMimeTypeFromExtension(extension: string): string {
    const mimeTypes: Record<string, string> = {
      'txt': 'text/plain',
      'html': 'text/html',
      'css': 'text/css',
      'js': 'text/javascript',
      'ts': 'text/typescript',
      'json': 'application/json',
      'xml': 'application/xml',
      'csv': 'text/csv',
      'md': 'text/markdown',
      'pdf': 'application/pdf',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'zip': 'application/zip',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    };
    
    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
  }
  
  /**
   * テンプレートの初期化
   */
  private initTemplates(): void {
    const templates: FileTemplate[] = [
      {
        id: 'html-basic',
        name: 'HTML基本テンプレート',
        description: '基本的なHTML5テンプレート',
        category: 'html',
        extension: 'html',
        content: `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>\${title}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
    }
  </style>
</head>
<body>
  <h1>\${title}</h1>
  <p>\${content}</p>
</body>
</html>`,
        variables: {
          title: 'ドキュメントタイトル',
          content: 'ここに内容を入力してください',
        },
      },
      {
        id: 'js-basic',
        name: 'JavaScript基本テンプレート',
        description: '基本的なJavaScriptテンプレート',
        category: 'javascript',
        extension: 'js',
        content: `/**
 * \${description}
 * @author \${author}
 * @date \${date}
 */

// 設定
const config = {
  // 設定値を追加
};

// メイン関数
function main() {
  console.log("プログラムを開始します");
  
  // ここにコードを追加
  
  return "完了";
}

// プログラム実行
main();`,
        variables: {
          description: 'プログラムの説明',
          author: 'あなたの名前',
          date: new Date().toISOString().split('T')[0],
        },
      },
      {
        id: 'react-component',
        name: 'Reactコンポーネント',
        description: 'React関数コンポーネントのテンプレート',
        category: 'react',
        extension: 'jsx',
        content: `import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * \${componentName} コンポーネント
 * \${description}
 */
const \${componentName} = ({ \${props} }) => {
  // ステート
  const [data, setData] = useState(null);
  
  // 副作用
  useEffect(() => {
    // ここに副作用を追加
  }, []);
  
  // レンダリング
  return (
    <div className="\${className}">
      <h2>\${componentName}</h2>
      {/* ここにコンポーネントの内容を追加 */}
    </div>
  );
};

\${componentName}.propTypes = {
  // PropTypesを追加
};

\${componentName}.defaultProps = {
  // デフォルト値を追加
};

export default \${componentName};`,
        variables: {
          componentName: 'MyComponent',
          description: 'コンポーネントの説明',
          props: 'prop1, prop2',
          className: 'my-component',
        },
      },
      {
        id: 'markdown-basic',
        name: 'Markdown基本テンプレート',
        description: '基本的なMarkdownテンプレート',
        category: 'markdown',
        extension: 'md',
        content: `# \${title}

## 概要

\${description}

## 目次

- [はじめに](#はじめに)
- [主なポイント](#主なポイント)
- [まとめ](#まとめ)

## はじめに

ここに導入部分を記述します。

## 主なポイント

- ポイント1
- ポイント2
- ポイント3

## まとめ

ここに結論を記述します。

---

作成者: \${author}  
作成日: \${date}`,
        variables: {
          title: 'ドキュメントタイトル',
          description: 'ドキュメントの説明',
          author: 'あなたの名前',
          date: new Date().toISOString().split('T')[0],
        },
      },
    ];
    
    templates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }
}
