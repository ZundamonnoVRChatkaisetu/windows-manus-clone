/**
 * Windows環境向けのサンドボックス実装
 * 安全にコマンドを実行するための隔離環境を提供する
 */
import { v4 as uuidv4 } from 'uuid';
import prisma from '@/lib/prisma/client';
import windowsProcess, { ProcessOptions, ProcessInfo, ProcessStatus } from '@/lib/windows/process';
import windowsFileSystem from '@/lib/windows/file-system';

// サンドボックスセッション情報
export interface WindowsSandboxSession {
  id: string;
  name: string;
  workingDirectory: string;
  tempDirectory: string;
  createdAt: Date;
  status: 'active' | 'inactive';
  isIsolated: boolean;
  processes: ProcessInfo[];
}

// サンドボックスコマンド実行結果
export interface SandboxCommandResult {
  success: boolean;
  command: string;
  stdout: string;
  stderr: string;
  exitCode: number;
  processId?: string;
  executionTime: number;
  timestamp: Date;
}

// コマンド実行オプション
export interface SandboxCommandOptions {
  workingDirectory?: string;
  timeout?: number;
  env?: Record<string, string>;
  isolationType?: 'none' | 'partial' | 'full';
}

/**
 * Windowsサンドボックス環境クラス
 */
export class WindowsSandbox {
  private static instance: WindowsSandbox;
  private sessions: Map<string, WindowsSandboxSession>;
  private readonly baseSandboxDir: string;
  
  private constructor() {
    this.sessions = new Map<string, WindowsSandboxSession>();
    this.baseSandboxDir = 'C:/Windows-Manus-Sandbox';
  }
  
  /**
   * シングルトンインスタンスを取得
   */
  public static getInstance(): WindowsSandbox {
    if (!WindowsSandbox.instance) {
      WindowsSandbox.instance = new WindowsSandbox();
    }
    return WindowsSandbox.instance;
  }
  
  /**
   * サンドボックスセッションを作成
   */
  public async createSession(name: string = 'New Session', isIsolated: boolean = true): Promise<WindowsSandboxSession> {
    const sessionId = uuidv4();
    const now = new Date();
    
    // セッション用のディレクトリパスを生成
    const sessionDirName = `session-${sessionId.substring(0, 8)}-${Math.floor(now.getTime() / 1000)}`;
    const workingDirectory = `${this.baseSandboxDir}/${sessionDirName}`;
    const tempDirectory = `${workingDirectory}/temp`;
    
    try {
      // データベースにセッションを記録
      const dbSession = await prisma.sandboxSession.create({
        data: {
          id: sessionId,
          name,
          commands: JSON.stringify([]),
          outputs: JSON.stringify([]),
          metadata: JSON.stringify({
            workingDirectory,
            tempDirectory,
            isIsolated
          })
        }
      });
      
      // ディレクトリを作成
      await windowsFileSystem.createDirectory(workingDirectory, { recursive: true });
      await windowsFileSystem.createDirectory(tempDirectory, { recursive: true });
      
      // セッション情報を構築
      const session: WindowsSandboxSession = {
        id: sessionId,
        name: dbSession.name || name,
        workingDirectory,
        tempDirectory,
        createdAt: dbSession.createdAt,
        status: 'active',
        isIsolated,
        processes: []
      };
      
      // メモリにセッションを保存
      this.sessions.set(sessionId, session);
      
      return session;
    } catch (error) {
      console.error('サンドボックスセッション作成エラー:', error);
      throw new Error('サンドボックスセッションの作成に失敗しました');
    }
  }
  
  /**
   * セッションを取得
   */
  public async getSession(sessionId: string): Promise<WindowsSandboxSession | null> {
    // メモリにある場合はそれを返す
    const cachedSession = this.sessions.get(sessionId);
    if (cachedSession) {
      return this.refreshSessionProcesses(cachedSession);
    }
    
    // データベースから取得
    try {
      const dbSession = await prisma.sandboxSession.findUnique({
        where: { id: sessionId }
      });
      
      if (!dbSession) {
        return null;
      }
      
      let metadata: any = {};
      try {
        metadata = dbSession.metadata ? JSON.parse(dbSession.metadata) : {};
      } catch (e) {
        console.warn('セッションメタデータの解析エラー:', e);
      }
      
      // セッション情報を構築
      const session: WindowsSandboxSession = {
        id: dbSession.id,
        name: dbSession.name || 'Untitled Session',
        workingDirectory: metadata.workingDirectory || `${this.baseSandboxDir}/session-${dbSession.id.substring(0, 8)}`,
        tempDirectory: metadata.tempDirectory || `${this.baseSandboxDir}/session-${dbSession.id.substring(0, 8)}/temp`,
        createdAt: dbSession.createdAt,
        status: 'active',
        isIsolated: metadata.isIsolated !== undefined ? metadata.isIsolated : true,
        processes: []
      };
      
      // メモリにセッションを保存
      this.sessions.set(sessionId, session);
      
      return this.refreshSessionProcesses(session);
    } catch (error) {
      console.error(`セッション取得エラー (${sessionId}):`, error);
      return null;
    }
  }
  
