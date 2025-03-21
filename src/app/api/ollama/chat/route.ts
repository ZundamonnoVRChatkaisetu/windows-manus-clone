import { NextRequest, NextResponse } from 'next/server';
import { OllamaClient } from '@/lib/ollama/ollama-client';
import { getSelectedOllamaModel } from '@/lib/ollama/service';
import { checkOllamaAvailability } from '@/lib/ollama/service';

export async function POST(req: NextRequest) {
  try {
    // Ollamaが利用可能かチェック
    const isOllamaAvailable = await checkOllamaAvailability();
    if (!isOllamaAvailable) {
      return NextResponse.json(
        { error: 'Ollama is not available. Please start Ollama service.' },
        { status: 503 }
      );
    }

    // リクエストからメッセージを取得
    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // 設定で選択されているモデルを取得
    const selectedModel = await getSelectedOllamaModel();
    if (!selectedModel) {
      return NextResponse.json(
        { error: 'No model selected. Please select a model in settings.' },
        { status: 400 }
      );
    }

    // Ollamaクライアントを初期化
    const ollamaClient = new OllamaClient();

    // チャット応答を生成
    const response = await ollamaClient.chat(selectedModel.name, messages);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error generating chat response:', error);
    return NextResponse.json(
      { error: 'Failed to generate response', details: (error as Error).message },
      { status: 500 }
    );
  }
}
