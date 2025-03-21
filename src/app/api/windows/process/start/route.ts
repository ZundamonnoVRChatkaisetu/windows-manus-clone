/**
 * Windowsプロセス起動API
 */
import { NextRequest, NextResponse } from 'next/server';
import { exec, spawn, ChildProcess } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execPromise = promisify(exec);

// 実行中のプロセスの追跡
const runningProcesses = new Map<number, {
  process: ChildProcess;
  stdout: string;
  stderr: string;
  startTime: Date;
  endTime?: Date;
  command: string;
}>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { command, workingDir, env, shell, timeout, options } = body;
    
    if (!command) {
      return NextResponse.json({ error: 'コマンドが指定されていません' }, { status: 400 });
    }
    
    // 複雑なコマンドの場合はcmd.exeを使用
    const useShell = shell !== false;
    
    if (options && options.includes('/B')) {
      // デタッチドモードの場合はspawnを使用
      try {
        const spawnOptions: any = {
          detached: true,
          stdio: 'ignore',
          shell: useShell
        };
        
        if (workingDir) {
          spawnOptions.cwd = workingDir;
        }
        
        if (env) {
          spawnOptions.env = { ...process.env, ...env };
        }
        
        // Windowsの場合、cmd.exeを介してコマンドを実行
        let actualCommand = command;
        let actualArgs: string[] = [];
        
        if (useShell) {
          actualCommand = process.platform === 'win32' ? 'cmd.exe' : 'sh';
          actualArgs = process.platform === 'win32' ? ['/c', command] : ['-c', command];
        }
        
        const childProcess = spawn(actualCommand, actualArgs, spawnOptions);
        
        // プロセスの追跡を解除
        childProcess.unref();
        
        return NextResponse.json({
          success: true,
          pid: childProcess.pid,
          command,
          detached: true
        });
      } catch (error) {
        return NextResponse.json(
          { 
            error: 'デタッチドプロセスの起動に失敗しました', 
            details: error instanceof Error ? error.message : String(error) 
          },
          { status: 500 }
        );
      }
    } else {
      // 通常の同期実行
      const execOptions: any = {};
      
      if (workingDir) {
        execOptions.cwd = workingDir;
      }
      
      if (env) {
        execOptions.env = { ...process.env, ...env };
      }
      
      if (timeout) {
        execOptions.timeout = timeout;
      }
      
      // Windowsコマンドを最適化
      let optimizedCommand = command;
      
      // スタートオプションがある場合
      if (options) {
        // 優先度オプションを処理
        if (options.includes('/LOW') || options.includes('/BELOWNORMAL') || 
            options.includes('/ABOVENORMAL') || options.includes('/HIGH') || 
            options.includes('/REALTIME')) {
          optimizedCommand = `start ${options} /WAIT ${command}`;
        } 
        // 最小化オプションを処理
        else if (options.includes('/MIN')) {
          optimizedCommand = `start /MIN /WAIT ${command}`;
        }
      }
      
      // プロセスを実行
      const childProcess = exec(optimizedCommand, execOptions);
      let stdout = '';
      let stderr = '';
      
      // 出力を収集
      childProcess.stdout?.on('data', (data) => {
        stdout += data.toString();
      });
      
      childProcess.stderr?.on('data', (data) => {
        stderr += data.toString();
      });
      
      // プロセス情報を保存
      if (childProcess.pid) {
        runningProcesses.set(childProcess.pid, {
          process: childProcess,
          stdout,
          stderr,
          startTime: new Date(),
          command
        });
      }
      
      try {
        const { stdout: cmdStdout, stderr: cmdStderr } = await new Promise<{stdout: string, stderr: string}>((resolve, reject) => {
          childProcess.on('exit', (code) => {
            // プロセスが終了したら実行情報を更新
            if (childProcess.pid) {
              const processInfo = runningProcesses.get(childProcess.pid);
              if (processInfo) {
                processInfo.endTime = new Date();
                runningProcesses.set(childProcess.pid, processInfo);
              }
            }
            
            resolve({ stdout, stderr });
          });
          
          childProcess.on('error', (err) => {
            reject(err);
          });
        });
        
        return NextResponse.json({
          success: true,
          pid: childProcess.pid,
          stdout: cmdStdout,
          stderr: cmdStderr,
          command
        });
      } catch (execError: any) {
        // タイムアウトまたはその他のエラー
        if (execError.code === 'ETIMEDOUT') {
          return NextResponse.json(
            { error: `コマンド実行がタイムアウトしました (${timeout}ms)` },
            { status: 408 }
          );
        } else {
          return NextResponse.json(
            { 
              error: 'コマンド実行中にエラーが発生しました', 
              details: execError.message 
            },
            { status: 500 }
          );
        }
      }
    }
  } catch (error) {
    console.error('プロセス起動エラー:', error);
    return NextResponse.json(
      { 
        error: 'プロセスの起動に失敗しました', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

// プロセス情報の取得API
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pidStr = searchParams.get('pid');
  
  if (!pidStr) {
    return NextResponse.json({ error: 'プロセスIDが指定されていません' }, { status: 400 });
  }
  
  const pid = parseInt(pidStr, 10);
  
  if (isNaN(pid)) {
    return NextResponse.json({ error: '無効なプロセスIDが指定されました' }, { status: 400 });
  }
  
  const processInfo = runningProcesses.get(pid);
  
  if (!processInfo) {
    return NextResponse.json({ error: '指定されたプロセスが見つかりません' }, { status: 404 });
  }
  
  return NextResponse.json({
    pid,
    command: processInfo.command,
    stdout: processInfo.stdout,
    stderr: processInfo.stderr,
    startTime: processInfo.startTime.toISOString(),
    endTime: processInfo.endTime ? processInfo.endTime.toISOString() : undefined,
    running: !processInfo.endTime && !processInfo.process.killed
  });
}
