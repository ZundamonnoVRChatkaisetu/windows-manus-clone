/**
 * このファイルはPrismaのenumをアプリケーション全体で使用するために
 * タイプセーフなエクスポートを提供します。
 * SQLiteはenum型をサポートしていないため、文字列定数を使用しています。
 */

import {
  TaskStatus,
  TaskPriority,
  LogLevel,
  FeedbackType,
  FeedbackStatus
} from '../../../prisma/enums';

// サービス層やコンポーネントで使用するためにエクスポート
export {
  TaskStatus,
  TaskPriority,
  LogLevel,
  FeedbackType,
  FeedbackStatus
};

// バリデーション用のヘルパー関数
export const isValidTaskStatus = (status: string): status is TaskStatus => {
  return Object.values(TaskStatus).includes(status as TaskStatus);
};

export const isValidTaskPriority = (priority: string): priority is TaskPriority => {
  return Object.values(TaskPriority).includes(priority as TaskPriority);
};

export const isValidLogLevel = (level: string): level is LogLevel => {
  return Object.values(LogLevel).includes(level as LogLevel);
};

export const isValidFeedbackType = (type: string): type is FeedbackType => {
  return Object.values(FeedbackType).includes(type as FeedbackType);
};

export const isValidFeedbackStatus = (status: string): status is FeedbackStatus => {
  return Object.values(FeedbackStatus).includes(status as FeedbackStatus);
};
