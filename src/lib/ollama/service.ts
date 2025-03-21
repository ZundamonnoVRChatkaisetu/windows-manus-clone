/**
 * Ollamaサービス - DBとOllamaクライアントを連携する
 */

import prisma from '@/lib/prisma/client';
import { checkOllamaConnection, listOllamaModels } from './client';

/**
 * Ollamaサーバーに接続できるかチェックし、結果を返す
 */
export async function checkOllamaAvailability(): Promise<boolean> {
  return await checkOllamaConnection();
}

/**
 * Ollamaから利用可能なモデルを取得し、DBに保存する
 * 更新されたモデルリストを返す
 */
export async function syncOllamaModels() {
  try {
    // Ollamaから最新のモデルリストを取得
    const ollamaModels = await listOllamaModels();
    
    if (ollamaModels.length === 0) {
      console.warn('No Ollama models found');
      return [];
    }

    // 現在DBに保存されているモデルを取得
    const existingModels = await prisma.ollamaModel.findMany();
    
    // DBに存在するモデル名のセットを作成
    const existingModelNames = new Set(existingModels.map(model => model.name));
    
    // トランザクションを開始
    await prisma.$transaction(async (tx) => {
      // 既存のモデルで、Ollamaにないものは削除する（非検出マーク）
      await tx.ollamaModel.updateMany({
        where: {
          name: {
            notIn: ollamaModels.map(model => model.name)
          },
          isDetected: true // 自動検出されたモデルのみ対象
        },
        data: {
          isDetected: false
        }
      });
      
      // 各Ollamaモデルをデータベースに追加・更新
      for (const model of ollamaModels) {
        if (existingModelNames.has(model.name)) {
          // 既存モデルの更新
          await tx.ollamaModel.update({
            where: { name: model.name },
            data: {
              modified: new Date(model.modified),
              size: BigInt(model.size),
              quantization: model.quantization,
              parameterSize: model.parameterSize,
              format: model.format,
              family: model.family,
              displayName: model.displayName,
              isDetected: true
            }
          });
        } else {
          // 新しいモデルの追加
          await tx.ollamaModel.create({
            data: {
              name: model.name,
              modified: new Date(model.modified),
              size: BigInt(model.size),
              quantization: model.quantization,
              parameterSize: model.parameterSize,
              format: model.format,
              family: model.family,
              displayName: model.displayName,
              isDetected: true
            }
          });
        }
      }
      
      // 現在選択されているモデルが存在するか確認
      const selectedModel = await getSelectedOllamaModel();
      
      // 選択されたモデルがない場合は、最初のモデルを自動選択
      if (!selectedModel && ollamaModels.length > 0) {
        await setDefaultOllamaModel(ollamaModels[0].name);
      }
    });
    
    // 更新後のモデルリストを返す
    return await prisma.ollamaModel.findMany({
      where: { isDetected: true },
      orderBy: { name: 'asc' }
    });
  } catch (error) {
    console.error('Error syncing Ollama models:', error);
    return [];
  }
}

/**
 * 検出されたOllamaモデルの一覧を取得する
 */
export async function getDetectedOllamaModels() {
  try {
    return await prisma.ollamaModel.findMany({
      where: { isDetected: true },
      orderBy: { name: 'asc' }
    });
  } catch (error) {
    console.error('Error getting Ollama models:', error);
    return [];
  }
}

/**
 * ユーザー設定でデフォルトのOllamaモデルを設定する
 */
export async function setDefaultOllamaModel(modelName: string) {
  try {
    // モデルが存在するか確認
    const model = await prisma.ollamaModel.findUnique({
      where: { name: modelName }
    });
    
    if (!model) {
      throw new Error(`Model ${modelName} not found`);
    }
    
    // UserSettingsテーブルにレコードがなければ作成
    const settingsCount = await prisma.userSettings.count();
    
    if (settingsCount === 0) {
      await prisma.userSettings.create({
        data: {
          selectedModel: modelName
        }
      });
    } else {
      // 最初のレコードを更新（シングルトンとして扱う）
      const settings = await prisma.userSettings.findFirst();
      if (settings) {
        await prisma.userSettings.update({
          where: { id: settings.id },
          data: { selectedModel: modelName }
        });
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error setting default Ollama model:', error);
    return false;
  }
}

/**
 * 現在選択されているOllamaモデルを取得する
 * モデルが選択されていない場合、最初に見つかったモデルを自動選択する
 */
export async function getSelectedOllamaModel() {
  try {
    // まず設定が存在するか確認
    const settingsCount = await prisma.userSettings.count();
    
    // 設定がない場合は作成
    if (settingsCount === 0) {
      console.log('Creating new UserSettings record');
      await prisma.userSettings.create({
        data: {} // デフォルト値を使用
      });
    }
    
    const settings = await prisma.userSettings.findFirst();
    
    if (!settings || !settings.selectedModel) {
      // 選択されたモデルがない場合、利用可能なモデルから最初のものを自動選択
      const availableModels = await getDetectedOllamaModels();
      
      if (availableModels.length > 0) {
        await setDefaultOllamaModel(availableModels[0].name);
        return availableModels[0];
      }
      
      return null;
    }
    
    // 対応するモデル詳細を取得
    const model = await prisma.ollamaModel.findUnique({
      where: { name: settings.selectedModel }
    });
    
    // 選択されたモデルが検出されなくなった場合、新しいモデルを自動選択
    if (!model || !model.isDetected) {
      const availableModels = await getDetectedOllamaModels();
      
      if (availableModels.length > 0) {
        await setDefaultOllamaModel(availableModels[0].name);
        return availableModels[0];
      }
      
      return null;
    }
    
    return model;
  } catch (error) {
    console.error('Error getting selected Ollama model:', error);
    return null;
  }
}
