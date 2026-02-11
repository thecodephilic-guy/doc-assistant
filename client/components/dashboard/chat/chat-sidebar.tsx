"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Icons } from "@/components/common/icons";
import { cn } from "@/lib/utils";
import { useChats } from "@/lib/hooks/use-chats";

interface ChatSidebarProps {
  className?: string;
  selectedId?: string | null;
  onSelectChat?: (id: string) => void;
  onNewChat?: () => void;
}

export function ChatSidebar({ className, selectedId, onSelectChat, onNewChat }: ChatSidebarProps) {
  const { chats, loading } = useChats();

  return (
    <div className={cn("flex flex-col h-full bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800", className)}>

      {/* Header */}
      <div className="p-4">
        <Button
          onClick={onNewChat}
          className="w-full bg-rose-600 hover:bg-rose-700 text-white shadow-sm gap-2 transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
        >
          <Icons.newChat className="w-4 h-4" />
          <span>New Chat</span>
        </Button>
      </div>

      <Separator className="bg-slate-200 dark:bg-slate-800" />

      {/* List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          <div className="px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Your Sessions
          </div>

          {loading ? (
            // Loading skeleton
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="w-full px-3 py-3 rounded-lg flex items-center gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                </div>
              </div>
            ))
          ) : chats.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No chat sessions yet
              </p>
            </div>
          ) : (
            chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => onSelectChat?.(chat.id)}
                className={cn(
                  "w-full text-left px-3 py-3 rounded-lg flex items-center gap-3 transition-all duration-200 group border border-transparent",
                  selectedId === chat.id
                    ? "bg-white dark:bg-slate-800 shadow-sm border-slate-100 dark:border-slate-700 ring-1 ring-slate-200/50 dark:ring-slate-700/50 scale-[1.02]"
                    : "hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm hover:border-slate-100 dark:hover:border-slate-700 hover:scale-[1.01]"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
                  selectedId === chat.id
                    ? "bg-rose-600 text-white"
                    : "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 group-hover:bg-rose-600 group-hover:text-white group-hover:scale-110"
                )}>
                  <Icons.messageSquare className="w-4 h-4" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className={cn(
                    "text-sm font-medium truncate transition-colors duration-200",
                    selectedId === chat.id ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white"
                  )}>
                    {chat.documentName}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                    {new Date(chat.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}