/**
 * ドキュメント処理APIエンドポイント
 */

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { multimodalService } from '@/lib/multimodal/service';
import { DocumentData, MultimodalType, DocumentProcessingOptions } from '@/lib/multimodal/types';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

/**
 * ドキュメントアップロード用のディレクトリを準備
 */
async function ensureUploadDir() {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'documents');
  try {
    await mkdir(uploadDir, { recursive: true });
    return uploadDir;
  } catch (error) {
    console.error('Failed to create upload directory:', error);
    throw error;
  }
}

/**
 * ドキュメントファイルを保存する
 */
async function saveDocumentFile(file: File): Promise<string> {
  const uploadDir = await ensureUploadDir();
  const uniqueFilename = `${uuidv4()}-${file.name}`;
  const filePath = path.join(uploadDir, uniqueFilename);
  
  // ArrayBufferとしてファイルを読み込む
  const arrayBuffer = await file.arrayBuffer();
  
  // ファイルを保存
  await writeFile(filePath, Buffer.from(arrayBuffer));
  
  // 公開URLを返す
  return `/uploads/documents/${uniqueFilename}`;
}

/**
 * ファイルからドキュメントデータオブジェクトを作成
 */
async function createDocumentDataFromFile(file: File): Promise<DocumentData> {
  const url = await saveDocumentFile(file);
  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'unknown';
  
  // ドキュメントデータを作成
  return {
    id: uuidv4(),
    type: MultimodalType.DOCUMENT,
    createdAt: new Date(),
    url,
    format: fileExt,
    title: file.name
  };
}

/**
 * ドキュメント処理POSTハンドラ
 */
export async function POST(request: NextRequest) {
  try {
    // マルチパートフォームデータをパース
    const formData = await request.formData();
    
    // ドキュメントファイルを取得
    const documentFile = formData.get('document') as File | null;
    
    // 処理オプションをパース
    const optionsString = formData.get('options') as string | null;
    const options: DocumentProcessingOptions = optionsString 
      ? JSON.parse(optionsString) 
      : {};
    
    // タイトルとページ範囲のオプション設定
    const title = formData.get('title') as string | null;
    const pageRangeStart = formData.get('pageRangeStart') as string | null;
    const pageRangeEnd = formData.get('pageRangeEnd') as string | null;
    
    if (title) {
      options.includeMeta = true;
    }
    
    if (pageRangeStart && pageRangeEnd) {
      options.pageRange = [parseInt(pageRangeStart), parseInt(pageRangeEnd)];
    }
    
    // ファイルからドキュメントデータを作成
    if (!documentFile || documentFile.size === 0) {
      return NextResponse.json(
        { error: 'No document file provided' },
        { status: 400 }
      );
    }
    
    // ファイルタイプの検証
    const fileExt = documentFile.name.split('.').pop()?.toLowerCase();
    const supportedTypes = ['pdf', 'docx', 'doc', 'txt', 'rtf', 'odt'];
    
    if (!fileExt || !supportedTypes.includes(fileExt)) {
      return NextResponse.json(
        { error: 'Unsupported document format. Supported formats: PDF, DOCX, DOC, TXT, RTF, ODT' },
        { status: 400 }
      );
    }
    
    const documentData = await createDocumentDataFromFile(documentFile);
    
    // タイトルがある場合は設定
    if (title) {
      documentData.title = title;
    }
    
    // ドキュメント処理サービスを呼び出し
    const processingId = await multimodalService.processDocument(
      documentData,
      options
    );
    
    // 処理IDを返す
    return NextResponse.json({ 
      id: processingId,
      message: 'Document processing started'
    });
  } catch (error) {
    console.error('Error processing document:', error);
    return NextResponse.json(
      { error: 'Failed to process document' },
      { status: 500 }
    );
  }
}

/**
 * ドキュメント処理状態取得GETハンドラ
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
 * ドキュメント処理のキャンセルDELETEハンドラ
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
 * ドキュメント処理結果の取得PATCHハンドラ（要約操作など）
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Processing ID is required' },
        { status: 400 }
      );
    }
    
    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }
    
    // アクション別の処理
    switch(action) {
      case 'summarize':
        // 要約生成処理
        // 実際の実装では、IDに対応する処理結果を取得し、要約を生成
        return NextResponse.json({ 
          message: 'Summary generation requested',
          id 
        });
      
      case 'extract_text':
        // テキスト抽出の処理
        return NextResponse.json({ 
          message: 'Text extraction requested',
          id 
        });
      
      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error processing document action:', error);
    return NextResponse.json(
      { error: 'Failed to process document action' },
      { status: 500 }
    );
  }
}
