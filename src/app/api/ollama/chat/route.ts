import { NextRequest, NextResponse } from 'next/server';
import { OllamaClient } from '@/lib/ollama/ollama-client';
import { getSelectedOllamaModel, getDetectedOllamaModels, setDefaultOllamaModel, checkOllamaAvailability } from '@/lib/ollama/service';

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
    let selectedModel = await getSelectedOllamaModel();
    
    // モデルが選択されていない場合、利用可能なモデルを再取得して自動選択を試みる
    if (!selectedModel) {
      const availableModels = await getDetectedOllamaModels();
      
      if (availableModels.length > 0) {
        // 利用可能なモデルがある場合は最初のモデルを選択
        await setDefaultOllamaModel(availableModels[0].name);
        selectedModel = availableModels[0];
        console.log(`Auto-selected model: ${selectedModel.name}`);
      } else {
        // それでもモデルがない場合はエラーを返す
        return NextResponse.json(
          { 
            error: 'No Ollama models detected. Please install at least one model using the Ollama CLI.',
            suggestion: 'You can install a model using the command: ollama pull llama3:latest'  
          },
          { status: 400 }
        );
      }
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