  /**
   * セッションのプロセス情報を更新
   */
  private async refreshSessionProcesses(session: WindowsSandboxSession): Promise<WindowsSandboxSession> {
    // 全プロセスのステータスを更新
    const updatedProcesses: ProcessInfo[] = [];
    for (const process of session.processes) {
      const updatedProcess = await windowsProcess.getProcess(process.id);
      if (updatedProcess) {
        updatedProcesses.push(updatedProcess);
      }
    }
    
    return {
      ...session,
      processes: updatedProcesses
    };
  }
  
  /**
   * コマンドを実行
   */
  public async executeCommand(
    sessionId: string, 
    command: string, 
    options?: SandboxCommandOptions
  ): Promise<SandboxCommandResult> {
    // セッションを取得
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error(`セッション ${sessionId} が見つかりません`);
    }
    
    // 作業ディレクトリ
    const workingDir = options?.workingDirectory || session.workingDirectory;
    
    // コマンドとパラメータを分離
    const cmdParts = this.parseCommand(command);
    const cmd = cmdParts[0];
    const args = cmdParts.slice(1);
    
    // コマンドの開始時間
    const startTime = new Date();
    
    // 実行オプションを設定
    const processOptions: ProcessOptions = {
      workingDir,
      timeout: options?.timeout,
      env: {
        ...options?.env,
        TEMP: session.tempDirectory,
        TMP: session.tempDirectory,
      },
      shell: true,
      windowsHide: true
    };
    
    if (session.isIsolated && options?.isolationType !== 'none') {
      // 完全隔離モードの場合は追加設定
      if (options?.isolationType === 'full') {
        processOptions.detached = true;
      }
    }
    
    try {
      // プロセスを開始
      const processResult = await windowsProcess.startProcess(cmd, args, processOptions);
      
      if (!processResult.success || !processResult.processInfo) {
        return {
          success: false,
          command,
          stdout: '',
          stderr: processResult.message,
          exitCode: -1,
          executionTime: 0,
          timestamp: startTime
        };
      }
      
      // セッションのプロセスリストに追加
      session.processes.push(processResult.processInfo);
      this.sessions.set(sessionId, session);
      
      // プロセスIDを保存
      const processId = processResult.processInfo.id;
      
      // 非同期プロセスの場合は即座に結果を返す
      if (processOptions.detached) {
        return {
          success: true,
          command,
          stdout: 'Process started in background mode',
          stderr: '',
          exitCode: 0,
          processId,
          executionTime: 0,
          timestamp: startTime
        };
      }
      
      // プロセスが完了するまで待機
      let processInfo: ProcessInfo | null = processResult.processInfo;
      while (
        processInfo && 
        processInfo.status !== ProcessStatus.COMPLETED && 
        processInfo.status !== ProcessStatus.STOPPED && 
        processInfo.status !== ProcessStatus.FAILED && 
        processInfo.status !== ProcessStatus.TIMEOUT
      ) {
        await new Promise(resolve => setTimeout(resolve, 100));
        processInfo = await windowsProcess.getProcess(processId);
        if (!processInfo) break;
      }
      
      // 出力を取得
      const output = await windowsProcess.getProcessOutput(processId);
      
      // 終了時間を計算
      const endTime = new Date();
      const executionTime = endTime.getTime() - startTime.getTime();
      
      // コマンド実行履歴を更新
      await this.updateCommandHistory(sessionId, {
        command,
        stdout: output?.output || '',
        stderr: output?.error || '',
        exitCode: processInfo?.exitCode || 0,
        processId,
        executionTime,
        timestamp: startTime
      });
      
      // 結果を返す
      return {
        success: processInfo?.exitCode === 0,
        command,
        stdout: output?.output || '',
        stderr: output?.error || '',
        exitCode: processInfo?.exitCode || 0,
        processId,
        executionTime,
        timestamp: startTime
      };
    } catch (error) {
      console.error(`コマンド実行エラー (${command}):`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // コマンド実行履歴を更新
      await this.updateCommandHistory(sessionId, {
        command,
        stdout: '',
        stderr: errorMessage,
        exitCode: -1,
        executionTime: 0,
        timestamp: startTime
      });
      
      return {
        success: false,
        command,
        stdout: '',
        stderr: errorMessage,
        exitCode: -1,
        executionTime: 0,
        timestamp: startTime
      };
    }
  }
  
  /**
   * コマンド履歴を更新
   */
  private async updateCommandHistory(
    sessionId: string, 
    result: SandboxCommandResult
  ): Promise<void> {
    try {
      const dbSession = await prisma.sandboxSession.findUnique({
        where: { id: sessionId }
      });
      
      if (!dbSession) {
        return;
      }
      
      // 既存の履歴を取得
      let commands: any[] = [];
      let outputs: any[] = [];
      
      try {
        if (dbSession.commands) {
          commands = JSON.parse(dbSession.commands);
        }
        if (dbSession.outputs) {
          outputs = JSON.parse(dbSession.outputs);
        }
      } catch (e) {
        console.warn('コマンド履歴の解析エラー:', e);
      }
      
      // 新しいコマンドと結果を追加
      const commandInfo = {
        command: result.command,
        timestamp: result.timestamp.toISOString()
      };
      
      const outputInfo = {
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
        executionTime: result.executionTime,
        processId: result.processId
      };
      
      commands.push(commandInfo);
      outputs.push(outputInfo);
      
      // データベースを更新
      await prisma.sandboxSession.update({
        where: { id: sessionId },
        data: {
          commands: JSON.stringify(commands),
          outputs: JSON.stringify(outputs),
          updatedAt: new Date()
        }
      });
    } catch (error) {
      console.error(`コマンド履歴更新エラー (${sessionId}):`, error);
    }
  }
  
