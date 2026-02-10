"use client";

import { Button } from "@/components/ui/button";
import { Icons } from "@/components/common/icons";
import UploadCard from "../common/upload-card";

interface ChatPlaceholderProps {
  onUpload: () => void;
  onSelect: (fileId: string) => void;
}

// Mock Data for files user has uploaded but isn't currently chatting with
const EXISTING_FILES = [
  { id: "1", name: "Clean Code_Robert_Martin.pdf", size: "2.4 MB", date: "Uploaded 2 days ago" },
  { id: "2", name: "Q3_Financial_Report.pdf", size: "1.1 MB", date: "Uploaded 5 days ago" },
  { id: "3", name: "React_Documentation.pdf", size: "4.5 MB", date: "Uploaded 1 week ago" },
];

export function ChatPlaceholder({ onUpload, onSelect }: ChatPlaceholderProps) {
  return (
    <div className="flex-1 h-full flex flex-col items-center justify-center p-4 sm:p-8 bg-slate-50/50">
      <div className="max-w-2xl w-full space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-rose-100 flex items-center justify-center mx-auto mb-4">
            <Icons.messageSquare className="w-8 h-8 text-rose-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Start a new conversation</h2>
          <p className="text-slate-500">
            Upload a new document or choose from your existing library to begin.
          </p>
        </div>

        {/* Action 1: Upload Card */}
        <UploadCard onUpload={onUpload} />
        
        {/* Divider with Text */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-slate-50/50 px-2 text-slate-500">Or select from library</span>
          </div>
        </div>

        {/* Action 2: Existing Files List */}
        <div className="space-y-3">
            {EXISTING_FILES.map((file) => (
                <div 
                    key={file.id} 
                    onClick={() => onSelect(file.id)}
                    className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl hover:border-rose-200 hover:shadow-sm cursor-pointer transition-all group"
                >
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-rose-100 group-hover:text-rose-600 transition-colors">
                        <Icons.fileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-900 truncate group-hover:text-rose-700 transition-colors">
                            {file.name}
                        </h4>
                        <p className="text-xs text-slate-400 flex items-center gap-2">
                            <span>{file.size}</span>
                            <span>•</span>
                            <span>{file.date}</span>
                        </p>
                    </div>
                    <Button variant="ghost" size="icon" className="text-slate-400 group-hover:text-rose-500">
                        <Icons.arrowRight className="w-4 h-4" />
                    </Button>
                </div>
            ))}
        </div>

      </div>
    </div>
  );
}