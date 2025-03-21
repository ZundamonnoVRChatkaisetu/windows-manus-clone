/**
 * Ollamaとの通信を行うクライアント
 */

export interface OllamaModelInfo {
  name: string;
  modified: string;
  size: number;
  quantization?: string;
  parameterSize?: string;
  format?: string;
  family?: string;
  displayName?: string;
}

export interface OllamaListResponse {
  models: OllamaModelInfo[];
}

export interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OllamaChatParams {
  model: string;
  messages: OllamaMessage[];
  stream?: boolean;
  format?: 'json';
  options?: {
    temperature?: number;
    num_predict?: number;
    top_k?: number;
    top_p?: number;
    seed?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
  };
}

export interface OllamaChatResponse {
  model: string;
  message: OllamaMessage;
  done: boolean;
}

/**
 * Ollamaサーバーのポートを指定する。デフォルトは11434
 */
export const OLLAMA_API_HOST = 'http://localhost:11434';

/**
 * Ollamaサーバーに接続できるかチェックする
 */
export async function checkOllamaConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_API_HOST}/api/tags`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    return response.ok;
  } catch (error) {
    console.error('Ollama connection error:', error);
    return false;
  }
}

/**
 * 利用可能なOllamaモデルの一覧を取得する
 */
export async function listOllamaModels(): Promise<OllamaModelInfo[]> {
  try {
    const response = await fetch(`${OLLAMA_API_HOST}/api/tags`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to get Ollama models: ${response.statusText}`);
    }

    const data = await response.json() as OllamaListResponse;
    
    // モデル名から表示名を生成
    return data.models.map(model => {
      // quantization情報がある場合は、表示名に含める
      const displayName = model.quantization
        ? `${model.name.split(':')[0]} (${model.quantization})`
        : model.name.split(':')[0];
      
      return {
        ...model,
        displayName,
      };
    });
  } catch (error) {
    console.error('Error listing Ollama models:', error);
    return [];
  }
}

/**
 * Ollamaのチャットエンドポイントを使用してテキスト生成を行う
 */
export async function generateChatResponse(params: OllamaChatParams): Promise<OllamaChatResponse> {
  try {
    const response = await fetch(`${OLLAMA_API_HOST}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate chat response: ${response.statusText}`);
    }

    return await response.json() as OllamaChatResponse;
  } catch (error) {
    console.error('Error generating chat response:', error);
    throw error;
  }
}

/**
 * Ollamaのストリーミングチャットレスポンスを生成する
 */
export async function* streamChatResponse(params: OllamaChatParams): AsyncGenerator<OllamaChatResponse> {
  // ストリーミングを有効にする
  params.stream = true;

  try {
    const response = await fetch(`${OLLAMA_API_HOST}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`Failed to stream chat response: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      
      // レスポンスが複数行に分かれている可能性がある
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // 最後の行が不完全な場合は、次の読み込みのために保持

      for (const line of lines) {
        if (line.trim() === '') continue;
        try {
          const chunk = JSON.parse(line) as OllamaChatResponse;
          yield chunk;
        } catch (e) {
          console.error('Error parsing JSON chunk:', e);
          console.error('Raw chunk:', line);
        }
      }
    }
  } catch (error) {
    console.error('Error streaming chat response:', error);
    throw error;
  }
}
