"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { ChatSidebar } from "./chat-sidebar";
import { ChatArea } from "./chat-area";
import { ChatPlaceholder } from "./chat-placeholder"; // Import the new component

function Dashboard() {
  // STATE: null = No chat selected (Show Placeholder). string = Chat ID (Show ChatArea)
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Handler for creating a new chat (Upload)
  const handleUploadNew = () => {
    // In real app: Open upload modal -> wait for upload -> set ID
    console.log("Opening upload dialog...");
    setSelectedChatId("new-session-id"); // Mock: Switch to chat immediately
  };

  // Handler for selecting an existing chat
  const handleSelectChat = (id: string) => {
    setSelectedChatId(id);
    setIsMobileNavOpen(false); // Close mobile menu if open
  };

  return (
    <div className="flex h-[calc(100vh-80px)] w-full bg-slate-50">
      
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:block w-80 border-r border-slate-200 h-full bg-slate-50/50">
        <ChatSidebar onSelectChat={handleSelectChat} selectedId={selectedChatId} />
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden transition-all">
        
        {/* MOBILE HEADER */}
        <div className="lg:hidden flex items-center p-4 border-b border-slate-200 bg-white">
            <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="-ml-2">
                        <Menu className="w-6 h-6 text-slate-600" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-80">
                    <ChatSidebar onSelectChat={handleSelectChat} selectedId={selectedChatId} />
                </SheetContent>
            </Sheet>
            <span className="font-semibold ml-2 text-slate-800">Doc Assistant</span>
        </div>

        {/* LOGIC: Show Placeholder OR Chat Area */}
        {selectedChatId ? (
            <ChatArea />
        ) : (
            <ChatPlaceholder 
                onUpload={handleUploadNew} 
                onSelect={handleSelectChat} 
            />
        )}
        
      </main>
    </div>
  );
}

export default Dashboard;