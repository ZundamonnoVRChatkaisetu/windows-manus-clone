/**
 * SQLiteでは列挙型がサポートされていないため、
 * 文字列定数を使用して疑似的な列挙型を定義します。
 */

// タスクのステータス
export const TaskStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
} as const;

export type TaskStatus = typeof TaskStatus[keyof typeof TaskStatus];

// タスクの優先度
export const TaskPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;

export type TaskPriority = typeof TaskPriority[keyof typeof TaskPriority];

// ログレベル
export const LogLevel = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
  CRITICAL: 'CRITICAL',
} as const;

export type LogLevel = typeof LogLevel[keyof typeof LogLevel];

// フィードバックタイプ
export const FeedbackType = {
  BUG: 'BUG',
  FEATURE_REQUEST: 'FEATURE_REQUEST',
  GENERAL: 'GENERAL',
  IMPROVEMENT: 'IMPROVEMENT',
  QUESTION: 'QUESTION',
} as const;

export type FeedbackType = typeof FeedbackType[keyof typeof FeedbackType];

// フィードバックステータス
export const FeedbackStatus = {
  NEW: 'NEW',
  IN_REVIEW: 'IN_REVIEW',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
  SPAM: 'SPAM',
} as const;

export type FeedbackStatus = typeof FeedbackStatus[keyof typeof FeedbackStatus];
