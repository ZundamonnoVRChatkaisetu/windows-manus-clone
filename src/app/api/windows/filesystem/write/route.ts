/**
 * Windowsファイルシステムの書き込みAPI
 */
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, access, constants } from 'fs/promises';
import { dirname } from 'path';
import { isValidWindowsPath } from '@/lib/windows/utils';

// ディレクトリの存在確認
async function directoryExists(dirPath: string): Promise<boolean> {
  try {
    await access(dirPath, constants.R_OK | constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

// ファイルの存在確認
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

// ディレクトリ作成（再帰的に）
async function ensureDirectory(dirPath: string): Promise<void> {
  try {
    await mkdir(dirPath, { recursive: true });
  } catch (error: any) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    // multipart/form-dataを解析
    const formData = await request.formData();
    const filePath = formData.get('path') as string;
    const file = formData.get('file') as File;
    const encoding = formData.get('encoding') as string | null;
    const appendStr = formData.get('append') as string | null;
    const overwriteStr = formData.get('overwrite') as string | null;
    const createDirectoryStr = formData.get('createDirectory') as string | null;
    
    // Booleanパラメータの変換
    const append = appendStr === 'true';
    const overwrite = overwriteStr === 'true' || overwriteStr === null; // デフォルトはtrue
    const createDirectory = createDirectoryStr === 'true' || createDirectoryStr === null; // デフォルトはtrue
    
    if (!filePath) {
      return NextResponse.json({ error: 'ファイルパスが指定されていません' }, { status: 400 });
    }
    
    if (!file) {
      return NextResponse.json({ error: 'ファイル内容が指定されていません' }, { status: 400 });
    }
    
    // パスの検証
    if (!isValidWindowsPath(filePath)) {
      return NextResponse.json({ error: '無効なファイルパスが指定されました' }, { status: 400 });
    }
    
    // ファイルの存在確認
    const exists = await fileExists(filePath);
    
    // 既存ファイルの上書き設定
    if (exists && !overwrite && !append) {
      return NextResponse.json(
        { error: 'ファイルが既に存在しており、上書きが許可されていません' },
        { status: 409 }
      );
    }
    
    // 親ディレクトリの作成（必要な場合）
    const dirPath = dirname(filePath);
    const dirExists = await directoryExists(dirPath);
    
    if (!dirExists) {
      if (!createDirectory) {
        return NextResponse.json(
          { error: 'ディレクトリが存在しません（ディレクトリ作成が許可されていません）' },
          { status: 404 }
        );
      }
      
      await ensureDirectory(dirPath);
    }
    
    // ファイルの内容を取得
    let fileContent;
    if (encoding) {
      fileContent = await file.text();
    } else {
      fileContent = Buffer.from(await file.arrayBuffer());
    }
    
    // ファイルの書き込み
    if (append && exists) {
      // 既存ファイルの読み込み
      const existingContent = await import('fs/promises').then(
        fs => fs.readFile(filePath, encoding ? { encoding: encoding as BufferEncoding } : undefined)
      );
      
      // 内容を結合
      if (encoding) {
        fileContent = existingContent + fileContent;
      } else {
        fileContent = Buffer.concat([existingContent as Buffer, fileContent as Buffer]);
      }
    }
    
    // ファイルを書き込み
    await writeFile(filePath, fileContent);
    
    return NextResponse.json({
      success: true,
      path: filePath,
      size: Buffer.isBuffer(fileContent) ? fileContent.length : Buffer.byteLength(fileContent, encoding as BufferEncoding),
      operation: exists ? (append ? 'append' : 'overwrite') : 'create'
    });
    
  } catch (error) {
    console.error('ファイル書き込みエラー:', error);
    return NextResponse.json(
      { 
        error: 'ファイルの書き込みに失敗しました', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}
