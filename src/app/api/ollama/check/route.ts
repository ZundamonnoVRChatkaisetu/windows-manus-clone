import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';

const execPromise = promisify(exec);

export interface OllamaInstallInfo {
  isInstalled: boolean;
  version?: string;
  installPath?: string;
  isRunning?: boolean;
  error?: string;
}

export async function GET() {
  try {
    // Windows環境でのOllamaの一般的なインストールパス
    const defaultPaths = [
      path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'Ollama'),
      'C:\\Program Files\\Ollama',
      'C:\\Program Files (x86)\\Ollama',
    ];

    let installPath: string | undefined;
    let isInstalled = false;

    // インストールパスをチェック
    for (const p of defaultPaths) {
      try {
        const stat = fs.statSync(path.join(p, 'ollama.exe'));
        if (stat.isFile()) {
          installPath = p;
          isInstalled = true;
          break;
        }
      } catch (err) {
        // ファイルが存在しない場合は次のパスをチェック
        continue;
      }
    }

    // Ollamaが見つからない場合はPATHをチェック
    if (!isInstalled) {
      try {
        const { stdout } = await execPromise('where ollama');
        if (stdout.trim()) {
          installPath = path.dirname(stdout.trim().split('\\n')[0]);
          isInstalled = true;
        }
      } catch (err) {
        // コマンドが見つからない場合は次のチェックへ
      }
    }

    // Ollamaのバージョンを取得
    let version: string | undefined;
    let isRunning = false;

    if (isInstalled) {
      try {
        const { stdout } = await execPromise(`${installPath ? path.join(installPath, 'ollama.exe') : 'ollama'} --version`);
        version = stdout.trim();
      } catch (err) {
        // バージョン取得に失敗した場合はインストール済みだがバージョンは不明
      }

      // Ollamaサービスが実行中かチェック
      try {
        const response = await fetch('http://localhost:11434/api/version', { method: 'GET' });
        isRunning = response.ok;
      } catch (err) {
        // サービスが実行中でない場合
        isRunning = false;
      }
    }

    return NextResponse.json({
      isInstalled,
      version,
      installPath,
      isRunning
    });
  } catch (error) {
    console.error('Ollamaインストール確認中にエラーが発生しました:', error);
    return NextResponse.json({
      isInstalled: false,
      error: `Ollamaインストール確認中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`
    }, { status: 500 });
  }
}