  /**
   * セッションを終了
   */
  public async terminateSession(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }
    
    // 実行中のプロセスを全て停止
    for (const process of session.processes) {
      if (
        process.status === ProcessStatus.RUNNING || 
        process.status === ProcessStatus.STARTING || 
        process.status === ProcessStatus.STOPPING
      ) {
        await windowsProcess.stopProcess(process.id, true);
      }
    }
    
    // セッションを削除
    this.sessions.delete(sessionId);
    
    // データベースも更新
    try {
      await prisma.sandboxSession.update({
        where: { id: sessionId },
        data: {
          metadata: JSON.stringify({
            ...JSON.parse(await this.getSessionMetadata(sessionId) || '{}'),
            status: 'inactive'
          })
        }
      });
      return true;
    } catch (error) {
      console.error(`セッション終了エラー (${sessionId}):`, error);
      return false;
    }
  }
  
  /**
   * コマンドを解析して配列に分割
   */
  private parseCommand(command: string): string[] {
    const parts: string[] = [];
    let current = '';
    let inQuotes = false;
    let escapeNext = false;
    
    for (let i = 0; i < command.length; i++) {
      const char = command[i];
      
      if (escapeNext) {
        current += char;
        escapeNext = false;
        continue;
      }
      
      if (char === '\\') {
        escapeNext = true;
        continue;
      }
      
      if (char === '"') {
        inQuotes = !inQuotes;
        continue;
      }
      
      if (char === ' ' && !inQuotes) {
        if (current) {
          parts.push(current);
          current = '';
        }
        continue;
      }
      
      current += char;
    }
    
    if (current) {
      parts.push(current);
    }
    
    return parts;
  }
  
  /**
   * セッションメタデータを取得
   */
  private async getSessionMetadata(sessionId: string): Promise<string | null> {
    try {
      const dbSession = await prisma.sandboxSession.findUnique({
        where: { id: sessionId },
        select: { metadata: true }
      });
      
      return dbSession?.metadata || null;
    } catch {
      return null;
    }
  }
  
  /**
   * サンドボックスクリーンアップ
   * 未使用のセッションや一時ファイルを削除するためのメンテナンス機能
   */
  public async cleanupSandbox(olderThanDays: number = 7): Promise<{
    deletedSessions: number;
    deletedFiles: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let deletedSessions = 0;
    let deletedFiles = 0;
    
    try {
      // 指定日数より古いセッションを取得
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      
      const oldSessions = await prisma.sandboxSession.findMany({
        where: {
          updatedAt: {
            lt: cutoffDate
          }
        }
      });
      
      // 古いセッションを処理
      for (const session of oldSessions) {
        try {
          // セッションディレクトリのパスを取得
          let sessionDir = '';
          try {
            if (session.metadata) {
              const metadata = JSON.parse(session.metadata);
              sessionDir = metadata.workingDirectory;
            }
          } catch (e) {
            errors.push(`セッション ${session.id} のメタデータ解析エラー`);
          }
          
          // セッションを終了
          if (this.sessions.has(session.id)) {
            await this.terminateSession(session.id);
          }
          
          // ディレクトリを削除
          if (sessionDir) {
            try {
              // ディレクトリ内のファイル数をカウント
              const listing = await windowsFileSystem.listDirectory(sessionDir);
              const fileCount = listing.files.length + listing.directories.length;
              
              // 削除を実行
              const deleteResult = await fetch('/api/windows/filesystem/deleteDir', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  path: sessionDir,
                  recursive: true
                })
              });
              
              if (deleteResult.ok) {
                deletedFiles += fileCount;
              } else {
                errors.push(`セッション ${session.id} のディレクトリ削除エラー: ${await deleteResult.text()}`);
              }
            } catch (e) {
              errors.push(`セッション ${session.id} のディレクトリ削除エラー: ${e instanceof Error ? e.message : String(e)}`);
            }
          }
          
          // データベースからセッションを削除
          await prisma.sandboxSession.delete({
            where: { id: session.id }
          });
          
          deletedSessions++;
        } catch (e) {
          errors.push(`セッション ${session.id} の削除エラー: ${e instanceof Error ? e.message : String(e)}`);
        }
      }
      
      return {
        deletedSessions,
        deletedFiles,
        errors
      };
    } catch (error) {
      errors.push(`クリーンアップ実行エラー: ${error instanceof Error ? error.message : String(error)}`);
      return {
        deletedSessions,
        deletedFiles,
        errors
      };
    }
  }
}

export default WindowsSandbox.getInstance();
