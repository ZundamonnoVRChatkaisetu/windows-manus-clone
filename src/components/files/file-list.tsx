import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileInfo } from '@/lib/files';
import { 
  ChevronDown, 
  Download, 
  Edit, 
  FileText, 
  MoreHorizontal, 
  Share, 
  Trash, 
  Eye,
  FileCode,
  FileImage,
  FileSpreadsheet,
  FilePdf,
  FileArchive
} from 'lucide-react';
import { formatFileSize, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface FileListProps {
  files: FileInfo[];
  isLoading?: boolean;
  onSelect?: (file: FileInfo) => void;
  onEdit?: (file: FileInfo) => void;
  onDelete?: (file: FileInfo) => void;
  onShare?: (file: FileInfo) => void;
  onDownload?: (file: FileInfo) => void;
  onPreview?: (file: FileInfo) => void;
  className?: string;
}

export function FileList({
  files,
  isLoading = false,
  onSelect,
  onEdit,
  onDelete,
  onShare,
  onDownload,
  onPreview,
  className,
}: FileListProps) {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [sortColumn, setSortColumn] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // ファイル一覧をソート
  const sortedFiles = [...files].sort((a, b) => {
    let aValue = a[sortColumn as keyof FileInfo];
    let bValue = b[sortColumn as keyof FileInfo];
    
    // 文字列の場合は小文字に変換
    if (typeof aValue === 'string') {
      aValue = (aValue as string).toLowerCase();
    }
    if (typeof bValue === 'string') {
      bValue = (bValue as string).toLowerCase();
    }
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // ソート切り替え
  const handleSortClick = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // 全選択/解除
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFiles(files.map(file => file.id));
    } else {
      setSelectedFiles([]);
    }
  };

  // 単一選択/解除
  const handleSelectFile = (fileId: string, checked: boolean) => {
    if (checked) {
      setSelectedFiles([...selectedFiles, fileId]);
    } else {
      setSelectedFiles(selectedFiles.filter(id => id !== fileId));
    }
  };

  // ファイルタイプに応じたアイコンを取得
  const getFileIcon = (file: FileInfo) => {
    const type = file.type;
    const ext = file.extension.toLowerCase();

    if (type.startsWith('image/')) {
      return <FileImage className="h-4 w-4 text-blue-500" />;
    } else if (type.includes('pdf')) {
      return <FilePdf className="h-4 w-4 text-red-500" />;
    } else if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'c', 'cpp', 'cs', 'go', 'rb', 'php'].includes(ext)) {
      return <FileCode className="h-4 w-4 text-green-500" />;
    } else if (['xls', 'xlsx', 'csv'].includes(ext)) {
      return <FileSpreadsheet className="h-4 w-4 text-green-600" />;
    } else if (['zip', 'rar', 'tar', 'gz'].includes(ext)) {
      return <FileArchive className="h-4 w-4 text-yellow-500" />;
    } else {
      return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  // ファイルの種類に応じたバッジの色を取得
  const getFileTypeBadge = (file: FileInfo) => {
    const type = file.type;
    const ext = file.extension.toLowerCase();

    if (type.startsWith('image/')) {
      return { label: '画像', className: 'bg-blue-500' };
    } else if (type.includes('pdf')) {
      return { label: 'PDF', className: 'bg-red-500' };
    } else if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'c', 'cpp', 'cs', 'go', 'rb', 'php'].includes(ext)) {
      return { label: 'コード', className: 'bg-green-500' };
    } else if (['xls', 'xlsx', 'csv'].includes(ext)) {
      return { label: 'スプレッドシート', className: 'bg-green-600' };
    } else if (['zip', 'rar', 'tar', 'gz'].includes(ext)) {
      return { label: 'アーカイブ', className: 'bg-yellow-500' };
    } else if (['txt', 'md', 'html', 'css'].includes(ext)) {
      return { label: 'テキスト', className: 'bg-gray-500' };
    } else {
      return { label: 'その他', className: 'bg-gray-500' };
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-48">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground text-center">
          ファイルがありません。<br />
          新しいファイルを作成してください。
        </p>
      </div>
    );
  }

  return (
    <div className={cn('border rounded-md', className)}>
      <ScrollArea className="h-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedFiles.length === files.length}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead className="w-12"></TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSortClick('name')}
              >
                <div className="flex items-center">
                  名前
                  {sortColumn === 'name' && (
                    <ChevronDown 
                      className={cn("ml-1 h-4 w-4", sortDirection === 'desc' && "rotate-180")} 
                    />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSortClick('type')}
              >
                <div className="flex items-center">
                  種類
                  {sortColumn === 'type' && (
                    <ChevronDown 
                      className={cn("ml-1 h-4 w-4", sortDirection === 'desc' && "rotate-180")} 
                    />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSortClick('size')}
              >
                <div className="flex items-center">
                  サイズ
                  {sortColumn === 'size' && (
                    <ChevronDown 
                      className={cn("ml-1 h-4 w-4", sortDirection === 'desc' && "rotate-180")} 
                    />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSortClick('updatedAt')}
              >
                <div className="flex items-center">
                  更新日時
                  {sortColumn === 'updatedAt' && (
                    <ChevronDown 
                      className={cn("ml-1 h-4 w-4", sortDirection === 'desc' && "rotate-180")} 
                    />
                  )}
                </div>
              </TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedFiles.map((file) => {
              const isSelected = selectedFiles.includes(file.id);
              const badge = getFileTypeBadge(file);

              return (
                <TableRow 
                  key={file.id}
                  className={cn(
                    'cursor-pointer hover:bg-accent hover:text-accent-foreground',
                    isSelected && 'bg-accent text-accent-foreground'
                  )}
                  onClick={() => onSelect?.(file)}
                >
                  <TableCell className="p-2">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => handleSelectFile(file.id, !!checked)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Select ${file.name}`}
                    />
                  </TableCell>
                  <TableCell className="p-2">
                    {getFileIcon(file)}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{file.name}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-xs">
                      {file.path}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={badge.className}>{badge.label}</Badge>
                  </TableCell>
                  <TableCell>{formatFileSize(file.size)}</TableCell>
                  <TableCell>{formatDate(file.updatedAt)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          onPreview?.(file);
                        }}>
                          <Eye className="mr-2 h-4 w-4" />
                          プレビュー
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          onEdit?.(file);
                        }}>
                          <Edit className="mr-2 h-4 w-4" />
                          編集
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          onDownload?.(file);
                        }}>
                          <Download className="mr-2 h-4 w-4" />
                          ダウンロード
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          onShare?.(file);
                        }}>
                          <Share className="mr-2 h-4 w-4" />
                          共有
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-500"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete?.(file);
                          }}
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          削除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}
