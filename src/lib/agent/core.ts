/**
 * AIエージェントコアモジュール
 * 
 * タスクの自動実行を担当するAIエージェントのコア機能を提供します。
 * マルチエージェントシステムの中央調整エージェントとして機能し、
 * さまざまなサブタスクを専門化されたエージェントに割り当てます。
 */

import { OllamaMessage, OllamaChatParams, generateChatResponse, streamChatResponse } from '@/lib/ollama/client';
import { getSelectedOllamaModel } from '@/lib/ollama/service';
import prisma from '@/lib/prisma/client';
import { executeCommand } from '@/lib/sandbox/service';

// エージェントの種類
export enum AgentType {
  CENTRAL = 'central',   // 中央調整エージェント
  PLANNER = 'planner',   // タスク分解と計画エージェント
  BROWSER = 'browser',   // ブラウザ操作エージェント
  CODER = 'coder',       // コード生成エージェント
  VSCODE = 'vscode',     // VSCode操作エージェント
  CONTENT = 'content',   // コンテンツ生成エージェント
  FILE = 'file',         // ファイル操作エージェント
  SYSTEM = 'system',     // システム操作エージェント
}

// タスクの状態更新イベント
export interface TaskStatusEvent {
  taskId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  message?: string;
  progress?: number;
  subTaskId?: string;
}

// エージェントからのアクション要求
export interface AgentAction {
  type: 'browser' | 'sandbox' | 'vscode' | 'file' | 'system';
  action: string;
  params: any;
}

// エージェントの内部状態
interface AgentState {
  taskId: string;
  subTaskId?: string;
  messages: OllamaMessage[];
  status: 'idle' | 'thinking' | 'executing' | 'waiting' | 'completed' | 'failed';
  history: {
    action: AgentAction;
    result: any;
    timestamp: Date;
  }[];
}

/**
 * 中央調整エージェントのシステムプロンプト
 */
const CENTRAL_AGENT_SYSTEM_PROMPT = `あなたはWindows環境で動作する自律型AIエージェント「Manus AI」です。
ユーザーが提供したタスクを理解し、それを複数のサブタスクに分解して効率的に実行します。
各サブタスクの実行には、専門化されたエージェントを使用します。

1. タスクの理解: ユーザーの指示を理解し、必要なら明確化の質問をします。
2. 計画立案: タスクを実行可能なサブタスクに分解し、実行順序を決定します。
3. タスク実行: サブタスクを順次実行し、実行状況をユーザーに報告します。
4. 結果報告: 最終的な結果をユーザーに提示します。

あなたは以下のツールを使用できます:
- ブラウザ自動化: ウェブサイトの閲覧、フォーム入力、ダウンロードなど
- サンドボックス環境: Windows PowerShellコマンドの実行
- VSCode操作: コードの編集、実行、デバッグ
- ファイル操作: ファイルの作成、読み取り、書き込み、削除

常に安全かつ効率的にタスクを完了し、明確で詳細な説明を提供してください。`;

/**
 * 新しいタスクを作成し、中央AIエージェントにタスクを割り当てる
 */
export async function createTask(title: string, description?: string) {
  try {
    // タスクをデータベースに作成
    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: 'PENDING',
      }
    });

    // タスク分解を開始
    await startTaskPlanning(task.id, title, description);

    return task;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
}

/**
 * タスク計画を開始する
 */
