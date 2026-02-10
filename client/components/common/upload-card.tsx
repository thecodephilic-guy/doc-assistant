"use client";

import { useState, useCallback } from "react";
import { useDropzone, FileRejection } from "react-dropzone";
import { Icons } from "@/components/common/icons"; 
import { cn } from "@/lib/utils"; 
import { Button } from "@/components/ui/button";
import { formatFileSize } from "@/lib/helpers";

interface UploadCardProps {
  onUpload: (file: File) => void;
}

function UploadCard({ onUpload }: UploadCardProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    setIsDragOver(false);

    if (rejectedFiles.length > 0) {
      setError("Only PDF files are allowed.");
      return;
    }

    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setError(null);
    }
  }, []);

  // 2. SETUP: Initialize react-dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDragEnter: () => setIsDragOver(true),
    onDragLeave: () => setIsDragOver(false),
    accept: { "application/pdf": [".pdf"] }, // STRICT: Only PDFs
    maxFiles: 1, // STRICT: Single file only
  });


  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setError(null);
  };

  return (
    <div className="w-full  mx-auto space-y-4">
    
      <div
        {...getRootProps()}
        className={cn(
          "group relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer flex flex-col items-center justify-center text-center outline-none",
          "h-64 p-8 gap-4",
          isDragActive 
            ? "border-rose-500 bg-rose-50/50 scale-[0.99]" 
            : "border-slate-200 bg-white hover:border-rose-400/50 hover:bg-slate-50/50",
          error && "border-red-500 bg-red-50/10"
        )}
      >
        <input {...getInputProps()} />

        {/* UI STATE 1: FILE SELECTED (PREVIEW) */}
        {file ? (
          <div className="w-full flex flex-col items-center animate-in fade-in zoom-in duration-300">
            <div className="relative w-16 h-16 mb-4 rounded-xl bg-rose-100 flex items-center justify-center shadow-sm">
              <Icons.fileText className="w-8 h-8 text-rose-600" />
              {/* Checkmark badge */}
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            {/* File Details */}
            <div className="space-y-1">
              <p className="font-semibold text-slate-900 text-lg truncate max-w-50">
                {file.name}
              </p>
              <p className="text-sm text-slate-500 font-medium">
                {formatFileSize(file.size)}
              </p>
            </div>

            {/* Remove Button */}
            <button 
                onClick={removeFile}
                className="mt-6 text-xs text-rose-500 hover:text-rose-700 font-medium hover:underline flex items-center gap-1 transition-colors"
            >
                <Icons.trash className="w-3 h-3" />
                Remove file
            </button>
          </div>
        ) : (
          /* UI STATE 2: EMPTY  */
          <>
            <div className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm",
              isDragActive ? "bg-rose-200 scale-110" : "bg-rose-50 group-hover:scale-110"
            )}>
              <Icons.upload className={cn(
                "w-8 h-8 transition-colors duration-300", 
                isDragActive ? "text-rose-700" : "text-rose-600"
              )} />
            </div>
            
            <div className="space-y-2">
               <h3 className={cn(
                 "font-bold text-lg transition-colors",
                 isDragActive ? "text-rose-700" : "text-slate-900"
               )}>
                 {isDragActive ? "Drop PDF here" : "Upload PDF"}
               </h3>
               <p className="text-sm text-slate-500 max-w-xs mx-auto">
                 {error ? (
                    <span className="text-red-500 font-medium animate-pulse">{error}</span>
                 ) : (
                    "Drag & drop your file here, or click to browse"
                 )}
               </p>
            </div>
          </>
        )}
      </div>

      {/* 3. ACTION: The Upload Button (Only visible when file is ready) */}
      {file && (
        <Button 
            onClick={() => onUpload(file)}
            className="w-full h-12 text-base font-medium bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-200/50 transition-all active:scale-[0.98]"
        >
          Start Analysis
        </Button>
      )}
    </div>
  );
}

export default UploadCard;