import { NextRequest, NextResponse } from 'next/server';
import { FileService, FileListOptions, FileSearchOptions } from '@/lib/files';

/**
 * ファイル管理API
 */

/**
 * ファイル一覧を取得
 */
export async function GET(request: NextRequest) {
  try {
    const fileService = FileService.getInstance();
    const searchParams = request.nextUrl.searchParams;
    
    // 検索パラメータがある場合は検索を実行
    const query = searchParams.get('query');
    if (query) {
      const searchOptions: FileSearchOptions = {
        query,
        path: searchParams.get('path') || undefined,
        recursive: searchParams.get('recursive') === 'true',
        caseSensitive: searchParams.get('caseSensitive') === 'true',
        matchWholeWord: searchParams.get('matchWholeWord') === 'true',
        useRegex: searchParams.get('useRegex') === 'true',
        includeContent: searchParams.get('includeContent') === 'true',
      };
      
      const fileTypes = searchParams.get('fileTypes');
      if (fileTypes) {
        searchOptions.fileTypes = fileTypes.split(',');
      }
      
      const files = await fileService.searchFiles(searchOptions);
      
      return NextResponse.json({
        success: true,
        data: files,
      });
    }
    
    // 一覧取得オプション
    const options: FileListOptions = {
      path: searchParams.get('path') || undefined,
      filter: searchParams.get('filter') || undefined,
      sortBy: (searchParams.get('sortBy') as any) || undefined,
      order: (searchParams.get('order') as 'asc' | 'desc') || 'asc',
    };
    
    const limit = searchParams.get('limit');
    if (limit) {
      options.limit = parseInt(limit);
    }
    
    const offset = searchParams.get('offset');
    if (offset) {
      options.offset = parseInt(offset);
    }
    
    const files = await fileService.listFiles(options);
    
    // ファイル統計情報を含める場合
    const includeStats = searchParams.get('includeStats') === 'true';
    let stats = null;
    
    if (includeStats) {
      stats = fileService.getFileStats();
    }
    
    return NextResponse.json({
      success: true,
      data: files,
      stats: includeStats ? stats : undefined,
    });
  } catch (error) {
    console.error('ファイル一覧取得エラー:', error);
    return NextResponse.json(
      { success: false, error: 'ファイル一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * ファイルを作成
 */
export async function POST(request: NextRequest) {
  try {
    const fileService = FileService.getInstance();
    const body = await request.json();
    
    // テンプレートからの作成
    if (body.templateId) {
      const result = await fileService.createFileFromTemplate(
        body.templateId,
        body.name,
        body.variables,
        body.path
      );
      
      return NextResponse.json({
        success: result.success,
        message: result.message,
        data: result.fileInfo,
        error: result.error,
      });
    }
    
    // 通常のファイル作成
    const result = await fileService.createFile(
      body.name,
      body.content,
      {
        path: body.path,
        type: body.type,
        metadata: body.metadata,
      }
    );
    
    return NextResponse.json({
      success: result.success,
      message: result.message,
      data: result.fileInfo,
      error: result.error,
    });
  } catch (error) {
    console.error('ファイル作成エラー:', error);
    return NextResponse.json(
      { success: false, error: 'ファイルの作成に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * ファイルを更新
 */
export async function PUT(request: NextRequest) {
  try {
    const fileService = FileService.getInstance();
    const body = await request.json();
    
    const result = await fileService.updateFile(
      body.id,
      body.content,
      {
        name: body.name,
        metadata: body.metadata,
      }
    );
    
    return NextResponse.json({
      success: result.success,
      message: result.message,
      data: result.fileInfo,
      error: result.error,
    });
  } catch (error) {
    console.error('ファイル更新エラー:', error);
    return NextResponse.json(
      { success: false, error: 'ファイルの更新に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * ファイルを削除
 */
export async function DELETE(request: NextRequest) {
  try {
    const fileService = FileService.getInstance();
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ファイルIDが指定されていません' },
        { status: 400 }
      );
    }
    
    const result = await fileService.deleteFile(id);
    
    return NextResponse.json({
      success: result.success,
      message: result.message,
      data: result.fileInfo,
      error: result.error,
    });
  } catch (error) {
    console.error('ファイル削除エラー:', error);
    return NextResponse.json(
      { success: false, error: 'ファイルの削除に失敗しました' },
      { status: 500 }
    );
  }
}
