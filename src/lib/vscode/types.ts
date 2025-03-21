/**
 * VSCode操作のための型定義
 */

// VSCodeのウィンドウ状態
export interface VSCodeWindowState {
  isOpen: boolean;         // VSCodeが開いているかどうか
  isConnected: boolean;    // VSCodeに接続しているかどうか
  isExecuting: boolean;    // コマンドを実行中かどうか
  path?: string;           // 現在開いているフォルダのパス
  files?: VSCodeFile[];    // 現在開いているファイルのリスト
  activeFile?: string;     // 現在アクティブなファイルのパス
  logs: VSCodeLog[];       // ログメッセージ
}

// VSCodeファイル情報
export interface VSCodeFile {
  path: string;            // ファイルパス
  name: string;            // ファイル名
  extension: string;       // 拡張子
  content?: string;        // ファイル内容
  isOpen: boolean;         // ファイルが開いているかどうか
  isActive: boolean;       // ファイルがアクティブかどうか
  isModified: boolean;     // ファイルが変更されているかどうか
}

// VSCodeログメッセージ
export interface VSCodeLog {
  id: string;              // ログID
  timestamp: Date;         // タイムスタンプ
  message: string;         // メッセージ
  level: VSCodeLogLevel;   // ログレベル
  source?: string;         // ログのソース（コマンドなど）
}

// VSCodeログレベル
export enum VSCodeLogLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  DEBUG = 'debug',
}

// VSCodeコマンド
export enum VSCodeCommand {
  OPEN_FOLDER = 'workbench.action.files.openFolder',
  OPEN_FILE = 'workbench.action.files.openFile',
  SAVE_FILE = 'workbench.action.files.save',
  SAVE_ALL = 'workbench.action.files.saveAll',
  NEW_FILE = 'workbench.action.files.newUntitledFile',
  CLOSE_FILE = 'workbench.action.closeActiveEditor',
  CLOSE_ALL = 'workbench.action.closeAllEditors',
  SEARCH = 'workbench.action.findInFiles',
  RUN_CODE = 'workbench.action.debug.run',
  STOP_CODE = 'workbench.action.debug.stop',
  INSTALL_EXTENSION = 'workbench.extensions.installExtension',
  FORMAT_DOCUMENT = 'editor.action.formatDocument',
}

// VSCodeコマンドの実行結果
export interface VSCodeCommandResult {
  success: boolean;        // コマンドが成功したかどうか
  message?: string;        // 結果メッセージ
  data?: any;              // コマンドの実行結果データ
  timestamp: Date;         // 実行時のタイムスタンプ
}

// VSCodeコマンドの引数
export interface VSCodeCommandOptions {
  args?: any[];            // コマンドに渡す引数
  timeout?: number;        // タイムアウト（ミリ秒）
}

// VSCodeの接続設定
export interface VSCodeConnectionOptions {
  host?: string;           // ホスト（デフォルト: localhost）
  port?: number;           // ポート（デフォルト: 3333）
  timeout?: number;        // 接続タイムアウト（ミリ秒）
  token?: string;          // 認証トークン
}

// VSCodeウィンドウ管理オプション
export interface VSCodeWindowOptions {
  path?: string;           // 開くフォルダのパス
  openNewWindow?: boolean; // 新しいウィンドウで開くかどうか
  addToWorkspace?: boolean; // ワークスペースに追加するかどうか
}

// VSCodeファイル操作オプション
export interface VSCodeFileOptions {
  content?: string;        // ファイル内容
  encoding?: string;       // エンコーディング（デフォルト: utf8）
  overwrite?: boolean;     // 上書きするかどうか
  createParentDirectories?: boolean; // 親ディレクトリを作成するかどうか
}

// VSCode検索オプション
export interface VSCodeSearchOptions {
  query: string;           // 検索クエリ
  includePattern?: string; // 含めるファイルパターン
  excludePattern?: string; // 除外するファイルパターン
  caseSensitive?: boolean; // 大文字小文字を区別するかどうか
  wholeWord?: boolean;     // 単語全体で一致するかどうか
  useRegex?: boolean;      // 正規表現を使用するかどうか
}

// VSCodeデバッグ設定
export interface VSCodeDebugOptions {
  program?: string;        // 実行するプログラムのパス
  args?: string[];         // プログラムの引数
  cwd?: string;            // 作業ディレクトリ
  env?: Record<string, string>; // 環境変数
  console?: 'internalConsole' | 'integratedTerminal' | 'externalTerminal'; // コンソールの種類
}

// VSCode言語固有の設定
export interface VSCodeLanguageOptions {
  language: string;        // 言語ID (javascript, typescript, python, etc.)
  tabSize?: number;        // タブサイズ
  insertSpaces?: boolean;  // スペースを挿入するかどうか
  formatOnSave?: boolean;  // 保存時にフォーマットするかどうか
  defaultFormatter?: string; // デフォルトのフォーマッター
}
