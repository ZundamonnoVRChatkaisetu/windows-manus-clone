import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { installPath } = await request.json();
    
    // インストールパスが指定されていない場合はデフォルトのコマンドを使用
    const ollamaCommand = installPath 
      ? path.join(installPath, 'ollama.exe') 
      : 'ollama';
    
    // サービスが既に起動しているか確認
    try {
      const response = await fetch('http://localhost:11434/api/version', { method: 'GET' });
      if (response.ok) {
        // 既に起動している場合は成功を返す
        return NextResponse.json({ success: true });
      }
    } catch (err) {
      // サービスが実行中でない場合は起動を試みる
    }

    // サービス起動（非同期で実行し、すぐに制御を戻す）
    exec(`${ollamaCommand} serve`, (error) => {
      if (error) {
        console.error('Ollamaサービス起動中にエラーが発生しました:', error);
      }
    });

    // サービスが起動するまで少し待つ
    await new Promise(resolve => setTimeout(resolve, 2000));

    // サービスが起動したか確認
    try {
      const response = await fetch('http://localhost:11434/api/version', { method: 'GET' });
      return NextResponse.json({ success: response.ok });
    } catch (err) {
      return NextResponse.json({ success: false }, { status: 500 });
    }
  } catch (error) {
    console.error('Ollamaサービス起動中にエラーが発生しました:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
