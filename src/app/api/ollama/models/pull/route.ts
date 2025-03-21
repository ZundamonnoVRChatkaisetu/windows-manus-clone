import { NextRequest, NextResponse } from 'next/server';
import { pullModel } from '@/lib/ollama';
import { syncOllamaModels } from '@/lib/ollama/service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'モデル名が指定されていません' },
        { status: 400 }
      );
    }

    // モデルのダウンロード
    await pullModel(name);
    
    // モデルのダウンロード後にデータベースを同期
    await syncOllamaModels();

    return NextResponse.json(
      { success: true, message: `モデル ${name} のダウンロードが完了しました` },
      { status: 200 }
    );
  } catch (error) {
    console.error('モデルダウンロードエラー:', error);
    return NextResponse.json(
      { error: `モデルのダウンロード中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}