import { NextRequest, NextResponse } from 'next/server';
import { syncOllamaModels, checkOllamaAvailability } from '@/lib/ollama/service';

/**
 * Ollamaモデルを同期するAPIエンドポイント
 */
export async function GET(req: NextRequest) {
  try {
    // Ollamaサービスが利用可能かチェック
    const isAvailable = await checkOllamaAvailability();
    if (!isAvailable) {
      return NextResponse.json(
        { error: 'Ollama service is not available. Please make sure Ollama is running.' },
        { status: 503 }
      );
    }

    // モデルを同期
    const models = await syncOllamaModels();
    
    if (models.length === 0) {
      return NextResponse.json(
        { 
          warning: 'No Ollama models detected. Please install at least one model using the Ollama CLI.',
          models: [] 
        },
        { status: 200 }
      );
    }
    
    return NextResponse.json({ models });
  } catch (error) {
    console.error('Error syncing Ollama models:', error);
    return NextResponse.json(
      { error: 'Failed to sync Ollama models', details: (error as Error).message },
      { status: 500 }
    );
  }
}
