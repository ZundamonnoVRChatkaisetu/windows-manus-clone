import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  MessageSquare, 
  ListTodo, 
  Globe, 
  Code, 
  Settings, 
  Menu, 
  X 
} from 'lucide-react';
import Link from 'next/link';

// サイドバーのナビゲーション項目の型定義
type NavItem = {
  title: string;
  href: string;
  icon: React.ReactNode;
};

// ナビゲーション項目のリスト
const navItems: NavItem[] = [
  {
    title: 'チャット',
    href: '/chat',
    icon: <MessageSquare className="h-5 w-5" />,
  },
  {
    title: 'タスク',
    href: '/tasks',
    icon: <ListTodo className="h-5 w-5" />,
  },
  {
    title: 'ブラウザ',
    href: '/browser',
    icon: <Globe className="h-5 w-5" />,
  },
  {
    title: 'エディタ',
    href: '/editor',
    icon: <Code className="h-5 w-5" />,
  },
  {
    title: '設定',
    href: '/settings',
    icon: <Settings className="h-5 w-5" />,
  },
];

interface SidebarProps {
  className?: string;
  isMobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ 
  className, 
  isMobile = false, 
  isOpen = true, 
  onClose 
}: SidebarProps) {
  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-background border-r',
        isMobile 
          ? 'fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-200 ease-in-out' +
            (isOpen ? ' translate-x-0' : ' -translate-x-full')
          : 'w-64 sticky top-0',
        className
      )}
    >
      {/* サイドバーヘッダー */}
      <div className="flex items-center justify-between h-16 px-4 border-b">
        <h2 className="text-xl font-semibold">Manus Clone</h2>
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* ナビゲーション */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link 
            key={item.href} 
            href={item.href} 
            className="flex items-center px-3 py-2 text-base rounded-md hover:bg-accent hover:text-accent-foreground"
          >
            {item.icon}
            <span className="ml-3">{item.title}</span>
          </Link>
        ))}
      </nav>

      {/* サイドバーフッター */}
      <div className="p-4 border-t">
        <div className="text-sm text-muted-foreground">
          Windows Manus Clone v0.1.0
        </div>
      </div>
    </aside>
  );
}
