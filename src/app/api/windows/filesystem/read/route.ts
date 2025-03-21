/**
 * Windowsファイルシステムの読み込みAPI
 */
import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { isValidWindowsPath } from '@/lib/windows/utils';
import path from 'path';

// MIMEタイプの判定
function getMimeType(filePath: string): string {
  const extension = path.extname(filePath).toLowerCase().substring(1);
  
  const mimeTypes: Record<string, string> = {
    'txt': 'text/plain',
    'html': 'text/html',
    'css': 'text/css',
    'js': 'text/javascript',
    'ts': 'text/typescript',
    'json': 'application/json',
    'xml': 'application/xml',
    'csv': 'text/csv',
    'md': 'text/markdown',
    'pdf': 'application/pdf',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'zip': 'application/zip',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  };
  
  return mimeTypes[extension] || 'application/octet-stream';
}

// テキストファイルを判定
function isTextFile(filePath: string): boolean {
  const textExtensions = [
    'txt', 'html', 'css', 'js', 'ts', 'json', 'xml', 
    'csv', 'md', 'log', 'ini', 'conf', 'yml', 'yaml',
    'sql', 'sh', 'bat', 'ps1', 'php', 'py', 'rb', 
    'c', 'cpp', 'cs', 'java', 'go', 'rs', 'swift',
    'kt', 'jsx', 'tsx', 'vue', 'r', 'pl', 'h', 'hpp'
  ];
  
  const extension = path.extname(filePath).toLowerCase().substring(1);
  return textExtensions.includes(extension);
}

export async function GET(request: NextRequest) {
  // クエリパラメータからパスを取得
  const { searchParams } = new URL(request.url);
  const filePath = searchParams.get('path');
  const encoding = searchParams.get('encoding') || 'utf-8';
  const maxSizeStr = searchParams.get('maxSize');
  const maxSize = maxSizeStr ? parseInt(maxSizeStr, 10) : undefined;
  
  if (!filePath) {
    return NextResponse.json({ error: 'ファイルパスが指定されていません' }, { status: 400 });
  }
  
  // パスの検証
  if (!isValidWindowsPath(filePath)) {
    return NextResponse.json({ error: '無効なファイルパスが指定されました' }, { status: 400 });
  }
  
  try {
    // ファイルのMIMEタイプを取得
    const mimeType = getMimeType(filePath);
    const isText = isTextFile(filePath);
    
    // ファイルを読み込む
    let fileContent;
    try {
      if (isText && encoding) {
        fileContent = await readFile(filePath, { encoding: encoding as BufferEncoding });
      } else {
        fileContent = await readFile(filePath);
      }
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return NextResponse.json({ error: 'ファイルが見つかりません' }, { status: 404 });
      } else if (error.code === 'EACCES') {
        return NextResponse.json({ error: 'ファイルへのアクセスが拒否されました' }, { status: 403 });
      } else {
        throw error;
      }
    }
    
    // ファイルサイズの制限
    if (maxSize && fileContent.length > maxSize) {
      return NextResponse.json(
        { error: `ファイルサイズが制限（${maxSize}バイト）を超えています（${fileContent.length}バイト）` },
        { status: 413 }
      );
    }
    
    // テキストファイルの場合はJSONとして返す
    if (isText && encoding) {
      return NextResponse.json({
        content: fileContent,
        mimeType,
        size: Buffer.byteLength(fileContent, encoding as BufferEncoding),
        path: filePath
      });
    }
    
    // バイナリファイルの場合は直接返す
    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': mimeType,
        'Content-Length': fileContent.length.toString(),
        'Content-Disposition': `inline; filename="${path.basename(filePath)}"`,
      }
    });
  } catch (error) {
    console.error('ファイル読み込みエラー:', error);
    return NextResponse.json(
      { 
        error: 'ファイルの読み込みに失敗しました', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}
