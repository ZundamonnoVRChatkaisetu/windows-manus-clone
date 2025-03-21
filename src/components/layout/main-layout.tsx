'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Sidebar } from './sidebar';
import { Header } from './header';

interface MainLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function MainLayout({ children, className }: MainLayoutProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // ウィンドウサイズに基づいてモバイルビューかどうかを検出
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // 初期チェック
    checkIsMobile();

    // リサイズイベントリスナーを追加
    window.addEventListener('resize', checkIsMobile);

    // クリーンアップ
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const closeMobileSidebar = () => {
    setIsMobileOpen(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* サイドバー (デスクトップでは固定、モバイルでは切り替え可能) */}
      <Sidebar 
        isMobile={isMobile} 
        isOpen={isMobileOpen}
        onClose={closeMobileSidebar}
        className={cn(isMobile ? 'shadow-lg' : '')}
      />

      {/* モバイルサイドバーオーバーレイ */}
      {isMobile && isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm transition-opacity"
          onClick={closeMobileSidebar}
        />
      )}

      {/* メインコンテンツエリア */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header 
          showMenuButton={isMobile} 
          onMenuClick={toggleMobileSidebar} 
        />
        
        <main className={cn(
          'flex-1 overflow-auto p-4 md:p-6',
          className
        )}>
          {children}
        </main>
      </div>
    </div>
  );
}