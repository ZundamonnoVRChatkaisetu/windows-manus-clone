import { NextRequest, NextResponse } from 'next/server';
import { FileService } from '@/lib/files';

/**
 * ファイル共有API
 */

/**
 * 共有情報を取得
 */
export async function GET(request: NextRequest) {
  try {
    const fileService = FileService.getInstance();
    const searchParams = request.nextUrl.searchParams;
    const shareId = searchParams.get('id');
    
    if (!shareId) {
      return NextResponse.json(
        { success: false, error: '共有IDが指定されていません' },
        { status: 400 }
      );
    }
    
    const shareInfo = fileService.getShareInfo(shareId);
    
    if (!shareInfo) {
      return NextResponse.json(
        { success: false, error: '共有情報が見つかりません' },
        { status: 404 }
      );
    }
    
    // 共有されているファイル情報を取得
    const fileInfo = await fileService.getFile(shareInfo.fileId);
    
    if (!fileInfo) {
      return NextResponse.json(
        { success: false, error: '共有ファイルが見つかりません' },
        { status: 404 }
      );
    }
    
    // パスワードが必要な場合
    if (shareInfo.password) {
      const password = searchParams.get('password');
      
      if (!password) {
        return NextResponse.json(
          { 
            success: false, 
            requirePassword: true,
            error: 'このファイルを表示するにはパスワードが必要です' 
          },
          { status: 401 }
        );
      }
      
      // パスワード検証ロジックはモックとして実装
      // 実際の実装では、ハッシュ化されたパスワードと比較するなどの処理が必要
      if (password !== 'password') {
        return NextResponse.json(
          { success: false, error: 'パスワードが正しくありません' },
          { status: 401 }
        );
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        shareInfo,
        fileInfo: {
          ...fileInfo,
          // パスワードによる保護を回避するために共有情報はコピーしない
          content: shareInfo.allowDownload ? fileInfo.content : undefined,
        },
      },
    });
  } catch (error) {
    console.error('共有情報取得エラー:', error);
    return NextResponse.json(
      { success: false, error: '共有情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * ファイルを共有
 */
export async function POST(request: NextRequest) {
  try {
    const fileService = FileService.getInstance();
    const body = await request.json();
    
    if (!body.fileId) {
      return NextResponse.json(
        { success: false, error: 'ファイルIDが指定されていません' },
        { status: 400 }
      );
    }
    
    const shareInfo = await fileService.shareFile(body.fileId, {
      expiresIn: body.expiresIn,
      password: body.password,
      allowDownload: body.allowDownload,
      allowEdit: body.allowEdit,
    });
    
    if (!shareInfo) {
      return NextResponse.json(
        { success: false, error: 'ファイルの共有に失敗しました' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: shareInfo,
    });
  } catch (error) {
    console.error('ファイル共有エラー:', error);
    return NextResponse.json(
      { success: false, error: 'ファイルの共有に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * 共有を解除
 */
export async function DELETE(request: NextRequest) {
  try {
    const fileService = FileService.getInstance();
    const searchParams = request.nextUrl.searchParams;
    const shareId = searchParams.get('id');
    
    if (!shareId) {
      return NextResponse.json(
        { success: false, error: '共有IDが指定されていません' },
        { status: 400 }
      );
    }
    
    const result = await fileService.unshareFile(shareId);
    
    if (!result) {
      return NextResponse.json(
        { success: false, error: '共有情報が見つかりません' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: '共有を解除しました',
    });
  } catch (error) {
    console.error('共有解除エラー:', error);
    return NextResponse.json(
      { success: false, error: '共有の解除に失敗しました' },
      { status: 500 }
    );
  }
}
