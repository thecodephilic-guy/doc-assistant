"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/common/icons";
import { ChatSidebar } from "./chat/chat-sidebar";
import { ChatArea } from "./chat/chat-area";
import { ChatPlaceholder } from "./chat/chat-placeholder";
import { UploadModal } from "./upload-modal";
import { useChats } from "@/hooks/use-chats";
import type { Document } from "@/lib/types";
import { useUser, RedirectToSignUp } from "@clerk/nextjs";
import { ClientPageWrapper } from "../common/client-page-wrapper";
import { useRouter } from "next/navigation";

function Dashboard() {
  const router = useRouter();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const { createChat } = useChats();
  const { isLoaded, isSignedIn } = useUser();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/");
    }
  }, [isSignedIn, isLoaded, router]);

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

  //prevent flickers:
  if (!isLoaded) return null;

  return (
    <ClientPageWrapper>
      {isSignedIn ? (
        <>
          <div className="flex h-[calc(100vh-70px)] w-full bg-slate-50 dark:bg-slate-900/50">
            {/* DESKTOP SIDEBAR */}
            <aside className="hidden lg:block w-80 h-full">
              <ChatSidebar
                onSelectChat={handleSelectChat}
                selectedId={selectedChatId}
                onNewChat={handleNewChat}
              />
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 flex flex-col h-full relative overflow-hidden transition-all">
              {/* MOBILE HEADER */}
              <div className="lg:hidden flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 z-10">
                <div className="flex items-center gap-2">
                  <Sheet
                    open={isMobileNavOpen}
                    onOpenChange={setIsMobileNavOpen}
                  >
                    <SheetTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="-ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Icons.menu className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent
                      side="left"
                      className="p-0 w-80 border-r border-slate-200 dark:border-slate-800 bg-slate-50"
                    >
                      <SheetTitle className="text-sm p-4 pb-0">
                        YOUR SESSIONS
                      </SheetTitle>
                      <div className="sr-only">
                        <SheetDescription>
                          Access your chat history and start new document chats.
                        </SheetDescription>
                      </div>
                      <ChatSidebar
                        onSelectChat={handleSelectChat}
                        selectedId={selectedChatId}
                        onNewChat={handleNewChat}
                      />
                    </SheetContent>
                  </Sheet>
                  <span className="font-semibold text-slate-800 dark:text-white">
                    ← Your Chats
                  </span>
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
      ) : (
        <RedirectToSignUp />
      )}
    </ClientPageWrapper>
  );
}

export default Dashboard;
