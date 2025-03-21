/**
 * Windows環境でのプロセス管理機能を提供するモジュール
 */
import { v4 as uuidv4 } from 'uuid';
import { executeWindowsCommand, getExecutablePath } from './utils';

/**
 * プロセス情報インターフェース
 */
export interface ProcessInfo {
  id: string;          // 内部プロセスID (UUID)
  pid?: number;        // WindowsプロセスのシステムプロセスID
  name: string;        // プロセス名
  command: string;     // 実行コマンド
  args: string[];      // コマンド引数
  workingDir?: string; // 作業ディレクトリ
  startTime: Date;     // 開始時間
  endTime?: Date;      // 終了時間
  status: ProcessStatus; // 状態
  exitCode?: number;   // 終了コード
  output: string;      // 標準出力
  error: string;       // 標準エラー出力
  memory?: number;     // メモリ使用量 (KB)
  cpu?: number;        // CPU使用率 (%)
  user?: string;       // 実行ユーザー
}

/**
 * プロセス実行オプション
 */
export interface ProcessOptions {
  workingDir?: string;       // 作業ディレクトリ
  env?: Record<string, string>; // 環境変数
  shell?: boolean;           // シェル経由で実行するか
  timeout?: number;          // タイムアウト (ミリ秒)
  detached?: boolean;        // デタッチドプロセスとして実行
  windowsHide?: boolean;     // Windowsでコンソールウィンドウを非表示
  priority?: ProcessPriority; // プロセスの優先度
}

/**
 * プロセスリスト取得オプション
 */
export interface ListProcessesOptions {
  filterByName?: string;    // 名前でフィルタ
  filterByUser?: string;    // ユーザーでフィルタ
  minMemory?: number;       // 最小メモリ使用量 (KB)
  minCpu?: number;          // 最小CPU使用率 (%)
  sortBy?: 'name' | 'pid' | 'cpu' | 'memory' | 'startTime'; // ソート基準
  sortOrder?: 'asc' | 'desc'; // ソート順
}

/**
 * プロセスの状態
 */
export enum ProcessStatus {
  STARTING = 'starting',
  RUNNING = 'running',
  STOPPING = 'stopping',
  STOPPED = 'stopped',
  COMPLETED = 'completed',
  FAILED = 'failed',
  TIMEOUT = 'timeout',
  UNKNOWN = 'unknown'
}

/**
 * プロセスの優先度
 */
export enum ProcessPriority {
  IDLE = 'idle',
  BELOW_NORMAL = 'below_normal',
  NORMAL = 'normal',
  ABOVE_NORMAL = 'above_normal',
  HIGH = 'high',
  REALTIME = 'realtime'
}

/**
 * プロセス操作の結果
 */
export interface ProcessResult {
  success: boolean;
  message: string;
  processInfo?: ProcessInfo;
  error?: any;
}

/**
 * Windows環境のプロセス管理クラス
 */
export class WindowsProcessManager {
  private static instance: WindowsProcessManager;
  private processes: Map<string, ProcessInfo>;
  private eventListeners: Map<string, Function[]>;
  
  private constructor() {
    this.processes = new Map<string, ProcessInfo>();
    this.eventListeners = new Map<string, Function[]>();
  }

  /**
   * シングルトンインスタンスを取得
   */
  public static getInstance(): WindowsProcessManager {
    if (!WindowsProcessManager.instance) {
      WindowsProcessManager.instance = new WindowsProcessManager();
    }
    return WindowsProcessManager.instance;
  }

