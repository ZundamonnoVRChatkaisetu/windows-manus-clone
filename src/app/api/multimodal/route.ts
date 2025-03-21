/**
 * マルチモーダルAPIインデックスエンドポイント
 * マルチモーダル処理サービスの基本情報と利用可能なエンドポイントを提供
 */

import { NextRequest, NextResponse } from 'next/server';
import { multimodalService } from '@/lib/multimodal/service';

/**
 * マルチモーダルAPI情報取得GETハンドラ
 */
export async function GET(request: NextRequest) {
  try {
    // マルチモーダルサービスの基本情報を返す
    return NextResponse.json({
      service: 'Manus AI Multimodal Processing Service',
      version: '1.0.0',
      endpoints: [
        {
          path: '/api/multimodal/image',
          methods: ['GET', 'POST', 'DELETE'],
          description: '画像処理API'
        },
        {
          path: '/api/multimodal/audio',
          methods: ['GET', 'POST', 'DELETE', 'PATCH'],
          description: '音声処理API'
        },
        {
          path: '/api/multimodal/document',
          methods: ['GET', 'POST', 'DELETE', 'PATCH'],
          description: 'ドキュメント処理API'
        }
      ],
      capabilities: {
        image: [
          'オブジェクト検出',
          '顔検出',
          'テキスト検出',
          '画質向上',
          '背景削除',
          '画像リサイズ'
        ],
        audio: [
          '音声文字起こし',
          '無音削除',
          'ノイズ削減',
          '速度調整',
          '音量調整'
        ],
        document: [
          'テキスト抽出',
          '画像抽出',
          'テーブル抽出',
          'メタデータ抽出',
          'ドキュメント要約'
        ]
      },
      activeProcessings: multimodalService.getAllProcessingStatus().length
    });
  } catch (error) {
    console.error('Error retrieving multimodal service info:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve multimodal service information' },
      { status: 500 }
    );
  }
}

/**
 * 複数のマルチモーダル処理の状態を一括取得POSTハンドラ
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Array of processing IDs is required' },
        { status: 400 }
      );
    }
    
    // 指定されたIDの処理状態を取得
    const statuses = ids.map(id => {
      const status = multimodalService.getProcessingStatus(id);
      return {
        id,
        status: status || { error: 'Processing task not found' }
      };
    });
    
    return NextResponse.json({ statuses });
  } catch (error) {
    console.error('Error getting processing statuses:', error);
    return NextResponse.json(
      { error: 'Failed to get processing statuses' },
      { status: 500 }
    );
  }
}

/**
 * 全てのマルチモーダル処理をキャンセルDELETEハンドラ
 */
export async function DELETE() {
  try {
    // 全ての処理をキャンセル
    multimodalService.cancelAllProcessing();
    
    return NextResponse.json({ 
      message: 'All processing tasks cancelled successfully' 
    });
  } catch (error) {
    console.error('Error cancelling all processing tasks:', error);
    return NextResponse.json(
      { error: 'Failed to cancel processing tasks' },
      { status: 500 }
    );
  }
}
