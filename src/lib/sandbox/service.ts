/**
 * サンドボックス環境のサービス層
 * Windows上での実行環境を安全に提供する
 */

import { executeWindowsCommand } from '@/lib/windows/utils';
import prisma from '@/lib/prisma/client';
import { v4 as uuidv4 } from 'uuid';

// サンドボックスのコマンド実行結果
export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  command: string;
  timestamp: Date;
}

// サンドボックスセッション情報
export interface SandboxSessionInfo {
  id: string;
  name: string;
  createdAt: Date;
  status: 'active' | 'inactive';
}

// コマンド実行履歴
export interface CommandHistory {
  commands: {
    command: string;
    timestamp: Date;
    result?: {
      stdout: string;
      stderr: string;
      exitCode: number;
    }
  }[];
}

/**
 * 新しいサンドボックスセッションを作成する
 */
export async function createSandboxSession(name: string = 'New Session'): Promise<SandboxSessionInfo> {
  try {
    const session = await prisma.sandboxSession.create({
      data: {
        name,
        commands: JSON.stringify([]),
        outputs: JSON.stringify([])
      }
    });

    return {
      id: session.id,
      name: session.name || name,
      createdAt: session.createdAt,
      status: 'active'
    };
  } catch (error) {
    console.error('Error creating sandbox session:', error);
    throw new Error('Failed to create sandbox session');
  }
}

/**
 * サンドボックスセッションの一覧を取得する
 */
export async function getSandboxSessions(): Promise<SandboxSessionInfo[]> {
  try {
    const sessions = await prisma.sandboxSession.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return sessions.map(session => ({
      id: session.id,
      name: session.name || 'Untitled Session',
      createdAt: session.createdAt,
      status: 'active' // ステータスは現在すべて'active'
    }));
  } catch (error) {
    console.error('Error getting sandbox sessions:', error);
    return [];
  }
}

/**
 * サンドボックスセッションを取得する
 */
export async function getSandboxSession(sessionId: string): Promise<SandboxSessionInfo | null> {
  try {
    const session = await prisma.sandboxSession.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      return null;
    }

    return {
      id: session.id,
      name: session.name || 'Untitled Session',
      createdAt: session.createdAt,
      status: 'active'
    };
  } catch (error) {
    console.error(`Error getting sandbox session ${sessionId}:`, error);
    return null;
  }
}

/**
 * サンドボックスセッションのコマンド履歴を取得する
 */
export async function getCommandHistory(sessionId: string): Promise<CommandHistory> {
  try {
    const session = await prisma.sandboxSession.findUnique({
      where: { id: sessionId }
    });

    if (!session || !session.commands) {
      return { commands: [] };
    }

    try {
      const commands = JSON.parse(session.commands);
      const outputs = session.outputs ? JSON.parse(session.outputs) : [];
      
      // コマンドと出力を結合
      return {
        commands: commands.map((cmd: any, index: number) => ({
          command: cmd.command,
          timestamp: new Date(cmd.timestamp),
          result: outputs[index]
        }))
      };
    } catch (e) {
      console.error('Error parsing command history:', e);
      return { commands: [] };
    }
  } catch (error) {
    console.error(`Error getting command history for session ${sessionId}:`, error);
    return { commands: [] };
  }
}

/**
 * サンドボックス内でコマンドを実行する
 */
export async function executeCommand(sessionId: string, command: string): Promise<CommandResult> {
  try {
    // セッションの存在を確認
    const session = await prisma.sandboxSession.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // コマンド実行（実際の実装ではサンドボックス内で実行）
    const result = await executeWindowsCommand(command);
    
    // 実行時間を記録
    const timestamp = new Date();
    
    // 履歴に保存するコマンド情報
    const commandInfo = {
      command,
      timestamp: timestamp.toISOString()
    };
    
    // 結果情報
    const resultInfo = {
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode
    };
    
    // 既存の履歴を取得して更新
    let commands = [];
    let outputs = [];
    
    try {
      if (session.commands) {
        commands = JSON.parse(session.commands);
      }
      if (session.outputs) {
        outputs = JSON.parse(session.outputs);
      }
    } catch (e) {
      console.warn('Error parsing existing commands/outputs:', e);
    }
    
    // 新しいコマンドと結果を追加
    commands.push(commandInfo);
    outputs.push(resultInfo);
    
    // セッションを更新
    await prisma.sandboxSession.update({
      where: { id: sessionId },
      data: {
        commands: JSON.stringify(commands),
        outputs: JSON.stringify(outputs),
        updatedAt: timestamp
      }
    });
    
    // 結果を返す
    return {
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
      command,
      timestamp
    };
  } catch (error) {
    console.error(`Error executing command in session ${sessionId}:`, error);
    throw error;
  }
}

/**
 * サンドボックスセッションを削除する
 */
export async function deleteSandboxSession(sessionId: string): Promise<boolean> {
  try {
    await prisma.sandboxSession.delete({
      where: { id: sessionId }
    });
    return true;
  } catch (error) {
    console.error(`Error deleting sandbox session ${sessionId}:`, error);
    return false;
  }
}

/**
 * セッション名を更新する
 */
export async function updateSessionName(sessionId: string, name: string): Promise<boolean> {
  try {
    await prisma.sandboxSession.update({
      where: { id: sessionId },
      data: { name }
    });
    return true;
  } catch (error) {
    console.error(`Error updating session name for ${sessionId}:`, error);
    return false;
  }
}
