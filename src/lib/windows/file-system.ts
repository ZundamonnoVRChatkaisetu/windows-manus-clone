/**
 * Windows環境でのファイルシステム操作を提供するモジュール
 */
import { formatWindowsPath, isValidWindowsPath, WIN_PATH_SEPARATOR } from './utils';
import { FileInfo } from '../files/types';

/**
 * WindowsファイルパスのURL変換スキーマ
 */
const FILE_URL_PREFIX = 'file:///';

/**
 * Windowsファイルの詳細情報
 */
export interface WindowsFileDetails {
  fullPath: string;
  name: string;
  extension: string;
  isDirectory: boolean;
  isHidden: boolean;
  isSystem: boolean;
  isReadOnly: boolean;
  createdAt: Date;
  modifiedAt: Date;
  accessedAt: Date;
  size: number;
  owner: string;
  permissions: string;
}

/**
 * Windowsディレクトリのリスト結果
 */
export interface WindowsDirectoryList {
  path: string;
  files: WindowsFileDetails[];
  directories: WindowsFileDetails[];
  error?: string;
}

/**
 * ファイル操作の結果
 */
export interface FileSystemResult {
  success: boolean;
  message: string;
  data?: any;
  error?: any;
}

/**
 * ファイル読み込みオプション
 */
export interface ReadFileOptions {
  encoding?: string;
  maxSize?: number;
}

/**
 * ファイル書き込みオプション
 */
export interface WriteFileOptions {
  encoding?: string;
  append?: boolean;
  overwrite?: boolean;
  createDirectory?: boolean;
}

/**
 * ディレクトリ作成オプション
 */
export interface CreateDirectoryOptions {
  recursive?: boolean;
  overwrite?: boolean;
}

/**
 * ファイル検索オプション
 */
export interface FileSearchOptions {
  recursive?: boolean;
  pattern?: string;
  includeHidden?: boolean;
  includeSystem?: boolean;
  minSize?: number;
  maxSize?: number;
  modifiedAfter?: Date;
  modifiedBefore?: Date;
}

/**
 * Windows環境のファイルシステム操作クラス
 */
export class WindowsFileSystem {
  private static instance: WindowsFileSystem;

  private constructor() {
    // シングルトンインスタンスの初期化
  }

  /**
   * シングルトンインスタンスを取得
   */
  public static getInstance(): WindowsFileSystem {
    if (!WindowsFileSystem.instance) {
      WindowsFileSystem.instance = new WindowsFileSystem();
    }
    return WindowsFileSystem.instance;
  }

  /**
   * ファイルパスが有効かチェック
   */
  public isValidPath(path: string): boolean {
    return isValidWindowsPath(path);
  }

  /**
   * パスを標準形式に変換（バックスラッシュ→スラッシュ）
   */
  public normalizePath(path: string): string {
    return formatWindowsPath(path);
  }

  /**
   * 相対パスを絶対パスに変換
   */
  public resolveAbsolutePath(basePath: string, relativePath: string): string {
    // 既に絶対パスなら変換不要
    if (/^[A-Za-z]:[\\/]/.test(relativePath) || relativePath.startsWith('\\\\')) {
      return this.normalizePath(relativePath);
    }

    // パスの結合と正規化
    const base = this.normalizePath(basePath);
    const relative = this.normalizePath(relativePath);
    
    let result = base;
    if (!result.endsWith('/')) {
      result += '/';
    }
    result += relative.startsWith('/') ? relative.substring(1) : relative;
    
    // パスの正規化（.. や . の解決）
    const segments = result.split('/');
    const resultSegments: string[] = [];
    
    for (const segment of segments) {
      if (segment === '.') {
        continue;
      } else if (segment === '..') {
        resultSegments.pop();
      } else if (segment !== '') {
        resultSegments.push(segment);
      }
    }
    
    return resultSegments.join('/');
  }

