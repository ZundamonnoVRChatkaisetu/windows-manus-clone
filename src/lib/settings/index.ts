'use client';

// 設定データの型定義
export interface AppSettings {
  selectedModel: string;
  developerMode: boolean;
  notificationsEnabled: boolean;
  theme: 'light' | 'dark' | 'system';
}

// デフォルト設定
export const DEFAULT_SETTINGS: AppSettings = {
  selectedModel: 'llama3:8b-instruct-q4_0',
  developerMode: false,
  notificationsEnabled: true,
  theme: 'system',
};

const SETTINGS_KEY = 'manus_app_settings';

/**
 * 設定をローカルストレージから読み込む
 */
export function loadSettings(): AppSettings {
  if (typeof window === 'undefined') {
    return DEFAULT_SETTINGS;
  }
  
  try {
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (savedSettings) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) };
    }
  } catch (error) {
    console.error('設定の読み込みに失敗しました:', error);
  }
  
  return DEFAULT_SETTINGS;
}

/**
 * 設定をローカルストレージに保存する
 */
export function saveSettings(settings: Partial<AppSettings>): AppSettings {
  if (typeof window === 'undefined') {
    return DEFAULT_SETTINGS;
  }
  
  try {
    const currentSettings = loadSettings();
    const updatedSettings = { ...currentSettings, ...settings };
    
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updatedSettings));
    return updatedSettings;
  } catch (error) {
    console.error('設定の保存に失敗しました:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * 設定の一部を更新する
 */
export function updateSetting<K extends keyof AppSettings>(
  key: K, 
  value: AppSettings[K]
): AppSettings {
  return saveSettings({ [key]: value } as Partial<AppSettings>);
}

/**
 * 現在選択されているOllamaモデルを取得する
 */
export function getSelectedModel(): string {
  return loadSettings().selectedModel;
}

/**
 * ページのテーマ設定を取得する
 */
export function getThemeSetting(): 'light' | 'dark' | 'system' {
  return loadSettings().theme;
}

/**
 * 開発者モードの状態を取得する
 */
export function isDeveloperMode(): boolean {
  return loadSettings().developerMode;
}

/**
 * 通知設定の状態を取得する
 */
export function areNotificationsEnabled(): boolean {
  return loadSettings().notificationsEnabled;
}
