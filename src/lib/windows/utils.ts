/**
 * Windows環境固有のユーティリティ関数
 */

/**
 * 現在の環境がWindowsかどうかを判定する
 * サーバーサイドとクライアントサイドの両方で動作する
 */
export function isWindowsEnvironment(): boolean {
  if (typeof window !== 'undefined') {
    // クライアントサイド
    return window.navigator.userAgent.indexOf('Windows') !== -1;
  } else {
    // サーバーサイド
    return process.platform === 'win32';
  }
}

/**
 * Windowsのパスをフォーマットする
 * バックスラッシュをスラッシュに変換する
 */
export function formatWindowsPath(path: string): string {
  return path.replace(/\\/g, '/');
}

/**
 * Windowsの実行ファイルのパスを取得する（拡張子を付加）
 */
export function getExecutablePath(basePath: string): string {
  if (!basePath.endsWith('.exe')) {
    return `${basePath}.exe`;
  }
  return basePath;
}

/**
 * Windowsでのファイルパスの妥当性をチェックする
 */
export function isValidWindowsPath(path: string): boolean {
  // Windowsのファイルパスの基本的な妥当性チェック
  const invalidChars = /[<>:"|?*]/;
  const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;
  
  // パスをコンポーネントに分割
  const components = path.split(/[\/\\]/);
  
  for (const component of components) {
    if (component === '' || component === '..' || component === '.') {
      continue;
    }
    
    // 無効な文字が含まれているか
    if (invalidChars.test(component)) {
      return false;
    }
    
    // 予約語と一致するか
    if (reservedNames.test(component)) {
      return false;
    }
    
    // Windowsでは先頭または末尾のスペースとピリオドは無効
    if (component.startsWith(' ') || component.endsWith(' ') || component.endsWith('.')) {
      return false;
    }
  }
  
  return true;
}

/**
 * Windows用のフォルダパス区切り文字を取得
 */
export const WIN_PATH_SEPARATOR = '\\';

/**
 * Windowsレジストリのルートキーを列挙型で定義
 */
export enum RegistryRoot {
  HKEY_CLASSES_ROOT = 'HKEY_CLASSES_ROOT',
  HKEY_CURRENT_USER = 'HKEY_CURRENT_USER',
  HKEY_LOCAL_MACHINE = 'HKEY_LOCAL_MACHINE',
  HKEY_USERS = 'HKEY_USERS',
  HKEY_CURRENT_CONFIG = 'HKEY_CURRENT_CONFIG',
}

/**
 * Windowsデスクトップパスなど、よく使うパスの取得関数
 * 注意: この関数はクライアントサイドのみ動作
 */
export function getSpecialFolderPath(folder: 'Desktop' | 'Documents' | 'Downloads' | 'Music' | 'Pictures' | 'Videos'): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  // このモックは実際のWindowsアプリケーション実装で置き換える必要がある
  // Next.jsアプリからWindows環境と連携するためには、サーバーサイドのAPIエンドポイントを経由する必要がある
  const mockPaths: Record<string, string> = {
    'Desktop': 'C:/Users/user/Desktop',
    'Documents': 'C:/Users/user/Documents',
    'Downloads': 'C:/Users/user/Downloads',
    'Music': 'C:/Users/user/Music',
    'Pictures': 'C:/Users/user/Pictures',
    'Videos': 'C:/Users/user/Videos',
  };

  return mockPaths[folder] || null;
}

/**
 * Windowsのプロセスを実行するための関数（モック）
 * 実際の実装では、サーバーサイドでNode.jsのchild_processモジュールを使用する
 */
export async function executeWindowsCommand(command: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  // このモックは実際のWindowsアプリケーション実装で置き換える必要がある
  console.log(`[モック] Windowsコマンド実行: ${command}`);
  
  // モック応答
  return {
    stdout: `モック実行結果: ${command}`,
    stderr: '',
    exitCode: 0
  };
}
