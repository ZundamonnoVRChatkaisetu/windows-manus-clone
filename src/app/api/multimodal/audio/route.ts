/**
 * 音声処理APIエンドポイント
 */

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { multimodalService } from '@/lib/multimodal/service';
import { AudioData, MultimodalType, AudioProcessingOptions } from '@/lib/multimodal/types';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

/**
 * 音声アップロード用のディレクトリを準備
 */
async function ensureUploadDir() {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'audio');
  try {
    await mkdir(uploadDir, { recursive: true });
    return uploadDir;
  } catch (error) {
    console.error('Failed to create upload directory:', error);
    throw error;
  }
}

/**
 * 音声ファイルを保存する
 */
async function saveAudioFile(file: File): Promise<string> {
  const uploadDir = await ensureUploadDir();
  const uniqueFilename = `${uuidv4()}-${file.name}`;
  const filePath = path.join(uploadDir, uniqueFilename);
  
  // ArrayBufferとしてファイルを読み込む
  const arrayBuffer = await file.arrayBuffer();
  
  // ファイルを保存
  await writeFile(filePath, Buffer.from(arrayBuffer));
  
  // 公開URLを返す
  return `/uploads/audio/${uniqueFilename}`;
}

/**
 * Base64から音声データオブジェクトを作成
 */
function createAudioDataFromBase64(base64: string, filename?: string): AudioData {
  const id = uuidv4();
  const fileExt = base64.startsWith('data:audio/mp3') ? 'mp3' : 
    base64.startsWith('data:audio/wav') ? 'wav' : 
    base64.startsWith('data:audio/ogg') ? 'ogg' : 'mp3';
  
  return {
    id,
    type: MultimodalType.AUDIO,
    createdAt: new Date(),
    url: '',  // URLは空のまま（base64データを使用）
    base64,
    format: fileExt,
  };
}

/**
 * ファイルから音声データオブジェクトを作成
 */
async function createAudioDataFromFile(file: File): Promise<AudioData> {
  const url = await saveAudioFile(file);
  
  // 音声データを作成
  return {
    id: uuidv4(),
    type: MultimodalType.AUDIO,
    createdAt: new Date(),
    url,
    format: file.name.split('.').pop() || 'mp3',
  };
}

/**
 * 音声処理POSTハンドラ
 */
export async function POST(request: NextRequest) {
  try {
    // マルチパートフォームデータをパース
    const formData = await request.formData();
    
    // 音声ファイルを取得
    const audioFile = formData.get('audio') as File | null;
    const base64Audio = formData.get('base64') as string | null;
    
    // 処理オプションをパース
    const optionsString = formData.get('options') as string | null;
    const options: AudioProcessingOptions = optionsString 
      ? JSON.parse(optionsString) 
      : {};
    
    let audioData: AudioData;
    
    // ファイルまたはBase64データから音声データを作成
    if (audioFile && audioFile.size > 0) {
      audioData = await createAudioDataFromFile(audioFile);
    } else if (base64Audio) {
      audioData = createAudioDataFromBase64(base64Audio);
    } else {
      return NextResponse.json(
        { error: 'No audio data provided' },
        { status: 400 }
      );
    }
    
    // 音声処理サービスを呼び出し
    const processingId = await multimodalService.processAudio(
      audioData,
      options
    );
    
    // 処理IDを返す
    return NextResponse.json({ 
      id: processingId,
      message: 'Audio processing started'
    });
  } catch (error) {
    console.error('Error processing audio:', error);
    return NextResponse.json(
      { error: 'Failed to process audio' },
      { status: 500 }
    );
  }
}

/**
 * 音声処理状態取得GETハンドラ
 */
export async function GET(request: NextRequest) {
  try {
    // URLからIDを取得
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      // IDがない場合は全ての処理状態を返す
      const statuses = multimodalService.getAllProcessingStatus();
      return NextResponse.json({ statuses });
    }
    
    // 指定されたIDの処理状態を取得
    const status = multimodalService.getProcessingStatus(id);
    
    if (!status) {
      return NextResponse.json(
        { error: 'Processing task not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ status });
  } catch (error) {
    console.error('Error getting processing status:', error);
    return NextResponse.json(
      { error: 'Failed to get processing status' },
      { status: 500 }
    );
  }
}

/**
 * 音声処理のキャンセルDELETEハンドラ
 */
export async function DELETE(request: NextRequest) {
  try {
    // URLからIDを取得
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Processing ID is required' },
        { status: 400 }
      );
    }
    
    // 処理をキャンセル
    const cancelled = multimodalService.cancelProcessing(id);
    
    if (!cancelled) {
      return NextResponse.json(
        { error: 'Processing task not found or already completed' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      message: 'Processing cancelled successfully' 
    });
  } catch (error) {
    console.error('Error cancelling processing:', error);
    return NextResponse.json(
      { error: 'Failed to cancel processing' },
      { status: 500 }
    );
  }
}

/**
 * 音声トランスクリプションAPIエンドポイント
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, transcript } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Processing ID is required' },
        { status: 400 }
      );
    }
    
    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript is required' },
        { status: 400 }
      );
    }
    
    // TODO: トランスクリプトの更新処理
    // 実際の実装では、IDに対応する処理結果を取得し、トランスクリプトを更新
    
    return NextResponse.json({ 
      message: 'Transcript updated successfully' 
    });
  } catch (error) {
    console.error('Error updating transcript:', error);
    return NextResponse.json(
      { error: 'Failed to update transcript' },
      { status: 500 }
    );
  }
}
