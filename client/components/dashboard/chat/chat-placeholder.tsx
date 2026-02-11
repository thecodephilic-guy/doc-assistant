"use client";

import { useState } from "react";
import { Icons } from "@/components/common/icons";
import { UploadModal } from "../upload-modal";
import { useDocuments } from "@/lib/hooks/use-documents";
import type { Document } from "@/lib/types";

interface ChatPlaceholderProps {
  onSelectDocument?: (document: Document) => void;
}

export function ChatPlaceholder({ onSelectDocument }: ChatPlaceholderProps) {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const { documents, loading } = useDocuments();

  const handleUploadSuccess = (document: Document) => {
    setUploadModalOpen(false);
    onSelectDocument?.(document);
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center h-full p-6 bg-gradient-to-br from-slate-50 via-white to-rose-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-rose-950/10 transition-colors">
        <div className="max-w-2xl w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          {/* Icon */}
          <div className="flex justify-center">
            <div className="relative group">
              <div className="absolute inset-0 bg-rose-500/20 dark:bg-rose-500/10 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-500" />
              <div className="relative p-6 bg-gradient-to-br from-rose-500 to-rose-600 rounded-3xl shadow-xl shadow-rose-500/20 dark:shadow-rose-500/10 group-hover:shadow-2xl group-hover:shadow-rose-500/30 dark:group-hover:shadow-rose-500/20 transition-all duration-300 group-hover:scale-110">
                <Icons.fileText className="w-12 h-12 text-white" strokeWidth={2} />
              </div>
            </div>
          </div>

          {/* Text */}
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
              Start a Conversation
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              Upload a PDF document or select from your library to begin chatting with AI
            </p>
          </div>

          {/* Upload Button */}
          <div className="flex justify-center">
            <button
              onClick={() => setUploadModalOpen(true)}
              className="group relative px-8 py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold shadow-lg shadow-rose-500/30 hover:shadow-xl hover:shadow-rose-500/40 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-3"
            >
              <Icons.upload className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
              <span>Upload New PDF</span>
            </button>
          </div>

          {/* Recent Documents */}
          {loading ? (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 text-center">
                Loading your documents...
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 animate-pulse"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : documents.length > 0 ? (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200">
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 text-center">
                Or continue with a recent document
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {documents.slice(0, 4).map((doc, index) => (
                  <button
                    key={doc.id}
                    onClick={() => onSelectDocument?.(doc)}
                    className="group p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-700 hover:shadow-lg hover:shadow-rose-500/10 transition-all duration-300 text-left hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      animationDelay: `${index * 50}ms`,
                      animation: 'fadeInUp 0.5s ease-out forwards',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-rose-50 dark:bg-rose-900/30 rounded-lg group-hover:bg-rose-100 dark:group-hover:bg-rose-900/50 transition-all duration-300 group-hover:scale-110">
                        <Icons.fileText className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="font-medium text-slate-900 dark:text-white truncate group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors duration-200">
                          {doc.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(doc.uploadedAt).toLocaleDateString()} • {(doc.size / 1024 / 1024).toFixed(1)} MB
                        </p>
                      </div>
                      <Icons.arrowRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 dark:group-hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center animate-in fade-in duration-500 delay-300">
              No documents yet. Upload your first PDF to get started!
            </p>
          )}
        </div>
      </div>

      <UploadModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        onSuccess={handleUploadSuccess}
      />

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}