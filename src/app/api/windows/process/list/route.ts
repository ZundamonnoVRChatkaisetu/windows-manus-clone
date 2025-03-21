/**
 * Windowsプロセス一覧取得API
 */
import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export async function GET(request: NextRequest) {
  try {
    // PowerShellを使用してプロセス情報を取得する
    // PowerShellのGet-Processを使うことで、各プロセスの詳細な情報を取得できる
    const command = `powershell -Command "
      Get-Process | 
        Select-Object Id, ProcessName, CPU, 
          @{Name='WorkingSet';Expression={$_.WorkingSet / 1KB}}, 
          @{Name='PrivateMemory';Expression={$_.PrivateMemorySize / 1KB}}, 
          @{Name='VirtualMemory';Expression={$_.VirtualMemorySize / 1KB}}, 
          @{Name='SessionId';Expression={$_.SessionId}}, 
          @{Name='StartTime';Expression={if($_.StartTime){$_.StartTime.ToString('o')}else{$null}}}, 
          @{Name='TotalRuntime';Expression={if($_.StartTime){(Get-Date) - $_.StartTime}else{$null}}}, 
          @{Name='User';Expression={$_.StartInfo.UserName}}, 
          Path, Company, Description |
        ConvertTo-Json
    "`;
    
    const { stdout, stderr } = await execPromise(command);
    
    if (stderr) {
      console.error('PowerShell error:', stderr);
      return NextResponse.json(
        { error: 'プロセス一覧取得中にエラーが発生しました', details: stderr },
        { status: 500 }
      );
    }
    
    // PowerShellの出力をJSONに変換
    let processes;
    try {
      processes = JSON.parse(stdout);
      
      // 単一プロセスの場合は配列に変換
      if (!Array.isArray(processes)) {
        processes = [processes];
      }
      
      // プロセス情報を整形
      const formattedProcesses = processes.map((proc: any) => ({
        pid: proc.Id,
        name: proc.ProcessName,
        cpu: proc.CPU || 0,
        memory: Math.round(proc.WorkingSet) || 0,
        privateMemory: Math.round(proc.PrivateMemory) || 0,
        virtualMemory: Math.round(proc.VirtualMemory) || 0,
        sessionId: proc.SessionId,
        startTime: proc.StartTime,
        runtime: proc.TotalRuntime ? {
          hours: Math.floor(proc.TotalRuntime.TotalHours),
          minutes: Math.floor(proc.TotalRuntime.TotalMinutes) % 60,
          seconds: Math.floor(proc.TotalRuntime.TotalSeconds) % 60
        } : null,
        user: proc.User || '',
        path: proc.Path || '',
        company: proc.Company || '',
        description: proc.Description || ''
      }));
      
      return NextResponse.json(formattedProcesses);
    } catch (parseError) {
      console.error('JSON解析エラー:', parseError);
      return NextResponse.json(
        { error: 'プロセス情報の解析に失敗しました', details: String(parseError) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('プロセス一覧取得エラー:', error);
    return NextResponse.json(
      { 
        error: 'プロセス一覧の取得に失敗しました', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}
