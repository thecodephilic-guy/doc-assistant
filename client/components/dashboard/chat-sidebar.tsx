"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Icons } from "@/components/common/icons";
import { cn } from "@/lib/utils";

const MOCK_CHATS = [
  { id: "1", title: "Clean Code.pdf", date: "2 mins ago" },
  { id: "2", title: "Project Requirements.pdf", date: "1 hour ago" },
  { id: "3", title: "Financial_Report_Q3.pdf", date: "1 day ago" },
];

interface ChatSidebarProps {
  className?: string;
  selectedId?: string | null;
  onSelectChat?: (id: string) => void;
}

export function ChatSidebar({ className, selectedId, onSelectChat }: ChatSidebarProps) {
  return (
    <div className={cn("flex flex-col h-full bg-slate-50 border-r border-slate-200", className)}>
      
      {/* Header */}
      <div className="p-4">
        <Button 
            onClick={() => onSelectChat?.("new")} // Mock: triggers new chat
            className="w-full bg-rose-600 hover:bg-rose-700 text-white shadow-sm gap-2"
        >
          <Icons.newChat className="w-4 h-4" />
          <span>New Chat</span>
        </Button>
      </div>

      <Separator className="bg-slate-200" />

      {/* List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Your Sessions
          </div>
          
          {MOCK_CHATS.map((chat) => (
            <button
              key={chat.id}
              onClick={() => onSelectChat?.(chat.id)}
              className={cn(
                "w-full text-left px-3 py-3 rounded-lg flex items-center gap-3 transition-all group border border-transparent",
                selectedId === chat.id 
                    ? "bg-white shadow-sm border-slate-100 ring-1 ring-slate-200/50" 
                    : "hover:bg-white hover:shadow-sm hover:border-slate-100"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                selectedId === chat.id
                    ? "bg-rose-600 text-white"
                    : "bg-rose-100 text-rose-600 group-hover:bg-rose-600 group-hover:text-white"
              )}>
                <Icons.messageSquare className="w-4 h-4" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className={cn(
                    "text-sm font-medium truncate transition-colors",
                    selectedId === chat.id ? "text-slate-900" : "text-slate-700 group-hover:text-slate-900"
                )}>
                  {chat.title}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {chat.date}
                </p>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}