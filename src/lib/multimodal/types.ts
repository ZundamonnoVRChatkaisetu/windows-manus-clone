/**
 * マルチモーダル処理のための型定義
 */

// マルチモーダルデータの種類
export enum MultimodalType {
  TEXT = 'text',          // テキスト
  IMAGE = 'image',        // 画像
  AUDIO = 'audio',        // 音声
  DOCUMENT = 'document',  // ドキュメント
  VIDEO = 'video',        // 動画
}

// 処理ステータス
export enum ProcessingStatus {
  PENDING = 'pending',       // 保留中
  PROCESSING = 'processing', // 処理中
  COMPLETED = 'completed',   // 完了
  FAILED = 'failed',         // 失敗
}

// マルチモーダルデータの基本インターフェース
export interface MultimodalData {
  id: string;                     // データID
  type: MultimodalType;           // データタイプ
  createdAt: Date;                // 作成日時
  metadata?: Record<string, any>; // メタデータ
}

// テキストデータ
export interface TextData extends MultimodalData {
  type: MultimodalType.TEXT;
  content: string;                // テキスト内容
  language?: string;              // 言語
}

// 画像データ
export interface ImageData extends MultimodalData {
  type: MultimodalType.IMAGE;
  url: string;                    // 画像URL
  base64?: string;                // Base64エンコードデータ
  width?: number;                 // 幅
  height?: number;                // 高さ
  format?: string;                // フォーマット (png, jpeg, etc.)
  alt?: string;                   // 代替テキスト
  caption?: string;               // キャプション
}

// 音声データ
export interface AudioData extends MultimodalData {
  type: MultimodalType.AUDIO;
  url: string;                    // 音声URL
  base64?: string;                // Base64エンコードデータ
  duration?: number;              // 再生時間 (秒)
  format?: string;                // フォーマット (mp3, wav, etc.)
  transcript?: string;            // 音声文字起こし
}

// ドキュメントデータ
export interface DocumentData extends MultimodalData {
  type: MultimodalType.DOCUMENT;
  url: string;                    // ドキュメントURL
  content?: string;               // 抽出されたテキスト内容
  format: string;                 // フォーマット (pdf, docx, etc.)
  pageCount?: number;             // ページ数
  title?: string;                 // タイトル
  author?: string;                // 著者
}

// 動画データ
export interface VideoData extends MultimodalData {
  type: MultimodalType.VIDEO;
  url: string;                    // 動画URL
  duration?: number;              // 再生時間 (秒)
  format?: string;                // フォーマット (mp4, webm, etc.)
  width?: number;                 // 幅
  height?: number;                // 高さ
  thumbnail?: string;             // サムネイルURL
  transcript?: string;            // 文字起こし
}

// 処理オプション
export interface ProcessingOptions {
  maxSize?: number;               // 最大サイズ (バイト)
  timeout?: number;               // タイムアウト (ミリ秒)
  quality?: number;               // 品質 (0-1)
  language?: string;              // 言語設定
  model?: string;                 // 使用するモデル
}

// 画像処理オプション
export interface ImageProcessingOptions extends ProcessingOptions {
  resizeWidth?: number;           // リサイズ幅
  resizeHeight?: number;          // リサイズ高さ
  detectObjects?: boolean;        // オブジェクト検出
  detectFaces?: boolean;          // 顔検出
  detectText?: boolean;           // テキスト検出
  enhanceQuality?: boolean;       // 画質向上
  removeBackground?: boolean;     // 背景削除
}

// 音声処理オプション
export interface AudioProcessingOptions extends ProcessingOptions {
  removeSilence?: boolean;        // 無音削除
  reduceNoise?: boolean;          // ノイズ削除
  speedFactor?: number;           // 速度係数
  volumeFactor?: number;          // 音量係数
  transcriptionLanguage?: string; // 文字起こし言語
}

// ドキュメント処理オプション
export interface DocumentProcessingOptions extends ProcessingOptions {
  extractText?: boolean;          // テキスト抽出
  extractImages?: boolean;        // 画像抽出
  extractTables?: boolean;        // テーブル抽出
  includeMeta?: boolean;          // メタデータ含める
  pageRange?: [number, number];   // ページ範囲
}

// 処理結果インターフェース
export interface ProcessingResult {
  id: string;                     // 処理ID
  status: ProcessingStatus;       // ステータス
  createdAt: Date;                // 作成日時
  completedAt?: Date;             // 完了日時
  duration?: number;              // 処理時間 (ミリ秒)
  error?: string;                 // エラーメッセージ
  progress?: number;              // 進捗 (0-1)
  inputData?: MultimodalData;     // 入力データ
  outputData?: MultimodalData;    // 出力データ
  metadata?: Record<string, any>; // メタデータ
}

// 画像処理結果
export interface ImageProcessingResult extends ProcessingResult {
  detectedObjects?: {
    label: string;                // ラベル
    confidence: number;           // 信頼度
    boundingBox?: {               // バウンディングボックス
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }[];
  
  detectedFaces?: {
    confidence: number;           // 信頼度
    boundingBox?: {               // バウンディングボックス
      x: number;
      y: number;
      width: number;
      height: number;
    };
    landmarks?: {                 // 特徴点
      leftEye?: [number, number];
      rightEye?: [number, number];
      nose?: [number, number];
      leftMouth?: [number, number];
      rightMouth?: [number, number];
    };
  }[];
  
  detectedText?: {
    text: string;                 // テキスト
    confidence: number;           // 信頼度
    boundingBox?: {               // バウンディングボックス
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }[];
  
  enhancedImage?: ImageData;      // 画質向上画像
  backgroundRemovedImage?: ImageData; // 背景削除画像
}

// 音声処理結果
export interface AudioProcessingResult extends ProcessingResult {
  transcript?: string;            // 文字起こし
  segments?: {                    // セグメント
    start: number;                // 開始時間 (秒)
    end: number;                  // 終了時間 (秒)
    text: string;                 // テキスト
    confidence: number;           // 信頼度
  }[];
  
  languageDetection?: {           // 言語検出
    language: string;             // 言語コード
    confidence: number;           // 信頼度
  };
  
  processedAudio?: AudioData;     // 処理済み音声
}

// ドキュメント処理結果
export interface DocumentProcessingResult extends ProcessingResult {
  extractedText?: string;         // 抽出テキスト
  extractedImages?: ImageData[];  // 抽出画像
  extractedTables?: {             // 抽出テーブル
    rows: number;                 // 行数
    columns: number;              // 列数
    data: string[][];             // テーブルデータ
    page: number;                 // ページ番号
  }[];
  
  metadata?: {                    // メタデータ
    title?: string;               // タイトル
    author?: string;              // 著者
    creationDate?: Date;          // 作成日
    modificationDate?: Date;      // 修正日
    keywords?: string[];          // キーワード
    pageCount?: number;           // ページ数
  };
  
  summary?: string;               // 要約
}

// マルチモーダル処理イベント
export enum MultimodalEvent {
  PROGRESS = 'progress',          // 進捗イベント
  COMPLETED = 'completed',        // 完了イベント
  FAILED = 'failed',              // 失敗イベント
  CANCELLED = 'cancelled',        // キャンセルイベント
}

// マルチモーダルイベントデータ
export interface MultimodalEventData {
  id: string;                     // 処理ID
  event: MultimodalEvent;         // イベント種類
  timestamp: Date;                // タイムスタンプ
  data?: any;                     // イベントデータ
}
