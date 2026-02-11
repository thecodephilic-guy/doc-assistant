"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/common/icons";
import { ChatSidebar } from "./chat/chat-sidebar";
import { ChatArea } from "./chat/chat-area";
import { ChatPlaceholder } from "./chat/chat-placeholder";
import { UploadModal } from "./upload-modal";
import { useChats } from "@/lib/hooks/use-chats";
import type { Document } from "@/lib/types";

function Dashboard() {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const { createChat } = useChats();

  // Handler for selecting a document (creates a new chat session)
  const handleSelectDocument = async (document: Document) => {
    try {
      const chat = await createChat(document.id);
      setSelectedChatId(chat.id);
    } catch (error) {
      console.error("Failed to create chat:", error);
    }
  };

  // Handler for selecting an existing chat
  const handleSelectChat = (id: string) => {
    setSelectedChatId(id);
    setIsMobileNavOpen(false);
  };

  // Handler for new chat button
  const handleNewChat = () => {
    setSelectedChatId(null);
    setIsMobileNavOpen(false);
  };

  return (
    <>
      <div className="flex h-[calc(100vh-70px)] w-full bg-slate-50 dark:bg-slate-900/50">
        
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden lg:block w-80 border-r border-slate-200 dark:border-slate-800 h-full bg-slate-50/50 dark:bg-slate-900/50">
          <ChatSidebar 
            onSelectChat={handleSelectChat} 
            selectedId={selectedChatId}
            onNewChat={handleNewChat}
          />
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 flex flex-col h-full relative overflow-hidden transition-all">
          
          {/* MOBILE HEADER */}
          <div className="lg:hidden flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
              <div className="flex items-center gap-2">
                  <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
                      <SheetTrigger asChild>
                          <Button variant="ghost" size="icon" className="-ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                              <Icons.menu className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                          </Button>
                      </SheetTrigger>
                      <SheetContent side="left" className="p-0 w-80 border-r border-slate-200 dark:border-slate-800">
                          <ChatSidebar 
                            onSelectChat={handleSelectChat} 
                            selectedId={selectedChatId}
                            onNewChat={handleNewChat}
                          />
                      </SheetContent>
                  </Sheet>
                  <span className="font-semibold text-slate-800 dark:text-white">Doc Assistant</span>
              </div>
          </div>

          {/* LOGIC: Show Placeholder OR Chat Area */}
          {selectedChatId ? (
              <ChatArea chatId={selectedChatId} />
          ) : (
              <ChatPlaceholder onSelectDocument={handleSelectDocument} />
          )}
          
        </main>
      </div>

      {/* Upload Modal (can be triggered from anywhere) */}
      <UploadModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        onSuccess={handleSelectDocument}
      />
    </>
  );
}

export default Dashboard;