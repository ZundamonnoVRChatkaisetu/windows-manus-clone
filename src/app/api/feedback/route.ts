import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// フィードバックのバリデーションスキーマ
const feedbackSchema = z.object({
  type: z.enum(['BUG', 'FEATURE_REQUEST', 'GENERAL', 'IMPROVEMENT', 'QUESTION']),
  content: z.string().min(10).max(1000),
  email: z.string().email().optional().or(z.literal('')),
  rating: z.number().min(1).max(5).optional(),
  metadata: z.any().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // バリデーション
    const validatedData = feedbackSchema.parse(body);
    
    // メタデータがある場合は文字列に変換
    if (validatedData.metadata) {
      validatedData.metadata = JSON.stringify(validatedData.metadata);
    }

    // Prismaを使用してフィードバックを保存
    const feedback = await prisma.feedback.create({
      data: {
        type: validatedData.type,
        content: validatedData.content,
        email: validatedData.email || null,
        rating: validatedData.rating || null,
        metadata: validatedData.metadata || null,
        status: 'NEW',
      },
    });

    return NextResponse.json({ success: true, data: feedback }, { status: 201 });
  } catch (error) {
    console.error('フィードバック保存エラー:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'バリデーションエラー', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'フィードバックの保存に失敗しました' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// フィードバック一覧を取得するエンドポイント（管理者用）
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // クエリフィルター
    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;

    // フィードバック一覧を取得
    const [feedback, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.feedback.count({ where }),
    ]);

    // ページネーション情報
    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;

    return NextResponse.json({
      data: feedback,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore,
      },
    });
  } catch (error) {
    console.error('フィードバック取得エラー:', error);
    return NextResponse.json(
      { success: false, error: 'フィードバックの取得に失敗しました' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
