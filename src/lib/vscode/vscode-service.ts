import { v4 as uuidv4 } from 'uuid';
import {
  VSCodeCommand,
  VSCodeCommandOptions,
  VSCodeCommandResult,
  VSCodeConnectionOptions,
  VSCodeDebugOptions,
  VSCodeFile,
  VSCodeFileOptions,
  VSCodeLanguageOptions,
  VSCodeLog,
  VSCodeLogLevel,
  VSCodeSearchOptions,
  VSCodeWindowOptions,
  VSCodeWindowState,
} from './types';

/**
 * VSCodeサービスクラス
 * VSCodeとの通信を行うためのサービス層
 */
export class VSCodeService {
  private static instance: VSCodeService;
  private state: VSCodeWindowState;
  private eventListeners: Map<string, Function[]>;
  private connectionOptions: VSCodeConnectionOptions;
  private webSocketConnection: WebSocket | null = null;

  private constructor() {
    // 初期状態
    this.state = {
      isOpen: false,
      isConnected: false,
      isExecuting: false,
      logs: [],
    };
    
    this.eventListeners = new Map();
    this.connectionOptions = {
      host: 'localhost',
      port: 3333,
      timeout: 5000,
    };
  }

  /**
   * シングルトンインスタンスを取得
   */
  public static getInstance(): VSCodeService {
    if (!VSCodeService.instance) {
      VSCodeService.instance = new VSCodeService();
    }
    return VSCodeService.instance;
  }

  /**
   * 現在の状態を取得
   */
  public getState(): VSCodeWindowState {
    return { ...this.state };
  }

  /**
   * VSCodeに接続
   */
  public async connect(options?: VSCodeConnectionOptions): Promise<boolean> {
    if (this.state.isConnected) {
      this.addLog('すでに接続されています', VSCodeLogLevel.INFO);
      return true;
    }

    this.connectionOptions = {
      ...this.connectionOptions,
      ...options,
    };

    try {
      // 実際の実装では、WebSocketで接続する
      // モック用の接続成功処理
      this.state = {
        ...this.state,
        isConnected: true,
        isOpen: true,
      };

      this.addLog('VSCodeに接続しました', VSCodeLogLevel.INFO);
      this.emitEvent('stateChanged', this.state);
      
      // WebSocket接続の模擬実装
      this.simulateWebSocketConnection();
      
      return true;
    } catch (error) {
      this.addLog(`接続エラー: ${error}`, VSCodeLogLevel.ERROR);
      return false;
    }
  }

  /**
   * VSCodeから切断
   */
  public disconnect(): boolean {
    if (!this.state.isConnected) {
      this.addLog('接続されていません', VSCodeLogLevel.INFO);
      return true;
    }

    try {
      // WebSocketの切断
      if (this.webSocketConnection) {
        this.webSocketConnection.close();
        this.webSocketConnection = null;
      }

      this.state = {
        ...this.state,
        isConnected: false,
      };

      this.addLog('VSCodeから切断しました', VSCodeLogLevel.INFO);
      this.emitEvent('stateChanged', this.state);
      return true;
    } catch (error) {
      this.addLog(`切断エラー: ${error}`, VSCodeLogLevel.ERROR);
      return false;
    }
  }

  /**
   * VSCodeを開く
   */
  public async openVSCode(options?: VSCodeWindowOptions): Promise<boolean> {
    if (this.state.isOpen) {
      this.addLog('VSCodeはすでに開いています', VSCodeLogLevel.INFO);
      return true;
    }

    try {
      // 実際の実装では、IPC通信でVSCodeを起動する
      // モック用の起動成功処理
      this.state = {
        ...this.state,
        isOpen: true,
        path: options?.path,
      };

      this.addLog(`VSCodeを開きました${options?.path ? `: ${options.path}` : ''}`, VSCodeLogLevel.INFO);
      this.emitEvent('stateChanged', this.state);
      
      // 自動接続を試みる
      await this.connect();
      
      return true;
    } catch (error) {
      this.addLog(`VSCodeの起動エラー: ${error}`, VSCodeLogLevel.ERROR);
      return false;
    }
  }

