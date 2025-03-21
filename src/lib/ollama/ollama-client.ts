/**
 * Ollama APIと通信するためのクライアントクラス
 */
export class OllamaClient {
  private baseUrl: string;

  constructor(baseUrl = 'http://localhost:11434') {
    this.baseUrl = baseUrl;
  }

  /**
   * APIリクエストを送信するヘルパーメソッド
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Ollamaのバージョン情報を取得
   */
  async getVersion(): Promise<{ version: string }> {
    return this.request<{ version: string }>('/api/version');
  }

  /**
   * インストール済みのモデル一覧を取得
   */
  async listLocalModels(): Promise<{ models: Array<{
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
  }> }> {
    return this.request<{ models: any[] }>('/api/tags');
  }

  /**
   * モデルを使ってテキスト生成
   */
  async generateText(model: string, prompt: string, options: {
    system?: string;
    template?: string;
    context?: number[];
    stream?: boolean;
    raw?: boolean;
    format?: string;
    options?: Record<string, any>;
  } = {}): Promise<{
    model: string;
    created_at: string;
    response: string;
    done: boolean;
    context?: number[];
    total_duration?: number;
    load_duration?: number;
    prompt_eval_count?: number;
    prompt_eval_duration?: number;
    eval_count?: number;
    eval_duration?: number;
  }> {
    return this.request<any>('/api/generate', {
      method: 'POST',
      body: JSON.stringify({
        model,
        prompt,
        ...options,
      }),
    });
  }

  /**
   * チャット応答を生成
   */
  async chat(model: string, messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>, options: {
    stream?: boolean;
    format?: string;
    options?: Record<string, any>;
  } = {}): Promise<{
    model: string;
    created_at: string;
    message: {
      role: string;
      content: string;
    };
    done: boolean;
    total_duration?: number;
    load_duration?: number;
    prompt_eval_count?: number;
    prompt_eval_duration?: number;
    eval_count?: number;
    eval_duration?: number;
  }> {
    return this.request<any>('/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        model,
        messages,
        ...options,
      }),
    });
  }

  /**
   * モデルの埋め込みベクトルを取得
   */
  async embeddings(model: string, prompt: string): Promise<{
    embedding: number[];
  }> {
    return this.request<{ embedding: number[] }>('/api/embeddings', {
      method: 'POST',
      body: JSON.stringify({
        model,
        prompt,
      }),
    });
  }

  /**
   * モデルをダウンロード（pull）
   */
  async pullModel(name: string, options: {
    insecure?: boolean;
    stream?: boolean;
  } = {}): Promise<void> {
    await this.request<any>('/api/pull', {
      method: 'POST',
      body: JSON.stringify({
        name,
        ...options,
      }),
    });
  }

  /**
   * モデルを削除
   */
  async deleteModel(name: string): Promise<void> {
    await this.request<any>('/api/delete', {
      method: 'DELETE',
      body: JSON.stringify({
        name,
      }),
    });
  }

  /**
   * モデル情報を取得
   */
  async getModelInfo(name: string): Promise<{
    license: string;
    modelfile: string;
    parameters: string;
    template: string;
    system: string;
  }> {
    return this.request<any>('/api/show', {
      method: 'POST',
      body: JSON.stringify({
        name,
      }),
    });
  }

  /**
   * モデルをコピー
   */
  async copyModel(source: string, destination: string): Promise<void> {
    await this.request<any>('/api/copy', {
      method: 'POST',
      body: JSON.stringify({
        source,
        destination,
      }),
    });
  }

  /**
   * カスタムモデルを作成
   */
  async createModel(name: string, modelfile: string): Promise<void> {
    await this.request<any>('/api/create', {
      method: 'POST',
      body: JSON.stringify({
        name,
        modelfile,
      }),
    });
  }
}
