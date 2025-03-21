import { NextRequest, NextResponse } from 'next/server';
import { VSCodeCommand } from '@/lib/vscode';

/**
 * VSCodeコントローラーAPI
 * フロントエンドからのリクエストを受け取り、VSCodeを操作するAPIルート
 */

/**
 * VSCodeの状態を取得
 */
export async function GET() {
  try {
    // 実際の実装では、VSCodeServiceから状態を取得する
    const mockState = {
      isOpen: true,
      isConnected: true,
      isExecuting: false,
      path: 'C:/projects/my-project',
      files: [
        {
          path: 'C:/projects/my-project/index.js',
          name: 'index.js',
          extension: 'js',
          isOpen: true,
          isActive: true,
          isModified: false,
        },
        {
          path: 'C:/projects/my-project/app.js',
          name: 'app.js',
          extension: 'js',
          isOpen: true,
          isActive: false,
          isModified: true,
        },
      ],
      activeFile: 'C:/projects/my-project/index.js',
      logs: [
        {
          id: '1',
          timestamp: new Date(),
          message: 'VSCodeに接続しました',
          level: 'info',
        },
      ],
    };

    return NextResponse.json({ success: true, data: mockState });
  } catch (error) {
    console.error('VSCode状態取得エラー:', error);
    return NextResponse.json(
      { success: false, error: 'VSCodeの状態取得に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * VSCodeに接続または起動
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, options } = body;

    // 実際の実装では、VSCodeServiceを使用する
    let response;
    
    switch (action) {
      case 'connect':
        response = {
          success: true,
          message: 'VSCodeに接続しました',
          data: { isConnected: true },
        };
        break;
        
      case 'disconnect':
        response = {
          success: true,
          message: 'VSCodeから切断しました',
          data: { isConnected: false },
        };
        break;
        
      case 'open':
        response = {
          success: true,
          message: `VSCodeを開きました${options?.path ? `: ${options.path}` : ''}`,
          data: { isOpen: true, path: options?.path },
        };
        break;
        
      case 'close':
        response = {
          success: true,
          message: 'VSCodeを閉じました',
          data: { isOpen: false },
        };
        break;
        
      default:
        return NextResponse.json(
          { success: false, error: '無効なアクション' },
          { status: 400 }
        );
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('VSCode操作エラー:', error);
    return NextResponse.json(
      { success: false, error: 'VSCodeの操作に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * VSCodeでコマンドを実行
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { command, options } = body;

    // 実際の実装では、VSCodeServiceを使用する
    // 受け取ったコマンドの種類に応じた処理
    let response;
    
    switch (command) {
      case VSCodeCommand.OPEN_FILE:
        response = {
          success: true,
          message: `ファイルを開きました: ${options?.args?.[0]}`,
          timestamp: new Date(),
        };
        break;
        
      case VSCodeCommand.OPEN_FOLDER:
        response = {
          success: true,
          message: `フォルダを開きました: ${options?.args?.[0]}`,
          timestamp: new Date(),
        };
        break;
        
      case VSCodeCommand.SAVE_FILE:
        response = {
          success: true,
          message: `ファイルを保存しました: ${options?.args?.[0] || '現在のファイル'}`,
          timestamp: new Date(),
        };
        break;
        
      case VSCodeCommand.NEW_FILE:
        response = {
          success: true,
          message: `新規ファイルを作成しました`,
          timestamp: new Date(),
        };
        break;
        
      case VSCodeCommand.SEARCH:
        response = {
          success: true,
          message: `検索を実行しました: ${JSON.stringify(options?.args?.[0])}`,
          timestamp: new Date(),
          data: {
            results: [
              { file: 'index.js', line: 10, text: 'console.log("Hello")' },
              { file: 'app.js', line: 15, text: 'console.log("World")' },
            ],
          },
        };
        break;
        
      case VSCodeCommand.RUN_CODE:
        response = {
          success: true,
          message: `コードを実行しました`,
          timestamp: new Date(),
          data: {
            output: 'Hello, World!\n',
          },
        };
        break;
        
      default:
        if (typeof command === 'string') {
          response = {
            success: true,
            message: `コマンドを実行しました: ${command}`,
            timestamp: new Date(),
          };
        } else {
          return NextResponse.json(
            { success: false, error: '無効なコマンド' },
            { status: 400 }
          );
        }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('VSCodeコマンド実行エラー:', error);
    return NextResponse.json(
      { success: false, error: 'VSCodeでのコマンド実行に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * VSCodeのファイル内容を更新
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { path, content } = body;

    if (!path || content === undefined) {
      return NextResponse.json(
        { success: false, error: 'ファイルパスと内容が必要です' },
        { status: 400 }
      );
    }

    // 実際の実装では、VSCodeServiceを使用する
    const response = {
      success: true,
      message: `ファイル内容を更新しました: ${path}`,
      timestamp: new Date(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('VSCodeファイル更新エラー:', error);
    return NextResponse.json(
      { success: false, error: 'VSCodeのファイル更新に失敗しました' },
      { status: 500 }
    );
  }
}