  /**
   * VSCodeを閉じる
   */
  public closeVSCode(): boolean {
    if (!this.state.isOpen) {
      this.addLog('VSCodeは開いていません', VSCodeLogLevel.INFO);
      return true;
    }

    try {
      // 接続を切断
      this.disconnect();

      // 実際の実装では、IPC通信でVSCodeを終了する
      this.state = {
        ...this.state,
        isOpen: false,
        path: undefined,
        files: undefined,
        activeFile: undefined,
      };

      this.addLog('VSCodeを閉じました', VSCodeLogLevel.INFO);
      this.emitEvent('stateChanged', this.state);
      return true;
    } catch (error) {
      this.addLog(`VSCodeの終了エラー: ${error}`, VSCodeLogLevel.ERROR);
      return false;
    }
  }

  /**
   * VSCodeでコマンドを実行
   */
  public async executeCommand(command: VSCodeCommand | string, options?: VSCodeCommandOptions): Promise<VSCodeCommandResult> {
    if (!this.state.isConnected) {
      return {
        success: false,
        message: 'VSCodeに接続されていません',
        timestamp: new Date(),
      };
    }

    try {
      this.state = {
        ...this.state,
        isExecuting: true,
      };
      this.emitEvent('stateChanged', this.state);

      // 実際の実装では、WebSocketでコマンドを送信する
      this.addLog(`コマンド実行: ${command}`, VSCodeLogLevel.INFO);
      
      // コマンド実行の模擬実装
      const result = await this.simulateCommandExecution(command, options);
      
      this.state = {
        ...this.state,
        isExecuting: false,
      };
      this.emitEvent('stateChanged', this.state);
      
      return result;
    } catch (error) {
      this.state = {
        ...this.state,
        isExecuting: false,
      };
      this.emitEvent('stateChanged', this.state);
      
      this.addLog(`コマンド実行エラー: ${error}`, VSCodeLogLevel.ERROR);
      return {
        success: false,
        message: `コマンド実行エラー: ${error}`,
        timestamp: new Date(),
      };
    }
  }

  /**
   * ファイルを開く
   */
  public async openFile(filePath: string): Promise<VSCodeCommandResult> {
    return this.executeCommand(VSCodeCommand.OPEN_FILE, {
      args: [filePath],
    });
  }

  /**
   * フォルダを開く
   */
  public async openFolder(folderPath: string, options?: VSCodeWindowOptions): Promise<VSCodeCommandResult> {
    return this.executeCommand(VSCodeCommand.OPEN_FOLDER, {
      args: [folderPath, options],
    });
  }

  /**
   * ファイルを保存
   */
  public async saveFile(filePath?: string): Promise<VSCodeCommandResult> {
    return this.executeCommand(VSCodeCommand.SAVE_FILE, {
      args: filePath ? [filePath] : undefined,
    });
  }

  /**
   * 新規ファイル作成
   */
  public async newFile(options?: VSCodeFileOptions): Promise<VSCodeCommandResult> {
    return this.executeCommand(VSCodeCommand.NEW_FILE, {
      args: [options],
    });
  }

