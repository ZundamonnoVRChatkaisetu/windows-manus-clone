'use client';

import React from 'react';
import { MainLayout } from '@/components/layout';
import { BrowserView } from '@/components/browser';

export default function BrowserPage() {
  return (
    <MainLayout>
      <div className="h-[calc(100vh-4rem)] p-4">
        <BrowserView initialUrl="https://www.google.com" className="h-full" />
      </div>
    </MainLayout>
  );
}