  /**
   * ディレクトリ一覧を取得
   * 実際の実装では、API経由でWindowsファイルシステムにアクセスする
   */
  public async listDirectory(path: string): Promise<WindowsDirectoryList> {
    try {
      // 実際の実装ではAPIエンドポイントを呼び出す
      const response = await fetch(`/api/windows/filesystem/list?path=${encodeURIComponent(path)}`);
      
      if (!response.ok) {
        const error = await response.text();
        return {
          path,
          files: [],
          directories: [],
          error: `API呼び出しエラー: ${error}`
        };
      }
      
      return await response.json();
    } catch (error) {
      return {
        path,
        files: [],
        directories: [],
        error: `リクエストエラー: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * ファイルの詳細情報を取得
   */
  public async getFileDetails(path: string): Promise<WindowsFileDetails | null> {
    try {
      const response = await fetch(`/api/windows/filesystem/details?path=${encodeURIComponent(path)}`);
      
      if (!response.ok) {
        return null;
      }
      
      return await response.json();
    } catch (error) {
      console.error('ファイル詳細取得エラー:', error);
      return null;
    }
  }

  /**
   * ファイルを読み込む
   */
  public async readFile(path: string, options?: ReadFileOptions): Promise<FileSystemResult> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('path', path);
      
      if (options?.encoding) {
        queryParams.append('encoding', options.encoding);
      }
      
      if (options?.maxSize) {
        queryParams.append('maxSize', options.maxSize.toString());
      }
      
      const response = await fetch(`/api/windows/filesystem/read?${queryParams.toString()}`);
      
      if (!response.ok) {
        const error = await response.text();
        return {
          success: false,
          message: `ファイル読み込みエラー: ${error}`
        };
      }
      
      // 返されるデータによってレスポンスの処理方法を変える
      const contentType = response.headers.get('content-type');
      
      let data;
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else if (options?.encoding) {
        data = await response.text();
      } else {
        data = await response.arrayBuffer();
      }
      
      return {
        success: true,
        message: 'ファイルを読み込みました',
        data
      };
    } catch (error) {
      return {
        success: false,
        message: 'ファイル読み込み中にエラーが発生しました',
        error
      };
    }
  }

  /**
   * ファイルを書き込む
   */
  public async writeFile(path: string, content: string | ArrayBuffer, options?: WriteFileOptions): Promise<FileSystemResult> {
    try {
      const formData = new FormData();
      formData.append('path', path);
      
      // コンテンツをBlobに変換
      let blob: Blob;
      if (typeof content === 'string') {
        blob = new Blob([content], { type: 'text/plain' });
      } else {
        blob = new Blob([content]);
      }
      
      formData.append('file', blob);
      
      // オプションの設定
      if (options) {
        if (options.encoding) formData.append('encoding', options.encoding);
        if (options.append !== undefined) formData.append('append', options.append.toString());
        if (options.overwrite !== undefined) formData.append('overwrite', options.overwrite.toString());
        if (options.createDirectory !== undefined) formData.append('createDirectory', options.createDirectory.toString());
      }
      
      const response = await fetch('/api/windows/filesystem/write', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const error = await response.text();
        return {
          success: false,
          message: `ファイル書き込みエラー: ${error}`
        };
      }
      
      const result = await response.json();
      
      return {
        success: true,
        message: 'ファイルを書き込みました',
        data: result
      };
    } catch (error) {
      return {
        success: false,
        message: 'ファイル書き込み中にエラーが発生しました',
        error
      };
    }
  }

  /**
   * ファイルを削除
   */
  public async deleteFile(path: string): Promise<FileSystemResult> {
    try {
      const response = await fetch('/api/windows/filesystem/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ path })
      });
      
      if (!response.ok) {
        const error = await response.text();
        return {
          success: false,
          message: `ファイル削除エラー: ${error}`
        };
      }
      
      return {
        success: true,
        message: 'ファイルを削除しました'
      };
    } catch (error) {
      return {
        success: false,
        message: 'ファイル削除中にエラーが発生しました',
        error
      };
    }
  }

  /**
   * ディレクトリを作成
   */
  public async createDirectory(path: string, options?: CreateDirectoryOptions): Promise<FileSystemResult> {
    try {
      const response = await fetch('/api/windows/filesystem/createDir', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          path,
          recursive: options?.recursive,
          overwrite: options?.overwrite
        })
      });
      
      if (!response.ok) {
        const error = await response.text();
        return {
          success: false,
          message: `ディレクトリ作成エラー: ${error}`
        };
      }
      
      return {
        success: true,
        message: 'ディレクトリを作成しました'
      };
    } catch (error) {
      return {
        success: false,
        message: 'ディレクトリ作成中にエラーが発生しました',
        error
      };
    }
  }

  /**
   * ファイル/ディレクトリをコピー
   */
  public async copy(sourcePath: string, destinationPath: string, overwrite: boolean = false): Promise<FileSystemResult> {
    try {
      const response = await fetch('/api/windows/filesystem/copy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sourcePath,
          destinationPath,
          overwrite
        })
      });
      
      if (!response.ok) {
        const error = await response.text();
        return {
          success: false,
          message: `コピーエラー: ${error}`
        };
      }
      
      return {
        success: true,
        message: 'ファイル/ディレクトリをコピーしました'
      };
    } catch (error) {
      return {
        success: false,
        message: 'コピー中にエラーが発生しました',
        error
      };
    }
  }

  /**
   * ファイル/ディレクトリを移動
   */
  public async move(sourcePath: string, destinationPath: string, overwrite: boolean = false): Promise<FileSystemResult> {
    try {
      const response = await fetch('/api/windows/filesystem/move', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sourcePath,
          destinationPath,
          overwrite
        })
      });
      
      if (!response.ok) {
        const error = await response.text();
        return {
          success: false,
          message: `移動エラー: ${error}`
        };
      }
      
      return {
        success: true,
        message: 'ファイル/ディレクトリを移動しました'
      };
    } catch (error) {
      return {
        success: false,
        message: '移動中にエラーが発生しました',
        error
      };
    }
  }

  /**
   * ファイルを検索
   */
  public async searchFiles(directoryPath: string, options?: FileSearchOptions): Promise<WindowsFileDetails[]> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('path', directoryPath);
      
      if (options) {
        if (options.recursive !== undefined) queryParams.append('recursive', options.recursive.toString());
        if (options.pattern) queryParams.append('pattern', options.pattern);
        if (options.includeHidden !== undefined) queryParams.append('includeHidden', options.includeHidden.toString());
        if (options.includeSystem !== undefined) queryParams.append('includeSystem', options.includeSystem.toString());
        if (options.minSize !== undefined) queryParams.append('minSize', options.minSize.toString());
        if (options.maxSize !== undefined) queryParams.append('maxSize', options.maxSize.toString());
        if (options.modifiedAfter) queryParams.append('modifiedAfter', options.modifiedAfter.toISOString());
        if (options.modifiedBefore) queryParams.append('modifiedBefore', options.modifiedBefore.toISOString());
      }
      
      const response = await fetch(`/api/windows/filesystem/search?${queryParams.toString()}`);
      
      if (!response.ok) {
        console.error('ファイル検索エラー:', await response.text());
        return [];
      }
      
      return await response.json();
    } catch (error) {
      console.error('ファイル検索中にエラーが発生しました:', error);
      return [];
    }
  }

  /**
   * ファイルが存在するか確認
   */
  public async fileExists(path: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/windows/filesystem/exists?path=${encodeURIComponent(path)}`);
      
      if (!response.ok) {
        return false;
      }
      
      const result = await response.json();
      return result.exists;
    } catch {
      return false;
    }
  }

