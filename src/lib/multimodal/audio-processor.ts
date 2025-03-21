/**
 * 音声処理サービス
 * 音声の解析、変換、文字起こしなどの機能を提供
 */

import { 
  AudioData, 
  AudioProcessingOptions, 
  AudioProcessingResult,
  MultimodalType,
  ProcessingStatus 
} from './types';
import { MultimodalProcessor } from './processor';

/**
 * 音声プロセッサークラス
 * 音声データの処理を行うためのクラス
 */
export class AudioProcessor extends MultimodalProcessor<AudioData, AudioProcessingOptions, AudioProcessingResult> {
  private abortController: AbortController | null = null;
  private audioContext: AudioContext | null = null;
  
  constructor() {
    super();
  }
  
  /**
   * 音声を処理する
   * @param input 入力音声データ
   * @param options 処理オプション
   * @returns 処理結果
   */
  public async process(input: AudioData, options?: AudioProcessingOptions): Promise<AudioProcessingResult> {
    try {
      this.startProcessing();
      this.abortController = new AbortController();
      
      // 結果の初期化
      const result: AudioProcessingResult = {
        id: this.id,
        status: ProcessingStatus.PROCESSING,
        createdAt: new Date(),
        progress: 0,
        inputData: input,
      };
      
      // 音声データの読み込み
      const audioData = await this.loadAudio(input);
      this.updateProgress(0.2);
      
      // 音声処理タスク
      const tasks: Promise<void>[] = [];
      
      // 文字起こし処理
      if (options?.transcriptionLanguage || input.transcript === undefined) {
        tasks.push(this.transcribeAudio(audioData, result, options));
      }
      
      // 無音削除処理
      if (options?.removeSilence) {
        tasks.push(this.removeSilence(audioData, result, options));
      }
      
      // ノイズ削除処理
      if (options?.reduceNoise) {
        tasks.push(this.reduceNoise(audioData, result, options));
      }
      
      // 速度/音量調整処理
      if (options?.speedFactor !== undefined || options?.volumeFactor !== undefined) {
        tasks.push(this.adjustAudio(audioData, result, options));
      }
      
      // 全てのタスクを実行
      await Promise.all(tasks);
      
      // 処理完了
      result.status = ProcessingStatus.COMPLETED;
      result.completedAt = new Date();
      result.duration = result.completedAt.getTime() - result.createdAt.getTime();
      result.progress = 1;
      
      this.completeProcessing();
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.failProcessing(errorMessage);
      
      return {
        id: this.id,
        status: ProcessingStatus.FAILED,
        createdAt: new Date(),
        completedAt: new Date(),
        error: errorMessage,
        progress: 0,
        inputData: input,
      };
    } finally {
      // AudioContextを閉じる
      if (this.audioContext) {
        this.audioContext.close();
        this.audioContext = null;
      }
    }
  }
  
  /**
   * 処理をキャンセルする
   */
  public cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
  
  /**
   * 音声データを読み込む
   */
  private async loadAudio(input: AudioData): Promise<AudioBuffer> {
    // AudioContextの初期化
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // 音声データのURLまたはbase64からArrayBufferを取得
    let audioArrayBuffer: ArrayBuffer;
    
    if (input.base64) {
      // Base64データをArrayBufferに変換
      const base64Data = input.base64.split(',')[1]; // 'data:audio/mp3;base64,' のようなプレフィックスを削除
      const binaryString = atob(base64Data);
      audioArrayBuffer = new ArrayBuffer(binaryString.length);
      const uint8Array = new Uint8Array(audioArrayBuffer);
      
      for (let i = 0; i < binaryString.length; i++) {
        uint8Array[i] = binaryString.charCodeAt(i);
      }
    } else if (input.url) {
      // URLからデータを取得
      const response = await fetch(input.url, { signal: this.abortController?.signal });
      audioArrayBuffer = await response.arrayBuffer();
    } else {
      throw new Error('No audio data available');
    }
    
    // ArrayBufferをAudioBufferにデコード
    return await this.audioContext.decodeAudioData(audioArrayBuffer);
  }
  
  /**
   * 音声の文字起こし処理
   */
  private async transcribeAudio(audioBuffer: AudioBuffer, result: AudioProcessingResult, options?: AudioProcessingOptions): Promise<void> {
    this.updateProgress(0.3);
    
    // モック実装（実際のプロジェクトでは、Ollamaモデルまたは外部APIを使用して実装）
    // 例えば、Web Speech APIやOllamaのモデルを使用した実装が考えられる
    
    // 文字起こし結果のモック
    result.transcript = "これはサンプルの文字起こしテキストです。実際のプロジェクトでは、適切なモデルまたはAPIを使用して実装する必要があります。";
    
    // セグメント情報のモック
    result.segments = [
      {
        start: 0,
        end: 2.5,
        text: "これはサンプルの",
        confidence: 0.95
      },
      {
        start: 2.5,
        end: 5.0,
        text: "文字起こしテキストです。",
        confidence: 0.92
      },
      {
        start: 5.0,
        end: 10.0,
        text: "実際のプロジェクトでは、適切なモデルまたはAPIを使用して実装する必要があります。",
        confidence: 0.88
      }
    ];
    
    // 言語検出モック
    result.languageDetection = {
      language: options?.transcriptionLanguage || 'ja-JP',
      confidence: 0.97
    };
    
    this.updateProgress(0.5);
  }
  
