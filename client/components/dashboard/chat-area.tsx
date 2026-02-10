"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Icons } from "@/components/common/icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@clerk/nextjs";

export function ChatArea() {
const { user, isLoaded } = useUser();
  return (
    <div className="flex flex-col h-full w-full bg-white">
      
      {/* Chat Header */}
      <header className="h-16 border-b border-slate-100 flex items-center justify-between px-6 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-50 rounded-md">
                <Icons.fileText className="w-5 h-5 text-rose-600" />
            </div>
            <div>
                <h2 className="font-semibold text-slate-800">Clean Code.pdf</h2>
                <p className="text-xs text-slate-500">32 pages • 1.2 MB</p>
            </div>
        </div>
        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-rose-500">
            <Icons.upload className="w-5 h-5" /> {/* Placeholder for 'Export' or 'Clear' */}
        </Button>
      </header>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4 sm:p-6">
        <div className="max-w-3xl mx-auto space-y-6">
            
            {/* AI Message */}
            <div className="flex gap-4">
                <Avatar className="h-8 w-8 border border-rose-100">
                    <AvatarFallback className="bg-rose-100 text-rose-600 text-xs">AI</AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-none p-4 text-sm text-slate-700 shadow-sm">
                        <p>{`Hello! I've analyzed Clean Code.pdf. I can help you summarize key chapters, explain the SOLID principles, or find specific code examples. Where would you like to start?`}</p>
                    </div>
                </div>
            </div>

            {/* User Message */}
            <div className="flex gap-4 flex-row-reverse">
                 <Avatar className="h-8 w-8 border border-slate-200">
                    {isLoaded ? <AvatarImage src={user?.imageUrl} alt="Profile photo of the user" /> : <AvatarFallback className="bg-slate-900 text-white text-xs">U</AvatarFallback>}
                </Avatar>
                <div className="space-y-2">
                    <div className="bg-rose-600 text-white rounded-2xl rounded-tr-none p-4 text-sm shadow-md">
                        <p>Explain the Single Responsibility Principle with an example from the book.</p>
                    </div>
                </div>
            </div>

             {/* AI Message (Streaming/Loading state) */}
             <div className="flex gap-4">
                <Avatar className="h-8 w-8 border border-rose-100">
                    <AvatarFallback className="bg-rose-100 text-rose-600 text-xs">AI</AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-none p-4 text-sm text-slate-700 shadow-sm w-fit">
                        <div className="flex gap-1 items-center h-4">
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                        </div>
                    </div>
                </div>
            </div>

        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-100">
        <div className="max-w-3xl mx-auto relative flex items-center gap-2">
            <Input 
                placeholder="Ask a question about your document..." 
                className="pr-12 py-6 text-base bg-slate-50 border-slate-200 focus-visible:ring-rose-500 rounded-xl"
            />
            <Button 
                size="icon" 
                className="absolute right-2 h-8 w-8 bg-rose-600 hover:bg-rose-700 rounded-lg transition-all"
            >
                <Icons.arrowRight className="w-4 h-4 text-white" strokeWidth={2.5} />
            </Button>
        </div>
        <p className="text-center text-xs text-slate-400 mt-2">
            AI can make mistakes. Please verify important information.
        </p>
      </div>

    </div>
  );
}