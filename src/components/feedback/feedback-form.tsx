'use client';

import React, { useState } from 'react';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Send, Loader2 } from 'lucide-react';

// フィードバックフォームのバリデーションスキーマ
const feedbackFormSchema = z.object({
  type: z.enum(['BUG', 'FEATURE_REQUEST', 'GENERAL', 'IMPROVEMENT', 'QUESTION'], {
    required_error: 'フィードバックの種類を選択してください',
  }),
  content: z.string().min(10, {
    message: '10文字以上入力してください',
  }).max(1000, {
    message: '1000文字以内で入力してください',
  }),
  email: z.string().email({
    message: '有効なメールアドレスを入力してください',
  }).optional().or(z.literal('')),
  rating: z.number().min(1).max(5).optional(),
});

type FeedbackFormValues = z.infer<typeof feedbackFormSchema>;

interface FeedbackFormProps {
  onSubmit: (values: FeedbackFormValues) => void;
  isSubmitting: boolean;
}

export function FeedbackForm({ onSubmit, isSubmitting }: FeedbackFormProps) {
  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: {
      type: 'GENERAL',
      content: '',
      email: '',
      rating: 3,
    },
  });

  const handleSubmit = (values: FeedbackFormValues) => {
    // メタデータを追加
    const metadata = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      screenSize: `${window.screen.width}x${window.screen.height}`,
      locale: navigator.language,
      timestamp: new Date().toISOString(),
    };

    onSubmit({ ...values, metadata });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>フィードバックの種類</FormLabel>
              <Select 
                disabled={isSubmitting}
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="種類を選択" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="BUG">バグ報告</SelectItem>
                  <SelectItem value="FEATURE_REQUEST">機能リクエスト</SelectItem>
                  <SelectItem value="IMPROVEMENT">改善提案</SelectItem>
                  <SelectItem value="QUESTION">質問</SelectItem>
                  <SelectItem value="GENERAL">一般的なフィードバック</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>フィードバック内容</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="ご意見、提案、質問などを入力してください" 
                  className="h-32 resize-none"
                  disabled={isSubmitting}
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                1000文字以内で入力してください
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem>
              <FormLabel>評価</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  defaultValue={field.value?.toString()}
                  className="flex items-center space-x-2"
                  disabled={isSubmitting}
                >
                  {[1, 2, 3, 4, 5].map((value) => (
                    <FormItem key={value} className="flex items-center space-x-1">
                      <FormControl>
                        <RadioGroupItem value={value.toString()} />
                      </FormControl>
                      <Label>{value}</Label>
                    </FormItem>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormDescription>
                1: 非常に不満 - 5: 非常に満足
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>メールアドレス (任意)</FormLabel>
              <FormControl>
                <Input 
                  placeholder="例: email@example.com" 
                  type="email"
                  disabled={isSubmitting}
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                返信が必要な場合のみ入力してください
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              送信中...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              フィードバックを送信
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}