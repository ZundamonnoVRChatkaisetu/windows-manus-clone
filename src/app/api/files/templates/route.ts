import { NextRequest, NextResponse } from 'next/server';
import { FileService } from '@/lib/files';

/**
 * ファイルテンプレートAPI
 */

/**
 * テンプレート一覧を取得
 */
export async function GET(request: NextRequest) {
  try {
    const fileService = FileService.getInstance();
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category') || undefined;
    
    const templates = fileService.getTemplates(category);
    
    return NextResponse.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    console.error('テンプレート一覧取得エラー:', error);
    return NextResponse.json(
      { success: false, error: 'テンプレート一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * テンプレートからファイルを作成
 */
export async function POST(request: NextRequest) {
  try {
    const fileService = FileService.getInstance();
    const body = await request.json();
    
    if (!body.templateId || !body.name) {
      return NextResponse.json(
        { success: false, error: 'テンプレートIDとファイル名は必須です' },
        { status: 400 }
      );
    }
    
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
  } catch (error) {
    console.error('テンプレートからのファイル作成エラー:', error);
    return NextResponse.json(
      { success: false, error: 'テンプレートからのファイル作成に失敗しました' },
      { status: 500 }
    );
  }
}
