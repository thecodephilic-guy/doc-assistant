"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Icons } from "@/components/common/icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@clerk/nextjs";
import { useChat } from "@/lib/hooks/use-chats";
import { useMessages } from "@/lib/hooks/use-messages";

interface ChatAreaProps {
  chatId: string;
}

export function ChatArea({ chatId }: ChatAreaProps) {
  const { user, isLoaded } = useUser();
  const { chat, loading: chatLoading } = useChat(chatId);
  const { messages, sending, send, setInitialMessages } = useMessages(chatId);
  const [inputValue, setInputValue] = useState("");

  // Load initial messages when chat is loaded
  useEffect(() => {
    if (chat?.messages) {
      setInitialMessages(chat.messages);
    }
  }, [chat, setInitialMessages]);

  const handleSend = async () => {
    if (!inputValue.trim() || sending) return;

    try {
      await send(inputValue);
      setInputValue("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (chatLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Icons.spinner className="w-8 h-8 text-rose-600 animate-spin" />
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-500 dark:text-slate-400">Chat not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-slate-950">
      
      {/* Chat Header */}
      <header className="h-16 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-6 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-50 dark:bg-rose-900/30 rounded-md">
                <Icons.fileText className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
                <h2 className="font-semibold text-slate-800 dark:text-white">{chat.documentName}</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {chat.documentPageCount} pages • {((chat.documentSize || 0) / 1024 / 1024).toFixed(2)} MB
                </p>
            </div>
        </div>
      </header>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4 sm:p-6">
        <div className="max-w-3xl mx-auto space-y-6">
            
            {messages.length === 0 && (
              <div className="text-center py-12">
                <Icons.messageSquare className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-slate-700" />
                <p className="text-slate-500 dark:text-slate-400">
                  Start a conversation about this document
                </p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-4 ${message.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <Avatar className="h-8 w-8 border border-slate-200 dark:border-slate-700">
                  {message.role === "user" ? (
                    isLoaded && user ? (
                      <AvatarImage src={user.imageUrl} alt="User" />
                    ) : (
                      <AvatarFallback className="bg-slate-900 dark:bg-slate-700 text-white text-xs">U</AvatarFallback>
                    )
                  ) : (
                    <AvatarFallback className="bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-xs">AI</AvatarFallback>
                  )}
                </Avatar>
                <div className="space-y-2 max-w-[80%]">
                  <div
                    className={`rounded-2xl p-4 text-sm shadow-sm ${
                      message.role === "user"
                        ? "bg-rose-600 text-white rounded-tr-none"
                        : "bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-tl-none"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 px-2">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {sending && (
              <div className="flex gap-4">
                <Avatar className="h-8 w-8 border border-rose-100 dark:border-slate-700">
                  <AvatarFallback className="bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-xs">AI</AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-tl-none p-4 text-sm text-slate-700 dark:text-slate-300 shadow-sm w-fit">
                    <div className="flex gap-1 items-center h-4">
                      <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce"></span>
                    </div>
                  </div>
                </div>
              </div>
            )}

        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800">
        <div className="max-w-3xl mx-auto relative flex items-center gap-2">
            <Input 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask a question about your document..." 
                className="pr-12 py-6 text-base bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus-visible:ring-rose-500 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                disabled={sending}
            />
            <Button 
                size="icon" 
                onClick={handleSend}
                disabled={!inputValue.trim() || sending}
                className="absolute right-2 h-8 w-8 bg-rose-600 hover:bg-rose-700 rounded-lg transition-all duration-200 disabled:opacity-50 hover:scale-110 active:scale-95"
            >
                {sending ? (
                  <Icons.spinner className="w-4 h-4 text-white animate-spin" />
                ) : (
                  <Icons.arrowRight className="w-4 h-4 text-white" strokeWidth={2.5} />
                )}
            </Button>
        </div>
        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-2">
            AI can make mistakes. Please verify important information.
        </p>
      </div>

    </div>
  );
}