async function startTaskPlanning(taskId: string, title: string, description?: string) {
  try {
    // タスクのステータスを更新
    await prisma.task.update({
      where: { id: taskId },
      data: { status: 'IN_PROGRESS' }
    });

    // タスク計画用のプロンプトを準備
    const planningPrompt = `
タスク: ${title}
${description ? `詳細: ${description}` : ''}

このタスクを完了するための計画を作成してください。タスクを複数のサブタスクに分解し、各サブタスクの実行順序と依存関係を特定してください。`;

    // 選択されたモデルを取得
    const selectedModel = await getSelectedOllamaModel();
    if (!selectedModel) {
      throw new Error('No Ollama model selected');
    }

    // タスク計画用のメッセージを準備
    const messages: OllamaMessage[] = [
      { role: 'system', content: CENTRAL_AGENT_SYSTEM_PROMPT },
      { role: 'user', content: planningPrompt }
    ];

    // Ollamaのパラメータ設定
    const params: OllamaChatParams = {
      model: selectedModel.name,
      messages,
      options: {
        temperature: 0.7,
      }
    };

    // AIからの応答を取得
    const response = await generateChatResponse(params);

    // サブタスクを解析して作成
    const subTasks = parseSubTasksFromResponse(response.message.content);
    
    // サブタスクをデータベースに登録
    for (let i = 0; i < subTasks.length; i++) {
      await prisma.subTask.create({
        data: {
          title: subTasks[i].title,
          description: subTasks[i].description,
          status: 'PENDING',
          order: i,
          taskId,
        }
      });
    }

    // タスクログに計画を記録
    await prisma.taskLog.create({
      data: {
        taskId,
        message: '計画作成完了',
        level: 'INFO',
        metadata: JSON.stringify({
          plan: response.message.content,
          subTaskCount: subTasks.length,
        })
      }
    });

    // 最初のサブタスクを開始
    await executeNextSubTask(taskId);

  } catch (error) {
    console.error(`Error planning task ${taskId}:`, error);
    
    // エラーをログに記録
    await prisma.taskLog.create({
      data: {
        taskId,
        message: `タスク計画中にエラー発生: ${error instanceof Error ? error.message : String(error)}`,
        level: 'ERROR'
      }
    });
    
    // タスクをエラー状態に更新
    await prisma.task.update({
      where: { id: taskId },
      data: { status: 'FAILED' }
    });
  }
}

/**
 * AI応答からサブタスクを解析する簡易的な実装
 */
function parseSubTasksFromResponse(content: string): Array<{ title: string; description?: string }> {
  const subTasks: Array<{ title: string; description?: string }> = [];
  
  // 行ごとに分割
  const lines = content.split('\n');
  
  // サブタスクを表す行を検索（番号付きリストを想定）
  let currentTitle = '';
  let currentDescription = '';
  
  for (const line of lines) {
    // 新しいサブタスクの開始を検出
    const taskMatch = line.match(/^\d+\.\s(.+)$/);
    if (taskMatch) {
      // 前のサブタスクがあれば保存
      if (currentTitle) {
        subTasks.push({
          title: currentTitle,
          description: currentDescription.trim() || undefined
        });
      }
      
      // 新しいサブタスクを開始
      currentTitle = taskMatch[1].trim();
      currentDescription = '';
    } 
    // サブタスクの説明の一部と判断
    else if (currentTitle && line.trim()) {
      if (currentDescription) {
        currentDescription += '\n';
      }
      currentDescription += line.trim();
    }
  }
  
  // 最後のサブタスクを追加
  if (currentTitle) {
    subTasks.push({
      title: currentTitle,
      description: currentDescription.trim() || undefined
    });
  }
  
  return subTasks;
}

/**
 * 次のサブタスクを実行する
 */
