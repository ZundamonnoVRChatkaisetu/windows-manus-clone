import { OllamaClient } from './ollama-client';

export interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details?: {
    format: string;
    family: string;
    families?: string[];
    parameter_size?: string;
    quantization_level?: string;
  };
}

/**
 * インストール済みのOllamaモデル一覧を取得する
 */
export async function getInstalledModels(): Promise<OllamaModel[]> {
  try {
    const client = new OllamaClient();
    const response = await client.listLocalModels();
    return response.models || [];
  } catch (error) {
    console.error('Ollamaモデル一覧の取得に失敗しました:', error);
    return [];
  }
}

/**
 * Ollamaの利用可能なモデル一覧（ライブラリ）を取得する
 */
export async function getAvailableModels(): Promise<{name: string, isInstalled: boolean}[]> {
  // 人気のOllamaモデル一覧
  const popularModels = [
    'llama3:8b-instruct-q4_0',
    'llama3:70b-instruct-q4_0',
    'mistral:7b-instruct-v0.2-q4_0',
    'mixtral:8x7b-instruct-v0.1-q4_0',
    'phi3:mini-128k-instruct-q4_0',
    'phi3:medium-128k-instruct-q4_0',
    'gemma:7b-instruct-q4_0',
    'gemma:2b-instruct-q4_0',
    'qwen:72b-chat-q4_0',
    'codellama:70b-instruct-q4_0',
    'yi:34b-chat-q4_0',
    'orca-mini:3b-q4_0',
  ];
  
  try {
    // インストール済みのモデルを取得
    const installedModels = await getInstalledModels();
    const installedModelNames = installedModels.map(model => model.name);
    
    // 利用可能なモデル一覧を作成
    return popularModels.map(modelName => ({
      name: modelName,
      isInstalled: installedModelNames.includes(modelName)
    }));
  } catch (error) {
    console.error('利用可能なモデル一覧の取得に失敗しました:', error);
    return popularModels.map(modelName => ({
      name: modelName,
      isInstalled: false
    }));
  }
}

/**
 * モデルのダウンロードを開始する
 * @param modelName ダウンロードするモデル名
 * @returns ダウンロード成功の場合はtrue、失敗の場合はfalse
 */
export async function pullModel(modelName: string): Promise<boolean> {
  try {
    const client = new OllamaClient();
    await client.pullModel(modelName);
    return true;
  } catch (error) {
    console.error(`モデル ${modelName} のダウンロードに失敗しました:`, error);
    return false;
  }
}

/**
 * モデルを削除する
 * @param modelName 削除するモデル名
 * @returns 削除成功の場合はtrue、失敗の場合はfalse
 */
export async function deleteModel(modelName: string): Promise<boolean> {
  try {
    const client = new OllamaClient();
    await client.deleteModel(modelName);
    return true;
  } catch (error) {
    console.error(`モデル ${modelName} の削除に失敗しました:`, error);
    return false;
  }
}

/**
 * モデル情報を取得する
 * @param modelName モデル名
 * @returns モデル情報
 */
export async function getModelInfo(modelName: string): Promise<OllamaModel | null> {
  try {
    const models = await getInstalledModels();
    return models.find(model => model.name === modelName) || null;
  } catch (error) {
    console.error(`モデル ${modelName} の情報取得に失敗しました:`, error);
    return null;
  }
}

/**
 * モデルサイズをフォーマットする（バイト -> GB）
 * @param sizeInBytes サイズ（バイト）
 * @returns フォーマットされたサイズ（GB）
 */
export function formatModelSize(sizeInBytes: number): string {
  const sizeInGB = sizeInBytes / (1024 * 1024 * 1024);
  return `${sizeInGB.toFixed(2)} GB`;
}
