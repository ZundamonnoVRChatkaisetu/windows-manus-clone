/**
 * 画像処理APIエンドポイント
 */

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { multimodalService } from '@/lib/multimodal/service';
import { ImageData, MultimodalType, ImageProcessingOptions } from '@/lib/multimodal/types';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

/**
 * 画像アップロード用のディレクトリを準備
 */
async function ensureUploadDir() {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'images');
  try {
    await mkdir(uploadDir, { recursive: true });
    return uploadDir;
  } catch (error) {
    console.error('Failed to create upload directory:', error);
    throw error;
  }
}

/**
 * 画像ファイルを保存する
 */
async function saveImageFile(file: File): Promise<string> {
  const uploadDir = await ensureUploadDir();
  const uniqueFilename = `${uuidv4()}-${file.name}`;
  const filePath = path.join(uploadDir, uniqueFilename);
  
  // ArrayBufferとしてファイルを読み込む
  const arrayBuffer = await file.arrayBuffer();
  
  // ファイルを保存
  await writeFile(filePath, Buffer.from(arrayBuffer));
  
  // 公開URLを返す（アプリケーションのベースURLに応じて調整が必要）
  return `/uploads/images/${uniqueFilename}`;
}

/**
 * Base64からImageDataオブジェクトを作成
 */
function createImageDataFromBase64(base64: string, filename?: string): ImageData {
  const id = uuidv4();
  const fileExt = base64.startsWith('data:image/png') ? 'png' : 
    base64.startsWith('data:image/jpeg') ? 'jpeg' : 
    base64.startsWith('data:image/gif') ? 'gif' : 'jpg';
  
  return {
    id,
    type: MultimodalType.IMAGE,
    createdAt: new Date(),
    url: '',  // URLは空のまま（base64データを使用）
    base64,
    format: fileExt,
    alt: filename || `Image ${id}` 
  };
}

/**
 * ファイルからImageDataオブジェクトを作成
 */
async function createImageDataFromFile(file: File): Promise<ImageData> {
  const url = await saveImageFile(file);
  
  // 画像データを作成
  return {
    id: uuidv4(),
    type: MultimodalType.IMAGE,
    createdAt: new Date(),
    url,
    format: file.name.split('.').pop() || 'jpg',
    alt: file.name
  };
}

/**
 * 画像処理POSTハンドラ
 */
export async function POST(request: NextRequest) {
  try {
    // マルチパートフォームデータをパース
    const formData = await request.formData();
    
    // 画像ファイルを取得
    const imageFile = formData.get('image') as File | null;
    const base64Image = formData.get('base64') as string | null;
    
    // 処理オプションをパース
    const optionsString = formData.get('options') as string | null;
    const options: ImageProcessingOptions = optionsString 
      ? JSON.parse(optionsString) 
      : {};
    
    let imageData: ImageData;
    
    // ファイルまたはBase64データからImageDataを作成
    if (imageFile && imageFile.size > 0) {
      imageData = await createImageDataFromFile(imageFile);
    } else if (base64Image) {
      imageData = createImageDataFromBase64(base64Image);
    } else {
      return NextResponse.json(
        { error: 'No image data provided' },
        { status: 400 }
      );
    }
    
    // 画像処理サービスを呼び出し
    const processingId = await multimodalService.processImage(
      imageData,
      options
    );
    
    // 処理IDを返す
    return NextResponse.json({ 
      id: processingId,
      message: 'Image processing started'
    });
  } catch (error) {
    console.error('Error processing image:', error);
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    );
  }
}

/**
 * 画像処理状態取得GETハンドラ
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
 * 画像処理のキャンセルDELETEハンドラ
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
