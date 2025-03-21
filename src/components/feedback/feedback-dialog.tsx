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
import { Button } from '@/components/ui/button';
import { ThumbsUp, MessageCircle } from 'lucide-react';
import { FeedbackForm } from './feedback-form';
import { toast } from '@/components/ui/use-toast';

export function FeedbackDialog() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: any) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('フィードバックの送信に失敗しました');
      }

      toast({
        title: 'フィードバックが送信されました',
        description: 'ご意見をいただきありがとうございます',
        variant: 'default',
      });
      setOpen(false);
    } catch (error) {
      console.error('フィードバック送信エラー:', error);
      toast({
        title: 'エラーが発生しました',
        description: 'フィードバックの送信に失敗しました。後でもう一度お試しください。',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          <span>フィードバック</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>フィードバックを送信</DialogTitle>
          <DialogDescription>
            Manus Clone の改善にご協力ください。バグレポート、機能リクエスト、質問などを送信できます。
          </DialogDescription>
        </DialogHeader>

        <FeedbackForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />

        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
          <Button 
            variant="ghost" 
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            キャンセル
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