  /**
   * プロセスを開始
   */
  public async startProcess(
    command: string, 
    args: string[] = [], 
    options?: ProcessOptions
  ): Promise<ProcessResult> {
    try {
      const processId = uuidv4();
      const now = new Date();
      
      // Windows実行ファイルが拡張子なしの場合は.exeを付与
      const executablePath = getExecutablePath(command);
      
      // プロセス情報を作成
      const processInfo: ProcessInfo = {
        id: processId,
        name: command.split(/[\\/]/).pop() || command,
        command: executablePath,
        args,
        workingDir: options?.workingDir,
        startTime: now,
        status: ProcessStatus.STARTING,
        output: '',
        error: ''
      };
      
      // プロセス情報を保存
      this.processes.set(processId, processInfo);
      
      // プロセス開始イベントを発火
      this.emitEvent('process.starting', processInfo);
      
      // コマンドラインを構築（クォート処理など）
      const quotedArgs = args.map(arg => {
        if (arg.includes(' ') && !arg.startsWith('"') && !arg.endsWith('"')) {
          return `"${arg}"`;
        }
        return arg;
      });
      
      const fullCommand = `${executablePath} ${quotedArgs.join(' ')}`;
      
      // オプション文字列を構築
      let optionsStr = '';
      if (options?.priority) {
        switch (options.priority) {
          case ProcessPriority.IDLE:
            optionsStr += ' /LOW';
            break;
          case ProcessPriority.BELOW_NORMAL:
            optionsStr += ' /BELOWNORMAL';
            break;
          case ProcessPriority.ABOVE_NORMAL:
            optionsStr += ' /ABOVENORMAL';
            break;
          case ProcessPriority.HIGH:
            optionsStr += ' /HIGH';
            break;
          case ProcessPriority.REALTIME:
            optionsStr += ' /REALTIME';
            break;
          // NORMAL は指定不要
        }
      }
      
      if (options?.detached) {
        optionsStr += ' /B';
      }
      
      if (options?.windowsHide) {
        optionsStr += ' /MIN';
      }
      
      // 実際の実行は、サーバーサイドのAPIを呼び出して行う
      const result = await fetch('/api/windows/process/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          command: fullCommand,
          workingDir: options?.workingDir,
          env: options?.env,
          shell: options?.shell,
          timeout: options?.timeout,
          options: optionsStr.trim()
        })
      });
      
      if (!result.ok) {
        const error = await result.text();
        // プロセス開始失敗を記録
        const updatedInfo = {
          ...processInfo,
          status: ProcessStatus.FAILED,
          error: error,
          endTime: new Date()
        };
        this.processes.set(processId, updatedInfo);
        this.emitEvent('process.failed', updatedInfo);
        
        return {
          success: false,
          message: `プロセスの開始に失敗しました: ${error}`,
          processInfo: updatedInfo,
          error
        };
      }
      
      const data = await result.json();
      
      // プロセス情報を更新
      const updatedInfo: ProcessInfo = {
        ...processInfo,
        pid: data.pid,
        status: ProcessStatus.RUNNING,
        output: data.stdout || '',
        error: data.stderr || '',
      };
      
      this.processes.set(processId, updatedInfo);
      this.emitEvent('process.started', updatedInfo);
      
      // タイムアウト処理
      if (options?.timeout) {
        setTimeout(() => {
          this.checkProcessStatus(processId);
        }, options.timeout);
      }
      
      return {
        success: true,
        message: `プロセスを開始しました (PID: ${data.pid})`,
        processInfo: updatedInfo
      };
    } catch (error) {
      return {
        success: false,
        message: 'プロセスの開始中にエラーが発生しました',
        error
      };
    }
  }

  /**
   * プロセスを停止
   */
  public async stopProcess(processId: string, force: boolean = false): Promise<ProcessResult> {
    const processInfo = this.processes.get(processId);
    if (!processInfo) {
      return {
        success: false,
        message: 'プロセスが見つかりません'
      };
    }
    
    if (!processInfo.pid) {
      return {
        success: false,
        message: 'プロセスのPIDが不明です'
      };
    }
    
    // 既に終了している場合
    if (
      processInfo.status === ProcessStatus.STOPPED ||
      processInfo.status === ProcessStatus.COMPLETED ||
      processInfo.status === ProcessStatus.FAILED ||
      processInfo.status === ProcessStatus.TIMEOUT
    ) {
      return {
        success: true,
        message: '既に終了しているプロセスです',
        processInfo
      };
    }
    
    try {
      // ステータスを更新
      const updatingInfo = {
        ...processInfo,
        status: ProcessStatus.STOPPING
      };
      this.processes.set(processId, updatingInfo);
      this.emitEvent('process.stopping', updatingInfo);
      
      // APIを呼び出してプロセスを停止
      const result = await fetch('/api/windows/process/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pid: processInfo.pid,
          force
        })
      });
      
      if (!result.ok) {
        const error = await result.text();
        return {
          success: false,
          message: `プロセスの停止に失敗しました: ${error}`,
          error
        };
      }
      
      const data = await result.json();
      
      // プロセス情報を更新
      const updatedInfo: ProcessInfo = {
        ...processInfo,
        status: ProcessStatus.STOPPED,
        endTime: new Date(),
        exitCode: data.exitCode
      };
      
      this.processes.set(processId, updatedInfo);
      this.emitEvent('process.stopped', updatedInfo);
      
      return {
        success: true,
        message: `プロセスを停止しました (PID: ${processInfo.pid})`,
        processInfo: updatedInfo
      };
    } catch (error) {
      return {
        success: false,
        message: 'プロセスの停止中にエラーが発生しました',
        error
      };
    }
  }

  /**
   * プロセスのステータスを取得
   */
  private async checkProcessStatus(processId: string): Promise<ProcessInfo | null> {
    const processInfo = this.processes.get(processId);
    if (!processInfo || !processInfo.pid) {
      return null;
    }
    
    try {
      const result = await fetch(`/api/windows/process/status?pid=${processInfo.pid}`);
      
      if (!result.ok) {
        return null;
      }
      
      const data = await result.json();
      
      // プロセスの状態を更新
      let status = processInfo.status;
      if (!data.running) {
        status = ProcessStatus.STOPPED;
        
        const updatedInfo: ProcessInfo = {
          ...processInfo,
          status,
          endTime: new Date(),
          exitCode: data.exitCode,
          memory: data.memory,
          cpu: data.cpu
        };
        
        this.processes.set(processId, updatedInfo);
        this.emitEvent('process.stopped', updatedInfo);
        
        return updatedInfo;
      } else {
        // プロセスが実行中の場合、リソース使用状況を更新
        const updatedInfo: ProcessInfo = {
          ...processInfo,
          memory: data.memory,
          cpu: data.cpu
        };
        
        this.processes.set(processId, updatedInfo);
        return updatedInfo;
      }
    } catch (error) {
      console.error(`プロセスのステータス確認エラー (PID: ${processInfo.pid}):`, error);
      return null;
    }
  }

  /**
   * プロセス情報を取得
   */
  public async getProcess(processId: string): Promise<ProcessInfo | null> {
    const processInfo = this.processes.get(processId);
    if (!processInfo) {
      return null;
    }
    
    // プロセスが実行中の場合は最新のステータスを取得
    if (
      processInfo.status === ProcessStatus.RUNNING || 
      processInfo.status === ProcessStatus.STARTING
    ) {
      return await this.checkProcessStatus(processId) || processInfo;
    }
    
    return processInfo;
  }

  /**
   * プロセス一覧を取得
   */
  public async listProcesses(options?: ListProcessesOptions): Promise<ProcessInfo[]> {
    // 内部プロセスリストを取得
    let processes = Array.from(this.processes.values());
    
    // 実行中のプロセスのステータスを更新
    for (const process of processes) {
      if (
        process.status === ProcessStatus.RUNNING || 
        process.status === ProcessStatus.STARTING
      ) {
        await this.checkProcessStatus(process.id);
      }
    }
    
    // 更新後のプロセスリストを再取得
    processes = Array.from(this.processes.values());
    
    // フィルタリング
    if (options?.filterByName) {
      const regex = new RegExp(options.filterByName, 'i');
      processes = processes.filter(p => regex.test(p.name));
    }
    
    if (options?.filterByUser) {
      processes = processes.filter(p => p.user === options.filterByUser);
    }
    
    if (options?.minMemory !== undefined) {
      processes = processes.filter(p => 
        p.memory !== undefined && p.memory >= options.minMemory!
      );
    }
    
    if (options?.minCpu !== undefined) {
      processes = processes.filter(p => 
        p.cpu !== undefined && p.cpu >= options.minCpu!
      );
    }
    
    // ソート
    if (options?.sortBy) {
      processes.sort((a, b) => {
        const aVal = a[options.sortBy!];
        const bVal = b[options.sortBy!];
        
        // nullまたはundefinedの場合の処理
        if (aVal === undefined && bVal === undefined) return 0;
        if (aVal === undefined) return options.sortOrder === 'asc' ? 1 : -1;
        if (bVal === undefined) return options.sortOrder === 'asc' ? -1 : 1;
        
        // 実際の比較
        if (aVal < bVal) return options.sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return options.sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return processes;
  }

  /**
   * システム上のすべてのプロセスを取得
   */
  public async listSystemProcesses(): Promise<Array<{pid: number, name: string, memory: number, cpu: number}>> {
    try {
      const response = await fetch('/api/windows/process/list');
      
      if (!response.ok) {
        return [];
      }
      
      return await response.json();
    } catch (error) {
      console.error('システムプロセス一覧取得エラー:', error);
      return [];
    }
  }

  /**
   * プロセスにシグナルを送信
   */
  public async sendSignal(processId: string, signal: string): Promise<ProcessResult> {
    const processInfo = this.processes.get(processId);
    if (!processInfo || !processInfo.pid) {
      return {
        success: false,
        message: 'プロセスが見つかりません'
      };
    }
    
    try {
      const result = await fetch('/api/windows/process/signal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pid: processInfo.pid,
          signal
        })
      });
      
      if (!result.ok) {
        const error = await result.text();
        return {
          success: false,
          message: `シグナル送信に失敗しました: ${error}`,
          error
        };
      }
      
      return {
        success: true,
        message: `シグナル ${signal} を送信しました (PID: ${processInfo.pid})`,
        processInfo
      };
    } catch (error) {
      return {
        success: false,
        message: 'シグナル送信中にエラーが発生しました',
        error
      };
    }
  }

  /**
   * プロセスの出力を取得
   */
  public async getProcessOutput(processId: string): Promise<{output: string, error: string} | null> {
    const processInfo = this.processes.get(processId);
    if (!processInfo) {
      return null;
    }
    
    // 終了したプロセスの場合、保存された出力を返す
    if (
      processInfo.status === ProcessStatus.STOPPED ||
      processInfo.status === ProcessStatus.COMPLETED ||
      processInfo.status === ProcessStatus.FAILED ||
      processInfo.status === ProcessStatus.TIMEOUT
    ) {
      return {
        output: processInfo.output,
        error: processInfo.error
      };
    }
    
    // 実行中のプロセスの場合、APIから最新の出力を取得
    if (processInfo.pid) {
      try {
        const result = await fetch(`/api/windows/process/output?pid=${processInfo.pid}`);
        
        if (!result.ok) {
          return {
            output: processInfo.output,
            error: processInfo.error
          };
        }
        
        const data = await result.json();
        
        // 出力を更新
        const updatedInfo: ProcessInfo = {
          ...processInfo,
          output: data.stdout || processInfo.output,
          error: data.stderr || processInfo.error
        };
        
        this.processes.set(processId, updatedInfo);
        
        return {
          output: updatedInfo.output,
          error: updatedInfo.error
        };
      } catch (error) {
        console.error(`プロセス出力取得エラー (PID: ${processInfo.pid}):`, error);
      }
    }
    
    return {
      output: processInfo.output,
      error: processInfo.error
    };
  }

  /**
   * プロセスの優先度を変更
   */
  public async setProcessPriority(processId: string, priority: ProcessPriority): Promise<ProcessResult> {
    const processInfo = this.processes.get(processId);
    if (!processInfo || !processInfo.pid) {
      return {
        success: false,
        message: 'プロセスが見つかりません'
      };
    }
    
    try {
      const result = await fetch('/api/windows/process/priority', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pid: processInfo.pid,
          priority
        })
      });
      
      if (!result.ok) {
        const error = await result.text();
        return {
          success: false,
          message: `優先度変更に失敗しました: ${error}`,
          error
        };
      }
      
      return {
        success: true,
        message: `プロセスの優先度を ${priority} に変更しました (PID: ${processInfo.pid})`,
        processInfo
      };
    } catch (error) {
      return {
        success: false,
        message: '優先度変更中にエラーが発生しました',
        error
      };
    }
  }

  /**
   * イベントリスナーを追加
   */
  public on(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.push(callback);
    this.eventListeners.set(event, listeners);
  }

  /**
   * イベントリスナーを削除
   */
  public off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event) || [];
    const filteredListeners = listeners.filter(listener => listener !== callback);
    this.eventListeners.set(event, filteredListeners);
  }

  /**
   * イベント発火
   */
  private emitEvent(event: string, data: any): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error(`イベントリスナーエラー (${event}):`, error);
      }
    });
  }
}

export default WindowsProcessManager.getInstance();
