'use client';

export interface OllamaInstallInfo {
  isInstalled: boolean;
  version?: string;
  installPath?: string;
  isRunning?: boolean;
  error?: string;
}

/**
 * Ollamaのインストール状況を確認する
 */
export async function checkOllamaInstallation(): Promise<OllamaInstallInfo> {
  try {
    const response = await fetch('/api/ollama/check');
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Ollamaインストール確認中にエラーが発生しました:', error);
    return {
      isInstalled: false,
      error: `Ollamaインストール確認中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Ollamaサービスを起動する
 */
export async function startOllamaService(installPath?: string): Promise<boolean> {
  try {
    // サービスが既に起動しているか確認
    try {
      const response = await fetch('http://localhost:11434/api/version', { method: 'GET' });
      if (response.ok) {
        // 既に起動している場合は成功を返す
        return true;
      }
    } catch (err) {
      // サービスが実行中でない場合は起動を試みる
    }

    // APIルートを使用してサービス起動
    const startResponse = await fetch('/api/ollama/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ installPath }),
    });

    if (!startResponse.ok) {
      throw new Error(`API request failed with status ${startResponse.status}`);
    }

    const result = await startResponse.json();
    return result.success;
  } catch (error) {
    console.error('Ollamaサービス起動中にエラーが発生しました:', error);
    return false;
  }
}

/**
 * OllamaインストーラーをダウンロードするためのURLを取得
 */
export function getOllamaInstallerUrl(): string {
  return 'https://ollama.ai/download/windows';
}
