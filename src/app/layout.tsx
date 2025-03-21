import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { syncOllamaModels } from '@/lib/ollama/service';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Windows Manus Clone',
  description: 'Windows環境で動作するManus AIのクローン',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
};

// アプリ起動時にモデルを同期して初期設定
syncOllamaModels().catch(error => {
  console.warn('Initial Ollama models sync failed:', error);
  console.warn('This is normal if Ollama is not running. Will try again later.');
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
