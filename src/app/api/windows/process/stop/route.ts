/**
 * Windowsプロセス停止API
 */
import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pid, force } = body;
    
    if (!pid) {
      return NextResponse.json({ error: 'プロセスIDが指定されていません' }, { status: 400 });
    }
    
    // プロセスを停止する方法
    // 1. taskkill: Windowsの標準的なプロセス停止コマンド
    // 2. /F: 強制終了オプション
    const forceOption = force ? '/F' : '';
    const command = `taskkill ${forceOption} /PID ${pid}`;
    
    try {
      const { stdout, stderr } = await execPromise(command);
      
      // 成功の場合
      if (stdout.includes('成功') || stdout.includes('SUCCESS') || !stderr) {
        return NextResponse.json({
          success: true,
          pid,
          message: force ? '強制的にプロセスを停止しました' : 'プロセスを停止しました',
          output: stdout.trim(),
          exitCode: 0
        });
      } else {
        return NextResponse.json({
          success: false,
          pid,
          error: stderr.trim() || 'プロセスの停止に失敗しました',
          output: stdout.trim()
        }, { status: 500 });
      }
    } catch (execError: any) {
      // taskkillがエラーを返した場合
      if (execError.code === 128) {
        return NextResponse.json({
          success: false,
          pid,
          error: '指定されたプロセスが見つかりません',
          details: execError.message
        }, { status: 404 });
      } else {
        return NextResponse.json({
          success: false,
          pid,
          error: 'プロセスの停止中にエラーが発生しました',
          details: execError.message
        }, { status: 500 });
      }
    }
  } catch (error) {
    console.error('プロセス停止エラー:', error);
    return NextResponse.json(
      { 
        error: 'プロセスの停止に失敗しました', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}