  /**
   * ファイル内容を更新
   */
  public async updateFileContent(filePath: string, content: string): Promise<VSCodeCommandResult> {
    // 実際の実装では、WebSocketで通信する
    if (!this.state.isConnected) {
      return {
        success: false,
        message: 'VSCodeに接続されていません',
        timestamp: new Date(),
      };
    }

    // ファイル更新の模擬実装
    const files = this.state.files || [];
    const fileIndex = files.findIndex(f => f.path === filePath);
    
    if (fileIndex === -1) {
      this.addLog(`ファイルが見つかりません: ${filePath}`, VSCodeLogLevel.ERROR);
      return {
        success: false,
        message: `ファイルが見つかりません: ${filePath}`,
        timestamp: new Date(),
      };
    }
    
    const updatedFiles = [...files];
    updatedFiles[fileIndex] = {
      ...updatedFiles[fileIndex],
      content,
      isModified: true,
    };
    
    this.state = {
      ...this.state,
      files: updatedFiles,
    };
    
    this.addLog(`ファイル内容を更新しました: ${filePath}`, VSCodeLogLevel.INFO);
    this.emitEvent('stateChanged', this.state);
    
    return {
      success: true,
      message: `ファイル内容を更新しました: ${filePath}`,
      timestamp: new Date(),
    };
  }

  /**
   * ファイル検索
   */
  public async searchInFiles(options: VSCodeSearchOptions): Promise<VSCodeCommandResult> {
    return this.executeCommand(VSCodeCommand.SEARCH, {
      args: [options],
    });
  }

  /**
   * コードを実行
   */
  public async runCode(options?: VSCodeDebugOptions): Promise<VSCodeCommandResult> {
    return this.executeCommand(VSCodeCommand.RUN_CODE, {
      args: [options],
    });
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
   * ログをクリア
   */
  public clearLogs(): void {
    this.state = {
      ...this.state,
      logs: [],
    };
    this.emitEvent('stateChanged', this.state);
  }

  /**
   * ログを追加
   */
  private addLog(message: string, level: VSCodeLogLevel, source?: string): void {
    const log: VSCodeLog = {
      id: uuidv4(),
      timestamp: new Date(),
      message,
      level,
      source,
    };
    
    this.state = {
      ...this.state,
      logs: [log, ...this.state.logs].slice(0, 100), // 最大100件まで保持
    };
    
    this.emitEvent('log', log);
    this.emitEvent('stateChanged', this.state);
  }

  /**
   * イベントを発火
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

  /**
   * WebSocket接続をシミュレート
   * 実際の実装では、実際のWebSocket接続を行う
   */
  private simulateWebSocketConnection(): void {
    // モックデータ
    const mockFiles: VSCodeFile[] = [
      {
        path: '/path/to/file1.js',
        name: 'file1.js',
        extension: 'js',
        content: 'console.log("Hello, World!");',
        isOpen: true,
        isActive: true,
        isModified: false,
      },
      {
        path: '/path/to/file2.js',
        name: 'file2.js',
        extension: 'js',
        content: 'const x = 42;\nconsole.log(x);',
        isOpen: true,
        isActive: false,
        isModified: false,
      },
    ];
    
    this.state = {
      ...this.state,
      files: mockFiles,
      activeFile: '/path/to/file1.js',
    };
    
    this.emitEvent('stateChanged', this.state);
  }

  /**
   * コマンド実行をシミュレート
   * 実際の実装では、実際のコマンド実行を行う
   */
  private async simulateCommandExecution(command: VSCodeCommand | string, options?: VSCodeCommandOptions): Promise<VSCodeCommandResult> {
    // コマンド実行を模擬的に遅延させる
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // コマンドに応じたモック処理
    switch (command) {
      case VSCodeCommand.OPEN_FILE:
        return {
          success: true,
          message: `ファイルを開きました: ${options?.args?.[0]}`,
          timestamp: new Date(),
        };
        
      case VSCodeCommand.OPEN_FOLDER:
        return {
          success: true,
          message: `フォルダを開きました: ${options?.args?.[0]}`,
          timestamp: new Date(),
        };
        
      case VSCodeCommand.SAVE_FILE:
        return {
          success: true,
          message: `ファイルを保存しました: ${options?.args?.[0] || '現在のファイル'}`,
          timestamp: new Date(),
        };
        
      default:
        return {
          success: true,
          message: `コマンドを実行しました: ${command}`,
          timestamp: new Date(),
        };
    }
  }
}