  /**
   * 無音部分の削除処理
   */
  private async removeSilence(audioBuffer: AudioBuffer, result: AudioProcessingResult, options?: AudioProcessingOptions): Promise<void> {
    this.updateProgress(0.6);
    
    // 実際のプロジェクトでは、無音検出とトリミングのロジックを実装
    // 以下はシンプルな例
    
    // AudioBufferからPCMデータを取得
    const channelData = audioBuffer.getChannelData(0); // モノラルと仮定
    const threshold = 0.01; // 無音と判断する閾値
    const frameSamples = 1024; // 分析フレームサイズ
    
    // 無音でないフレームを検出
    const nonSilentFrames: number[] = [];
    
    for (let i = 0; i < channelData.length; i += frameSamples) {
      let frameEnergy = 0;
      
      // フレームのエネルギーを計算
      for (let j = 0; j < frameSamples && i + j < channelData.length; j++) {
        frameEnergy += Math.abs(channelData[i + j]);
      }
      
      frameEnergy /= frameSamples;
      
      // 閾値より大きいフレームは無音ではない
      if (frameEnergy > threshold) {
        nonSilentFrames.push(i);
      }
    }
    
    // モック: 処理済み音声データの作成
    // 実際のプロジェクトでは、無音部分を削除した新しいAudioBufferを作成し、
    // それをエンコードしてbase64またはBlobに変換
    
    result.processedAudio = {
      ...input,
      id: `${this.id}-nosilence`,
      type: MultimodalType.AUDIO,
      createdAt: new Date(),
      // base64: '...' // 実際のbase64エンコードデータ
    };
    
    this.updateProgress(0.7);
  }
  
  /**
   * ノイズ削減処理
   */
  private async reduceNoise(audioBuffer: AudioBuffer, result: AudioProcessingResult, options?: AudioProcessingOptions): Promise<void> {
    this.updateProgress(0.8);
    
    // 実際のプロジェクトでは、デジタルフィルタリングやスペクトラルサブトラクションなどのノイズ削減技術を実装
    // Web Audio APIのフィルターノードを使用した簡単な例
    
    if (!this.audioContext) {
      throw new Error('AudioContext is not initialized');
    }
    
    // ソースノードの作成
    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    
    // ローパスフィルターの作成（高周波ノイズの削減）
    const lowPassFilter = this.audioContext.createBiquadFilter();
    lowPassFilter.type = 'lowpass';
    lowPassFilter.frequency.value = 1000; // カットオフ周波数
    
    // ハイパスフィルターの作成（低周波ノイズの削減）
    const highPassFilter = this.audioContext.createBiquadFilter();
    highPassFilter.type = 'highpass';
    highPassFilter.frequency.value = 150; // カットオフ周波数
    
    // ノードを接続
    source.connect(lowPassFilter);
    lowPassFilter.connect(highPassFilter);
    
    // 実際のプロジェクトでは、フィルタリング後の音声をキャプチャして新しいAudioBufferを作成し、
    // それをエンコードしてbase64またはBlobに変換
    
    // モック実装
    if (!result.processedAudio) {
      result.processedAudio = {
        ...input,
        id: `${this.id}-noisereduced`,
        type: MultimodalType.AUDIO,
        createdAt: new Date(),
        // base64: '...' // 実際のbase64エンコードデータ
      };
    }
    
    this.updateProgress(0.9);
  }
  
  /**
   * 音声の速度と音量を調整
   */
  private async adjustAudio(audioBuffer: AudioBuffer, result: AudioProcessingResult, options?: AudioProcessingOptions): Promise<void> {
    this.updateProgress(0.95);
    
    const speedFactor = options?.speedFactor || 1.0;
    const volumeFactor = options?.volumeFactor || 1.0;
    
    // 実際のプロジェクトでは、以下のようなWeb Audio APIを使用して速度と音量を調整
    
    if (!this.audioContext) {
      throw new Error('AudioContext is not initialized');
    }
    
    // 新しいバッファを作成（速度調整）
    let adjustedBuffer: AudioBuffer;
    
    if (speedFactor !== 1.0) {
      // 速度を変更すると長さが変わる
      const newLength = Math.floor(audioBuffer.length / speedFactor);
      adjustedBuffer = this.audioContext.createBuffer(
        audioBuffer.numberOfChannels,
        newLength,
        audioBuffer.sampleRate
      );
      
      // 各チャンネルのデータを処理
      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const inputData = audioBuffer.getChannelData(channel);
        const outputData = adjustedBuffer.getChannelData(channel);
        
        // 線形補間で速度を調整
        for (let i = 0; i < newLength; i++) {
          const position = i * speedFactor;
          const index = Math.floor(position);
          const fraction = position - index;
          
          if (index + 1 < inputData.length) {
            outputData[i] = inputData[index] * (1 - fraction) + inputData[index + 1] * fraction;
          } else {
            outputData[i] = inputData[index];
          }
        }
      }
    } else {
      adjustedBuffer = audioBuffer;
    }
    
    // 音量調整
    if (volumeFactor !== 1.0) {
      for (let channel = 0; channel < adjustedBuffer.numberOfChannels; channel++) {
        const channelData = adjustedBuffer.getChannelData(channel);
        
        for (let i = 0; i < channelData.length; i++) {
          channelData[i] *= volumeFactor;
        }
      }
    }
    
    // 実際のプロジェクトでは、調整後の音声をエンコードしてbase64またはBlobに変換
    
    // モック実装
    if (!result.processedAudio) {
      result.processedAudio = {
        ...input,
        id: `${this.id}-adjusted`,
        type: MultimodalType.AUDIO,
        createdAt: new Date(),
        duration: adjustedBuffer.duration,
        // base64: '...' // 実際のbase64エンコードデータ
      };
    }
    
    this.updateProgress(0.99);
  }
}