  /**
   * ファイルの属性を取得
   */
  public async getFileAttributes(path: string): Promise<Record<string, any> | null> {
    try {
      const response = await fetch(`/api/windows/filesystem/attributes?path=${encodeURIComponent(path)}`);
      
      if (!response.ok) {
        return null;
      }
      
      return await response.json();
    } catch {
      return null;
    }
  }

  /**
   * ファイルのMIMEタイプを取得
   */
  public getMimeType(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    
    // 一般的なMIMEタイプのマッピング
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
    
    return mimeTypes[extension] || 'application/octet-stream';
  }

  /**
   * WindowsファイルパスをURLに変換
   */
  public pathToUrl(path: string): string {
    // パスを正規化
    const normalizedPath = this.normalizePath(path);
    
    // エンコード
    const encodedPath = normalizedPath
      .split('/')
      .map(segment => encodeURIComponent(segment))
      .join('/');
    
    return `${FILE_URL_PREFIX}${encodedPath}`;
  }

  /**
   * URLをWindowsファイルパスに変換
   */
  public urlToPath(url: string): string {
    if (!url.startsWith(FILE_URL_PREFIX)) {
      throw new Error('不正なファイルURL形式です');
    }
    
    // プレフィックスを削除
    const encodedPath = url.substring(FILE_URL_PREFIX.length);
    
    // デコード
    const decodedPath = encodedPath
      .split('/')
      .map(segment => decodeURIComponent(segment))
      .join('/');
    
    return decodedPath;
  }

  /**
   * WindowsファイルオブジェクトをFileInfo形式に変換
   */
  public convertToFileInfo(fileDetails: WindowsFileDetails): FileInfo {
    return {
      id: fileDetails.fullPath, // パスをIDとして使用
      name: fileDetails.name,
      path: fileDetails.fullPath,
      size: fileDetails.size,
      type: this.getMimeType(fileDetails.name),
      extension: fileDetails.extension,
      createdAt: fileDetails.createdAt,
      updatedAt: fileDetails.modifiedAt,
    };
  }
}

export default WindowsFileSystem.getInstance();
