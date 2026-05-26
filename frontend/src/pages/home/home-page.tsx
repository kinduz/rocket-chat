'use client';

import { ChatWindow } from '@app/widgets/chat-window';
import { ChatsSidebar } from '@app/widgets/chats-sidebar';
import { useEffect, useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

export function HomePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-full w-full" />;
  }

  return (
    <PanelGroup
      direction="horizontal"
      autoSaveId="home-layout"
      className="h-full w-full"
    >
      <Panel id="sidebar" order={1} defaultSize={28} minSize={6}>
        <ChatsSidebar />
      </Panel>

      <PanelResizeHandle className="data-[resize-handle-state=drag]:bg-selected w-0.5 bg-white/5 transition-colors" />

      <Panel id="main" order={2} defaultSize={72} minSize={50}>
        <ChatWindow />
      </Panel>
    </PanelGroup>
  );
}
