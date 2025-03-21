import React, { useState, useEffect } from 'react';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { FileTemplate } from '@/lib/files';
import { getFileExtension, getMimeType } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, FileText, PlusCircle, FileCode } from 'lucide-react';

// フォームのバリデーションスキーマ
const createFileSchema = z.object({
  name: z.string().min(1, 'ファイル名は必須です'),
  content: z.string().optional(),
  path: z.string().optional(),
});

interface FileCreateDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onFileCreate?: (fileData: {
    name: string;
    content: string;
    path?: string;
    type?: string;
    templateId?: string;
    variables?: Record<string, string>;
  }) => void;
  defaultPath?: string;
  templates?: FileTemplate[];
  isLoading?: boolean;
  children?: React.ReactNode;
}

export function FileCreateDialog({
  open,
  onOpenChange,
  onFileCreate,
  defaultPath = '/',
  templates = [],
  isLoading = false,
  children,
}: FileCreateDialogProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('blank');
  const [selectedTemplate, setSelectedTemplate] = useState<FileTemplate | null>(null);
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  
  const form = useForm<z.infer<typeof createFileSchema>>({
    resolver: zodResolver(createFileSchema),
    defaultValues: {
      name: '',
      content: '',
      path: defaultPath,
    },
  });

  // テンプレートが変更されたときにフォームをリセット
  useEffect(() => {
    if (activeTab === 'template' && selectedTemplate) {
      // 変数のデフォルト値を設定
      const variables: Record<string, string> = {};
      if (selectedTemplate.variables) {
        Object.entries(selectedTemplate.variables).forEach(([key, value]) => {
          variables[key] = value;
        });
      }
      setTemplateVariables(variables);
      
      // ファイル名にデフォルト拡張子を追加
      form.setValue('name', `new-file.${selectedTemplate.extension}`);
    } else if (activeTab === 'blank') {
      form.setValue('name', 'new-file.txt');
      form.setValue('content', '');
    }
  }, [activeTab, selectedTemplate, form]);

  // テンプレート変更時の処理
  const handleTemplateChange = (templateId: string) => {
    const template = templates.find(t => t.id === templateId) || null;
    setSelectedTemplate(template);
  };

  // 送信処理
  const onSubmit = (values: z.infer<typeof createFileSchema>) => {
    try {
      const fileName = values.name;
      const extension = getFileExtension(fileName);
      const mimeType = getMimeType(extension);
      
      if (activeTab === 'template' && selectedTemplate) {
        // テンプレートからファイルを作成
        onFileCreate?.({
          name: fileName,
          content: '', // APIで置換される
          path: values.path,
          type: mimeType,
          templateId: selectedTemplate.id,
          variables: templateVariables,
        });
      } else {
        // 通常のファイルを作成
        onFileCreate?.({
          name: fileName,
          content: values.content || '',
          path: values.path,
          type: mimeType,
        });
      }
      
      // フォームをリセット
      form.reset();
      
      // ダイアログを閉じる
      if (onOpenChange) {
        onOpenChange(false);
      }
    } catch (error) {
      console.error('ファイル作成エラー:', error);
      toast({
        title: 'エラー',
        description: 'ファイルの作成に失敗しました',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>新規ファイル作成</DialogTitle>
          <DialogDescription>
            新しいファイルを作成します。テンプレートから作成するか、空のファイルを作成するかを選択してください。
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="blank" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="blank">
              <FileText className="h-4 w-4 mr-2" />
              空のファイル
            </TabsTrigger>
            <TabsTrigger value="template" disabled={templates.length === 0}>
              <FileCode className="h-4 w-4 mr-2" />
              テンプレート
            </TabsTrigger>
          </TabsList>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <TabsContent value="blank" className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ファイル名</FormLabel>
                      <FormControl>
                        <Input placeholder="ファイル名" {...field} />
                      </FormControl>
                      <FormDescription>
                        拡張子を含めたファイル名を入力してください
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="path"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>保存先</FormLabel>
                      <FormControl>
                        <Input placeholder="ファイルの保存先" {...field} />
                      </FormControl>
                      <FormDescription>
                        パスを指定しない場合はルートディレクトリに保存されます
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>内容</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="ファイルの内容"
                          className="min-h-[200px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              
              <TabsContent value="template" className="space-y-4">
                <div className="grid gap-4">
                  <FormItem>
                    <FormLabel>テンプレート</FormLabel>
                    <Select
                      onValueChange={handleTemplateChange}
                      defaultValue=""
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="テンプレートを選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {selectedTemplate?.description || 'テンプレートを選択してください'}
                    </FormDescription>
                  </FormItem>
                  
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ファイル名</FormLabel>
                        <FormControl>
                          <Input placeholder="ファイル名" {...field} />
                        </FormControl>
                        <FormDescription>
                          拡張子を含めたファイル名を入力してください
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="path"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>保存先</FormLabel>
                        <FormControl>
                          <Input placeholder="ファイルの保存先" {...field} />
                        </FormControl>
                        <FormDescription>
                          パスを指定しない場合はルートディレクトリに保存されます
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {selectedTemplate && selectedTemplate.variables && (
                    <div className="space-y-4 border p-4 rounded-md bg-muted/50">
                      <h3 className="text-sm font-medium">テンプレート変数</h3>
                      {Object.entries(selectedTemplate.variables).map(([key, defaultValue]) => (
                        <div key={key} className="grid gap-2">
                          <label htmlFor={`var-${key}`} className="text-sm">
                            {key}
                          </label>
                          <Input
                            id={`var-${key}`}
                            value={templateVariables[key] || defaultValue}
                            onChange={(e) => 
                              setTemplateVariables({
                                ...templateVariables,
                                [key]: e.target.value,
                              })
                            }
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <DialogFooter className="pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onOpenChange?.(false)}
                  disabled={isLoading}
                >
                  キャンセル
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      作成中...
                    </>
                  ) : (
                    <>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      作成
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
