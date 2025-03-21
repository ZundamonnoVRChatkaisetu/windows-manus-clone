/**
 * ファイル操作に関する型定義
 */

// ファイル情報
export interface FileInfo {
  id: string;           // ファイルの一意なID
  name: string;         // ファイル名
  path: string;         // ファイルパス
  size: number;         // ファイルサイズ（バイト）
  type: string;         // MIMEタイプ
  extension: string;    // 拡張子
  createdAt: Date;      // 作成日時
  updatedAt: Date;      // 更新日時
  content?: string;     // ファイル内容（オプション）
  metadata?: any;       // 追加メタデータ
}

// ファイル一覧の取得オプション
export interface FileListOptions {
  path?: string;        // 取得するディレクトリパス
  filter?: string;      // フィルタパターン（拡張子など）
  sortBy?: FileSortOption; // ソート方法
  order?: 'asc' | 'desc'; // ソート順序
  limit?: number;       // 取得件数
  offset?: number;      // オフセット
}

// ファイルのソートオプション
export type FileSortOption = 
  | 'name'              // 名前順
  | 'size'              // サイズ順
  | 'createdAt'         // 作成日時順
  | 'updatedAt';        // 更新日時順

// ファイル操作結果
export interface FileOperationResult {
  success: boolean;     // 成功したかどうか
  message?: string;     // メッセージ
  fileInfo?: FileInfo;  // ファイル情報
  error?: any;          // エラー情報
}

// ファイル保存オプション
export interface FileSaveOptions {
  overwrite?: boolean;  // 上書きするかどうか
  createDirectory?: boolean; // ディレクトリを作成するかどうか
  encoding?: string;    // エンコーディング
}

// ファイル生成テンプレート
export interface FileTemplate {
  id: string;           // テンプレートID
  name: string;         // テンプレート名
  description: string;  // 説明
  category: string;     // カテゴリ
  extension: string;    // デフォルト拡張子
  content: string;      // テンプレート内容
  variables?: Record<string, string>; // 変数定義
}

// ファイル種別
export enum FileCategory {
  DOCUMENT = 'document',           // ドキュメント
  CODE = 'code',                   // コード
  IMAGE = 'image',                 // 画像
  DATA = 'data',                   // データ
  OTHER = 'other',                 // その他
}

// ファイル検索オプション
export interface FileSearchOptions {
  query: string;        // 検索クエリ
  path?: string;        // 検索パス
  recursive?: boolean;  // 再帰的に検索するかどうか
  caseSensitive?: boolean; // 大文字小文字を区別するかどうか
  matchWholeWord?: boolean; // 単語全体で一致するかどうか
  useRegex?: boolean;   // 正規表現を使用するかどうか
  includeContent?: boolean; // 内容も検索するかどうか
  fileTypes?: string[]; // 検索するファイル種別
}

// ファイル共有オプション
export interface FileShareOptions {
  expiresIn?: number;   // 有効期限（秒）
  password?: string;    // パスワード
  allowDownload?: boolean; // ダウンロードを許可するかどうか
  allowEdit?: boolean;  // 編集を許可するかどうか
}

// ファイル共有情報
export interface FileShareInfo {
  id: string;           // 共有ID
  url: string;          // 共有URL
  fileId: string;       // 共有対象のファイルID
  createdAt: Date;      // 作成日時
  expiresAt?: Date;     // 有効期限
  password?: boolean;   // パスワードが設定されているかどうか
  allowDownload: boolean; // ダウンロードが許可されているかどうか
  allowEdit: boolean;   // 編集が許可されているかどうか
}

// ファイル統計情報
export interface FileStats {
  totalFiles: number;   // 総ファイル数
  totalSize: number;    // 総サイズ
  categoryCounts: Record<string, number>; // カテゴリ別ファイル数
  extensionCounts: Record<string, number>; // 拡張子別ファイル数
  lastUpdated?: Date;   // 最終更新日時
}