async function executeNextSubTask(taskId: string) {
  try {
    // 保留中の次のサブタスクを取得
    const nextSubTask = await prisma.subTask.findFirst({
      where: {
        taskId,
        status: 'PENDING'
      },
      orderBy: {
        order: 'asc'
      }
    });
    
    // すべてのサブタスクが完了している場合
    if (!nextSubTask) {
      // タスク全体を完了状態に更新
      await prisma.task.update({
        where: { id: taskId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date()
        }
      });
      
      // 完了ログを記録
      await prisma.taskLog.create({
        data: {
          taskId,
          message: 'すべてのサブタスクが完了しました',
          level: 'INFO'
        }
      });
      
      return;
    }
    
    // サブタスクのステータスを更新
    await prisma.subTask.update({
      where: { id: nextSubTask.id },
      data: { status: 'IN_PROGRESS' }
    });
    
    // サブタスク開始ログを記録
    await prisma.taskLog.create({
      data: {
        taskId,
        subTaskId: nextSubTask.id,
        message: `サブタスク「${nextSubTask.title}」を開始`,
        level: 'INFO'
      }
    });
    
    // 選択されたモデルを取得
    const selectedModel = await getSelectedOllamaModel();
    if (!selectedModel) {
      throw new Error('No Ollama model selected');
    }
    
    // サブタスク用メッセージの作成
    const messages: OllamaMessage[] = [
      { role: 'system', content: CENTRAL_AGENT_SYSTEM_PROMPT },
      { role: 'user', content: `次のサブタスクを実行してください:
タイトル: ${nextSubTask.title}
${nextSubTask.description ? `説明: ${nextSubTask.description}` : ''}

どのようなアプローチで実行するか詳細に説明し、必要なツールを使用して完了してください。` }
    ];
    
    // Ollamaのパラメータ設定
    const params: OllamaChatParams = {
      model: selectedModel.name,
      messages,
      options: {
        temperature: 0.7,
      }
    };
    
    // AIからの応答を取得
    const response = await generateChatResponse(params);
    
    // 結果を解析し、サブタスクを完了としてマーク
    await prisma.subTask.update({
      where: { id: nextSubTask.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      }
    });
    
    // サブタスク完了ログを記録
    await prisma.taskLog.create({
      data: {
        taskId,
        subTaskId: nextSubTask.id,
        message: `サブタスク「${nextSubTask.title}」を完了`,
        level: 'INFO',
        metadata: JSON.stringify({
          response: response.message.content
        })
      }
    });
    
    // 次のサブタスクを実行
    await executeNextSubTask(taskId);
    
  } catch (error) {
    console.error(`Error executing subtask for task ${taskId}:`, error);
    
    // 現在実行中のサブタスクを取得
    const currentSubTask = await prisma.subTask.findFirst({
      where: {
        taskId,
        status: 'IN_PROGRESS'
      }
    });
    
    if (currentSubTask) {
      // サブタスクをエラー状態に更新
      await prisma.subTask.update({
        where: { id: currentSubTask.id },
        data: { status: 'FAILED' }
      });
      
      // エラーログを記録
      await prisma.taskLog.create({
        data: {
          taskId,
          subTaskId: currentSubTask.id,
          message: `サブタスク実行中にエラー発生: ${error instanceof Error ? error.message : String(error)}`,
          level: 'ERROR'
        }
      });
    }
    
    // タスク全体をエラー状態に更新
    await prisma.task.update({
      where: { id: taskId },
      data: { status: 'FAILED' }
    });
  }
}

/**
 * タスクの実行をキャンセルする
 */
export async function cancelTask(taskId: string): Promise<boolean> {
  try {
    // タスクが存在するか確認
    const task = await prisma.task.findUnique({
      where: { id: taskId }
    });
    
    if (!task) {
      return false;
    }
    
    // キャンセル可能な状態かチェック
    if (task.status === 'COMPLETED' || task.status === 'FAILED' || task.status === 'CANCELLED') {
      return false;
    }
    
    // タスクとサブタスクをキャンセル状態に更新
    await prisma.$transaction([
      prisma.task.update({
        where: { id: taskId },
        data: { status: 'CANCELLED' }
      }),
      prisma.subTask.updateMany({
        where: {
          taskId,
          status: { in: ['PENDING', 'IN_PROGRESS'] }
        },
        data: { status: 'CANCELLED' }
      })
    ]);
    
    // キャンセルログを記録
    await prisma.taskLog.create({
      data: {
        taskId,
        message: 'タスクがキャンセルされました',
        level: 'INFO'
      }
    });
    
    return true;
  } catch (error) {
    console.error(`Error cancelling task ${taskId}:`, error);
    return false;
  }
}

/**
 * タスクの情報を取得する
 */
export async function getTaskInfo(taskId: string) {
  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        subTasks: {
          orderBy: { order: 'asc' }
        }
      }
    });
    
    if (!task) {
      return null;
    }
    
    return task;
  } catch (error) {
    console.error(`Error getting task info ${taskId}:`, error);
    return null;
  }
}

/**
 * タスクのログを取得する
 */
export async function getTaskLogs(taskId: string) {
  try {
    return await prisma.taskLog.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.error(`Error getting task logs ${taskId}:`, error);
    return [];
  }
}

/**
 * すべてのタスクを取得する
 */
export async function getAllTasks() {
  try {
    return await prisma.task.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        subTasks: {
          orderBy: { order: 'asc' }
        }
      }
    });
  } catch (error) {
    console.error('Error getting all tasks:', error);
    return [];
  }
}
