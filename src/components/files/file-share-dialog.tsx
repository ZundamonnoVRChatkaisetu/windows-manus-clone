import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { FileInfo, FileShareInfo } from '@/lib/files';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Share, Copy, Check, Clock, Eye, Download, Link2 } from 'lucide-react';

// フォームのバリデーションスキーマ
const shareFormSchema = z.object({
  expiresIn: z.string().optional(),
  password: z.string().optional(),
  allowDownload: z.boolean().default(true),
  allowEdit: z.boolean().default(false),
});

interface FileShareDialogProps {
  file?: FileInfo;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onShareFile?: (fileId: string, options: {
    expiresIn?: number;
    password?: string;
    allowDownload?: boolean;
    allowEdit?: boolean;
  }) => Promise<FileShareInfo | null>;
  isLoading?: boolean;
  children?: React.ReactNode;
}

export function FileShareDialog({
  file,
  open,
  onOpenChange,
  onShareFile,
  isLoading = false,
  children,
}: FileShareDialogProps) {
  const { toast } = useToast();
  const [shareInfo, setShareInfo] = useState<FileShareInfo | null>(null);
  const [copied, setCopied] = useState(false);
  
  const form = useForm<z.infer<typeof shareFormSchema>>({
    resolver: zodResolver(shareFormSchema),
    defaultValues: {
      expiresIn: '86400', // 1日（秒）
      password: '',
      allowDownload: true,
      allowEdit: false,
    },
  });

  // 送信処理
  const onSubmit = async (values: z.infer<typeof shareFormSchema>) => {
    if (!file) return;
    
    try {
      const options = {
        expiresIn: values.expiresIn ? parseInt(values.expiresIn) : undefined,
        password: values.password || undefined,
        allowDownload: values.allowDownload,
        allowEdit: values.allowEdit,
      };
      
      const result = await onShareFile?.(file.id, options);
      
      if (result) {
        setShareInfo(result);
        toast({
          title: 'ファイルを共有しました',
          description: 'URLをコピーしてファイルを共有できます',
        });
      }
    } catch (error) {
      console.error('ファイル共有エラー:', error);
      toast({
        title: 'エラー',
        description: 'ファイルの共有に失敗しました',
        variant: 'destructive',
      });
    }
  };

  // URLをコピー
  const copyToClipboard = () => {
    if (!shareInfo) return;
    
    navigator.clipboard.writeText(shareInfo.url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      toast({
        title: 'URLをコピーしました',
        description: 'クリップボードにコピーされました',
      });
    }).catch(err => {
      console.error('URLのコピーに失敗しました:', err);
      toast({
        title: 'エラー',
        description: 'URLのコピーに失敗しました',
        variant: 'destructive',
      });
    });
  };

  // 有効期限のオプション
  const expiryOptions = [
    { value: '3600', label: '1時間' },
    { value: '86400', label: '1日' },
    { value: '604800', label: '1週間' },
    { value: '2592000', label: '30日' },
    { value: '', label: '無期限' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>ファイルを共有</DialogTitle>
          <DialogDescription>
            {file ? (
              <>「{file.name}」を共有するための設定を行います</>
            ) : (
              <>ファイルを共有するための設定を行います</>
            )}
          </DialogDescription>
        </DialogHeader>

        {shareInfo ? (
          <div className="space-y-4">
            <div className="p-4 border rounded-md bg-muted/50">
              <h3 className="font-medium mb-2">共有URL</h3>
              <div className="flex">
                <Input 
                  value={shareInfo.url} 
                  readOnly 
                  className="flex-1 pr-10"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="ml-2"
                  onClick={copyToClipboard}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {shareInfo.expiresAt && (
                <div className="flex items-start gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">有効期限</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(shareInfo.expiresAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {shareInfo.password && (
                <div className="flex items-start gap-2">
                  <Eye className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">パスワード保護</p>
                    <p className="text-sm text-muted-foreground">
                      パスワードで保護されています
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2">
                <Download className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">ダウンロード</p>
                  <p className="text-sm text-muted-foreground">
                    {shareInfo.allowDownload ? '許可' : '不許可'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Link2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">共有ID</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {shareInfo.id}
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button onClick={() => onOpenChange?.(false)}>
                閉じる
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="expiresIn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>有効期限</FormLabel>
                    <FormControl>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="有効期限を選択" />
                        </SelectTrigger>
                        <SelectContent>
                          {expiryOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      共有リンクの有効期限を設定します
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>パスワード (任意)</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="パスワードを設定" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      共有ファイルへのアクセスにパスワードを要求します
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="allowDownload"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>ダウンロードを許可</FormLabel>
                      <FormDescription>
                        閲覧者がファイルをダウンロードできるようにします
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="allowEdit"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>編集を許可</FormLabel>
                      <FormDescription>
                        閲覧者がファイルを編集できるようにします
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <DialogFooter className="pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onOpenChange?.(false)}
                  disabled={isLoading}
                >
                  キャンセル
                </Button>
                <Button type="submit" disabled={isLoading || !file}>
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      共有中...
                    </>
                  ) : (
                    <>
                      <Share className="h-4 w-4 mr-2" />
                      共有
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
