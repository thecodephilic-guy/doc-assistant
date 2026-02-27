"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Icons } from "@/components/common/icons";
import { useDocuments } from "@/lib/hooks/use-documents";
import type { Document } from "@/lib/types";

interface UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (document: Document) => void;
}

export function UploadModal({ open, onOpenChange, onSuccess }: UploadModalProps) {
  const { upload } = useDocuments();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    multiple: false,
  });

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      setError(null);
      setProgress(0);

      // Simulate progress (in real app, you'd track actual upload progress)
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const document = await upload(selectedFile);

      clearInterval(progressInterval);
      setProgress(100);

      // Success!
      setTimeout(() => {
        onSuccess?.(document);
        onOpenChange(false);
        // Reset state
        setSelectedFile(null);
        setProgress(0);
        setUploading(false);
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setUploading(false);
      setProgress(0);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      onOpenChange(false);
      setSelectedFile(null);
      setError(null);
      setProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload PDF Document</DialogTitle>
          <DialogDescription>
            Upload a PDF file to start analyzing and asking questions about it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Dropzone */}
          {!selectedFile && (
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
                ${isDragActive
                  ? "border-rose-500 bg-rose-50 dark:bg-rose-950/20"
                  : "border-slate-300 dark:border-slate-700 hover:border-rose-400 dark:hover:border-rose-600 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }
              `}
            >
              <input {...getInputProps()} />
              <Icons.upload className="w-12 h-12 mx-auto mb-4 text-slate-400 dark:text-slate-600" />
              {isDragActive ? (
                <p className="text-sm text-rose-600 dark:text-rose-400 font-medium">
                  Drop your PDF here...
                </p>
              ) : (
                <>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                    Drag & drop a PDF file here, or click to select
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-500">
                    Maximum file size: 10MB
                  </p>
                </>
              )}
            </div>
          )}

          {/* Selected File */}
          {selectedFile && !uploading && (
            <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-lg">
                <Icons.fileText className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedFile(null)}
                className="text-slate-400 hover:text-rose-600"
              >
                <Icons.close className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <Icons.spinner className="w-5 h-5 text-rose-600 animate-spin" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    Uploading {selectedFile?.name}...
                  </p>
                  <Progress value={progress} className="mt-2" />
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={handleClose}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
