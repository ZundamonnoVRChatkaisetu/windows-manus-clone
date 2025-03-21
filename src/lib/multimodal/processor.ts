/**
 * マルチモーダルプロセッサーの基本インターフェース
 * 異なる種類のマルチモーダル処理の共通インターフェースを定義
 */

import { 
  MultimodalData, 
  ProcessingOptions, 
  ProcessingResult, 
  ProcessingStatus,
  MultimodalEvent,
  MultimodalEventData
} from './types';

// マルチモーダルプロセッサーのイベントリスナー型
export type MultimodalProcessorEventListener = (event: MultimodalEventData) => void;

/**
 * マルチモーダルプロセッサーの抽象基底クラス
 * 全てのマルチモーダルプロセッサーはこのクラスを継承する
 */
export abstract class MultimodalProcessor<
  TInput extends MultimodalData,
  TOptions extends ProcessingOptions,
  TResult extends ProcessingResult
> {
  protected readonly id: string;
  protected status: ProcessingStatus;
  protected startTime?: Date;
  protected endTime?: Date;
  protected progress: number;
  protected error?: string;
  protected listeners: Map<MultimodalEvent, MultimodalProcessorEventListener[]>;

  constructor() {
    this.id = this.generateId();
    this.status = ProcessingStatus.PENDING;
    this.progress = 0;
    this.listeners = new Map();
  }

  /**
   * 処理IDを生成
   */
  protected generateId(): string {
    return `mmp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * データを処理する抽象メソッド
   * サブクラスで実装する必要がある
   */
  public abstract process(input: TInput, options?: TOptions): Promise<TResult>;

  /**
   * 処理をキャンセルする
   */
  public abstract cancel(): void;

  /**
   * イベントリスナーを登録
   */
  public on(event: MultimodalEvent, listener: MultimodalProcessorEventListener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(listener);
  }

  /**
   * イベントリスナーを削除
   */
  public off(event: MultimodalEvent, listener: MultimodalProcessorEventListener): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(listener);
      if (index !== -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  /**
   * イベントを発火
   */
  protected emit(event: MultimodalEvent, data?: any): void {
    const eventData: MultimodalEventData = {
      id: this.id,
      event,
      timestamp: new Date(),
      data
    };

    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => listener(eventData));
    }
  }

  /**
   * 進捗を更新
   */
  protected updateProgress(progress: number): void {
    this.progress = Math.max(0, Math.min(1, progress));
    this.emit(MultimodalEvent.PROGRESS, { progress: this.progress });
  }

  /**
   * 処理開始
   */
  protected startProcessing(): void {
    this.status = ProcessingStatus.PROCESSING;
    this.startTime = new Date();
    this.progress = 0;
    this.error = undefined;
  }

  /**
   * 処理完了
   */
  protected completeProcessing(): void {
    this.status = ProcessingStatus.COMPLETED;
    this.endTime = new Date();
    this.progress = 1;
    this.emit(MultimodalEvent.COMPLETED);
  }

  /**
   * 処理失敗
   */
  protected failProcessing(error: string): void {
    this.status = ProcessingStatus.FAILED;
    this.endTime = new Date();
    this.error = error;
    this.emit(MultimodalEvent.FAILED, { error });
  }

  /**
   * 現在の状態を取得
   */
  public getStatus(): {
    id: string;
    status: ProcessingStatus;
    progress: number;
    error?: string;
    startTime?: Date;
    endTime?: Date;
  } {
    return {
      id: this.id,
      status: this.status,
      progress: this.progress,
      error: this.error,
      startTime: this.startTime,
      endTime: this.endTime
    };
  }
}
