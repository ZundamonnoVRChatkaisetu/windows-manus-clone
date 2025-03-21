/**
 * マルチモーダルサービス
 * 様々なマルチモーダルプロセッサーを統合し、
 * クライアントコードに統一されたインターフェースを提供するサービスクラス
 */

import { 
  MultimodalData, 
  ProcessingOptions, 
  ProcessingResult,
  MultimodalType,
  MultimodalEvent,
  ImageData,
  AudioData,
  DocumentData,
  ImageProcessingOptions,
  AudioProcessingOptions,
  DocumentProcessingOptions,
  ImageProcessingResult,
  AudioProcessingResult,
  DocumentProcessingResult
} from './types';
import { MultimodalProcessor, MultimodalProcessorEventListener } from './processor';
import { ImageProcessor } from './image-processor';
import { AudioProcessor } from './audio-processor';
import { DocumentProcessor } from './document-processor';

/**
 * マルチモーダルサービスクラス
 * 各種マルチモーダル処理の管理と実行を行う
 */
export class MultimodalService {
  private imageProcessor: ImageProcessor;
  private audioProcessor: AudioProcessor;
  private documentProcessor: DocumentProcessor;
  private activeProcessors: Map<string, MultimodalProcessor<any, any, any>>;
  
  constructor() {
    this.imageProcessor = new ImageProcessor();
    this.audioProcessor = new AudioProcessor();
    this.documentProcessor = new DocumentProcessor();
    this.activeProcessors = new Map();
  }
  
  /**
   * マルチモーダルデータを処理する
   * データの種類に応じて適切なプロセッサーを使用
   */
  public async processData<T extends MultimodalData, O extends ProcessingOptions, R extends ProcessingResult>(
    data: T,
    options?: O,
    onProgress?: (progress: number) => void,
    onComplete?: (result: R) => void,
    onError?: (error: string) => void
  ): Promise<string> {
    let processor: MultimodalProcessor<any, any, any>;
    
    // データ型に基づいて適切なプロセッサーを選択
    switch (data.type) {
      case MultimodalType.IMAGE:
        processor = this.imageProcessor;
        break;
      case MultimodalType.AUDIO:
        processor = this.audioProcessor;
        break;
      case MultimodalType.DOCUMENT:
        processor = this.documentProcessor;
        break;
      default:
        throw new Error(`Unsupported multimodal type: ${data.type}`);
    }
    
    // イベントリスナーの設定
    if (onProgress) {
      const progressListener: MultimodalProcessorEventListener = (event) => {
        if (event.event === MultimodalEvent.PROGRESS && event.data?.progress !== undefined) {
          onProgress(event.data.progress);
        }
      };
      processor.on(MultimodalEvent.PROGRESS, progressListener);
    }
    
    if (onComplete) {
      const completeListener: MultimodalProcessorEventListener = async (event) => {
        if (event.event === MultimodalEvent.COMPLETED) {
          const result = await this.getProcessingResult(event.id);
          if (result) {
            onComplete(result as R);
          }
          this.activeProcessors.delete(event.id);
        }
      };
      processor.on(MultimodalEvent.COMPLETED, completeListener);
    }
    
    if (onError) {
      const errorListener: MultimodalProcessorEventListener = (event) => {
        if (event.event === MultimodalEvent.FAILED && event.data?.error) {
          onError(event.data.error);
          this.activeProcessors.delete(event.id);
        }
      };
      processor.on(MultimodalEvent.FAILED, errorListener);
    }
    
    // 処理の実行
    try {
      // プロセッサーをアクティブなプロセッサーリストに追加
      const processorId = processor.getStatus().id;
      this.activeProcessors.set(processorId, processor);
      
      // 処理を開始
      const result = await processor.process(data, options);
      return processorId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (onError) {
        onError(errorMessage);
      }
      throw error;
    }
  }
  
  /**
   * 画像処理を実行する
   */
  public async processImage(
    imageData: ImageData,
    options?: ImageProcessingOptions,
    onProgress?: (progress: number) => void,
    onComplete?: (result: ImageProcessingResult) => void,
    onError?: (error: string) => void
  ): Promise<string> {
    return this.processData<ImageData, ImageProcessingOptions, ImageProcessingResult>(
      imageData,
      options,
      onProgress,
      onComplete,
      onError
    );
  }
  
  /**
   * 音声処理を実行する
   */
  public async processAudio(
    audioData: AudioData,
    options?: AudioProcessingOptions,
    onProgress?: (progress: number) => void,
    onComplete?: (result: AudioProcessingResult) => void,
    onError?: (error: string) => void
  ): Promise<string> {
    return this.processData<AudioData, AudioProcessingOptions, AudioProcessingResult>(
      audioData,
      options,
      onProgress,
      onComplete,
      onError
    );
  }
  
  /**
   * ドキュメント処理を実行する
   */
  public async processDocument(
    documentData: DocumentData,
    options?: DocumentProcessingOptions,
    onProgress?: (progress: number) => void,
    onComplete?: (result: DocumentProcessingResult) => void,
    onError?: (error: string) => void
  ): Promise<string> {
    return this.processData<DocumentData, DocumentProcessingOptions, DocumentProcessingResult>(
      documentData,
      options,
      onProgress,
      onComplete,
      onError
    );
  }
  
  /**
   * 指定したIDの処理をキャンセルする
   */
  public cancelProcessing(id: string): boolean {
    const processor = this.activeProcessors.get(id);
    if (processor) {
      processor.cancel();
      this.activeProcessors.delete(id);
      return true;
    }
    return false;
  }
  
  /**
   * 全ての処理をキャンセルする
   */
  public cancelAllProcessing(): void {
    for (const [id, processor] of this.activeProcessors.entries()) {
      processor.cancel();
      this.activeProcessors.delete(id);
    }
  }
  
  /**
   * 処理結果を取得する
   */
  public async getProcessingResult(id: string): Promise<ProcessingResult | null> {
    const processor = this.activeProcessors.get(id);
    if (processor) {
      // 実際には各プロセッサーから結果を取得するロジックが必要
      // ここではシンプルに実装
      return null;
    }
    
    // プロセッサーが見つからない場合はnullを返す
    return null;
  }
  
  /**
   * 処理の状態を取得する
   */
  public getProcessingStatus(id: string): any {
    const processor = this.activeProcessors.get(id);
    if (processor) {
      return processor.getStatus();
    }
    return null;
  }
  
  /**
   * 全ての処理状態を取得する
   */
  public getAllProcessingStatus(): any[] {
    const statuses: any[] = [];
    for (const [_, processor] of this.activeProcessors.entries()) {
      statuses.push(processor.getStatus());
    }
    return statuses;
  }
}

// シングルトンインスタンスをエクスポート
export const multimodalService = new MultimodalService();
