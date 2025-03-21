'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Menu, Sun, Moon, User } from 'lucide-react';
import { useTheme } from 'next-themes';

interface HeaderProps {
  className?: string;
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

export function Header({ 
  className, 
  onMenuClick, 
  showMenuButton = false 
}: HeaderProps) {
  const { theme, setTheme } = useTheme();
  
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header
      className={cn(
        'flex h-16 items-center justify-between border-b px-4 bg-background',
        className
      )}
    >
      <div className="flex items-center">
        {showMenuButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="md:hidden mr-2"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">メニューを開く</span>
          </Button>
        )}
        <div className="flex items-center">
          <h1 className="text-lg font-semibold md:text-xl">Windows Manus Clone</h1>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleTheme}
          title={theme === 'dark' ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
          <span className="sr-only">
            {theme === 'dark' ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
          </span>
        </Button>

        <Button 
          variant="ghost" 
          size="icon"
          title="ユーザー設定"
        >
          <User className="h-5 w-5" />
          <span className="sr-only">ユーザー設定</span>
        </Button>
      </div>
    </header>
  );
}