/**
 * Windowsファイルシステムの一覧取得API
 */
import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { isValidWindowsPath } from '@/lib/windows/utils';

const execPromise = promisify(exec);

export async function GET(request: NextRequest) {
  // クエリパラメータからパスを取得
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path');
  
  if (!path) {
    return NextResponse.json({ error: 'パスが指定されていません' }, { status: 400 });
  }
  
  // パスの検証
  if (!isValidWindowsPath(path)) {
    return NextResponse.json({ error: '無効なパスが指定されました' }, { status: 400 });
  }
  
  try {
    // PowerShellを使用してファイル情報を取得する
    // PowerShellを使うことで、アクセス許可やファイル属性などの詳細情報も取得できる
    const command = `powershell -Command "
      try {
        $items = Get-ChildItem -Path '${path.replace(/'/g, "''")}' -Force -ErrorAction Stop | 
          Select-Object Name, Extension, FullName, Length, CreationTime, LastWriteTime, LastAccessTime, Attributes, @{
            Name='isHidden';
            Expression={ $_.Attributes -band [System.IO.FileAttributes]::Hidden }
          }, @{
            Name='isDirectory';
            Expression={ $_.PSIsContainer }
          }, @{
            Name='isReadOnly';
            Expression={ $_.Attributes -band [System.IO.FileAttributes]::ReadOnly }
          }, @{
            Name='isSystem';
            Expression={ $_.Attributes -band [System.IO.FileAttributes]::System }
          };
          
        $files = $items | Where-Object { -not $_.isDirectory } | ForEach-Object {
          $owner = (Get-Acl $_.FullName).Owner;
          $_ | Select-Object Name, Extension, FullName, Length, CreationTime, LastWriteTime, LastAccessTime, isHidden, isDirectory, isReadOnly, isSystem, @{
            Name='owner';
            Expression={ $owner }
          }
        };
        
        $directories = $items | Where-Object { $_.isDirectory } | ForEach-Object {
          $owner = (Get-Acl $_.FullName).Owner;
          $_ | Select-Object Name, Extension, FullName, Length, CreationTime, LastWriteTime, LastAccessTime, isHidden, isDirectory, isReadOnly, isSystem, @{
            Name='owner';
            Expression={ $owner }
          }
        };
        
        $result = @{
          path = '${path.replace(/'/g, "''")}';
          files = $files;
          directories = $directories;
        };
        
        ConvertTo-Json -InputObject $result -Depth 5;
      } catch {
        ConvertTo-Json -InputObject @{
          path = '${path.replace(/'/g, "''")}';
          error = $_.Exception.Message;
          files = @();
          directories = @();
        } -Depth 5;
      }
    "`;
    
    const { stdout, stderr } = await execPromise(command);
    
    if (stderr) {
      console.error('PowerShell error:', stderr);
      return NextResponse.json(
        { error: 'ファイル一覧取得中にエラーが発生しました', details: stderr },
        { status: 500 }
      );
    }
    
    // PowerShellの出力をJSONに変換
    const result = JSON.parse(stdout);
    
    // エラーの有無をチェック
    if (result.error) {
      return NextResponse.json(
        { error: result.error, path: result.path, files: [], directories: [] },
        { status: 500 }
      );
    }
    
    // ファイルとディレクトリ情報を整形
    const formattedFiles = (result.files || []).map((file: any) => ({
      fullPath: file.FullName,
      name: file.Name,
      extension: file.Extension || '',
      isDirectory: false,
      isHidden: Boolean(file.isHidden),
      isSystem: Boolean(file.isSystem),
      isReadOnly: Boolean(file.isReadOnly),
      createdAt: new Date(file.CreationTime),
      modifiedAt: new Date(file.LastWriteTime),
      accessedAt: new Date(file.LastAccessTime),
      size: file.Length || 0,
      owner: file.owner || ''
    }));
    
    const formattedDirs = (result.directories || []).map((dir: any) => ({
      fullPath: dir.FullName,
      name: dir.Name,
      extension: '',
      isDirectory: true,
      isHidden: Boolean(dir.isHidden),
      isSystem: Boolean(dir.isSystem),
      isReadOnly: Boolean(dir.isReadOnly),
      createdAt: new Date(dir.CreationTime),
      modifiedAt: new Date(dir.LastWriteTime),
      accessedAt: new Date(dir.LastAccessTime),
      size: 0,
      owner: dir.owner || ''
    }));
    
    return NextResponse.json({
      path: result.path,
      files: formattedFiles,
      directories: formattedDirs
    });
  } catch (error) {
    console.error('ファイル一覧取得エラー:', error);
    return NextResponse.json(
      { 
        error: 'ファイル一覧の取得に失敗しました', 
        details: error instanceof Error ? error.message : String(error),
        path,
        files: [],
        directories: []
      },
      { status: 500 }
    );
  }
}
