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
    console.log('Syncing Ollama models...');
    // Ollamaから最新のモデルリストを取得
    const ollamaModels = await listOllamaModels();
    
    if (ollamaModels.length === 0) {
      console.warn('No Ollama models found');
      return [];
    }

    console.log(`Found ${ollamaModels.length} Ollama models: ${ollamaModels.map(m => m.name).join(', ')}`);

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
          console.log(`Added new model to database: ${model.name}`);
        }
      }
      
      // 現在選択されているモデルが存在するか確認
      const selectedModel = await getSelectedOllamaModel();
      
      // 選択されたモデルがない場合は、最初のモデルを自動選択
      if (!selectedModel && ollamaModels.length > 0) {
        await setDefaultOllamaModel(ollamaModels[0].name);
        console.log(`Auto-selected default model: ${ollamaModels[0].name}`);
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
    const models = await prisma.ollamaModel.findMany({
      where: { isDetected: true },
      orderBy: { name: 'asc' }
    });
    
    // モデルがなければ新しく同期する
    if (models.length === 0) {
      console.log('No detected models in database, trying to sync with Ollama');
      return await syncOllamaModels();
    }
    
    return models;
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
    console.log(`Setting default Ollama model to: ${modelName}`);
    
    // モデルが存在するか確認
    const model = await prisma.ollamaModel.findUnique({
      where: { name: modelName }
    });
    
    if (!model) {
      console.warn(`Model ${modelName} not found in database`);
      
      // モデルがデータベースにない場合は同期を試みる
      const availableModels = await syncOllamaModels();
      if (availableModels.length === 0) {
        throw new Error(`Model ${modelName} not found and no models available`);
      }
      
      // 指定のモデルが同期後も見つからなければ最初のモデルを使用
      const syncedModel = availableModels.find(m => m.name === modelName);
      if (!syncedModel) {
        console.log(`Using first available model instead: ${availableModels[0].name}`);
        modelName = availableModels[0].name;
      }
    }
    
    // UserSettingsテーブルにレコードがなければ作成
    const settingsCount = await prisma.userSettings.count();
    
    if (settingsCount === 0) {
      await prisma.userSettings.create({
        data: {
          selectedModel: modelName
        }
      });
      console.log('Created new UserSettings with selected model');
    } else {
      // 最初のレコードを更新（シングルトンとして扱う）
      const settings = await prisma.userSettings.findFirst();
      if (settings) {
        await prisma.userSettings.update({
          where: { id: settings.id },
          data: { selectedModel: modelName }
        });
        console.log('Updated existing UserSettings with selected model');
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
      console.log('No selected model in settings, attempting to auto-select');
      // 選択されたモデルがない場合、利用可能なモデルから最初のものを自動選択
      const availableModels = await getDetectedOllamaModels();
      
      if (availableModels.length > 0) {
        console.log(`Auto-selecting first available model: ${availableModels[0].name}`);
        await setDefaultOllamaModel(availableModels[0].name);
        return availableModels[0];
      }
      
      console.warn('No models available to auto-select');
      return null;
    }
    
    // 対応するモデル詳細を取得
    const model = await prisma.ollamaModel.findUnique({
      where: { name: settings.selectedModel }
    });
    
    // 選択されたモデルが検出されなくなった場合、新しいモデルを自動選択
    if (!model || !model.isDetected) {
      console.log('Selected model no longer detected, attempting to find another model');
      const availableModels = await getDetectedOllamaModels();
      
      if (availableModels.length > 0) {
        console.log(`Selecting alternative model: ${availableModels[0].name}`);
        await setDefaultOllamaModel(availableModels[0].name);
        return availableModels[0];
      }
      
      console.warn('No alternative models available');
      return null;
    }
    
    console.log(`Using selected model: ${model.name}`);
    return model;
  } catch (error) {
    console.error('Error getting selected Ollama model:', error);
    return null;
  }
}
